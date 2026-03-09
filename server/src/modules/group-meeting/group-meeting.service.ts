import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { GroupMeeting, MeetingStatus } from './entities/group-meeting.entity'
import { CreateMeetingDto, UpdateMeetingDto } from './dto'
import { RoundTableParticipant, ParticipantStatus } from '../roundtable/entities/roundtable-participant.entity'
import { RoundTable, RoundTableStatus } from '../roundtable/entities/roundtable.entity'
import { Event } from '../event/entities/event.entity'
import { UserEvent, UserEventAction } from '../event/entities/user-event.entity'
import { NotificationService } from '../notification/notification.service'
import { NotificationType } from '../notification/entities/notification.entity'

/**
 * 时间冲突信息
 */
export interface TimeConflict {
  userId: string
  nickname: string
  events: Array<{
    id: string
    title: string
    eventDate: string
    startTime: string
    endTime: string
  }>
}

/**
 * 格式化后的会议
 */
export interface FormattedMeeting {
  id: string
  groupId: string
  title: string
  scheduledAt: string
  duration: number
  meetingUrl: string | null
  location: string | null
  notes: string | null
  status: MeetingStatus
  createdBy: string
  creatorNickname: string
  createdAt: string
}

/**
 * 群组会议服务
 * TASK-4.5: 发起会议功能
 */
@Injectable()
export class GroupMeetingService {
  private readonly logger = new Logger(GroupMeetingService.name)

  constructor(
    @InjectRepository(GroupMeeting)
    private meetingRepository: Repository<GroupMeeting>,
    @InjectRepository(RoundTableParticipant)
    private participantRepository: Repository<RoundTableParticipant>,
    @InjectRepository(RoundTable)
    private roundTableRepository: Repository<RoundTable>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(UserEvent)
    private userEventRepository: Repository<UserEvent>,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  /**
   * 创建会议
   * POST /api/groups/:id/meetings
   */
  async createMeeting(groupId: string, leaderId: string, dto: CreateMeetingDto) {
    // 1. 验证群组存在
    const roundTable = await this.roundTableRepository.findOne({
      where: { id: groupId },
    })

    if (!roundTable) {
      throw new NotFoundException({
        success: false,
        code: 'GROUP_NOT_FOUND',
        message: '群组不存在',
      })
    }

    // 2. 验证是否为组长
    const leader = await this.participantRepository.findOne({
      where: { roundTableId: groupId, userId: leaderId, isLeader: true },
    })

    if (!leader) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_LEADER',
        message: '只有组长可以发起会议',
      })
    }

    // 3. 获取所有活跃成员
    const members = await this.participantRepository.find({
      where: {
        roundTableId: groupId,
        status: In([
          ParticipantStatus.MATCHED,
          ParticipantStatus.JOINED,
          ParticipantStatus.LEADER_CONFIRMED,
        ]),
      },
      relations: ['user'],
    })

    // 4. 时间冲突检测
    const scheduledAt = new Date(dto.scheduledAt)
    const duration = dto.duration || 120

    const conflicts = await this.detectTimeConflicts(
      members.map(m => m.userId),
      scheduledAt,
      duration,
    )

    if (conflicts.length > 0) {
      throw new BadRequestException({
        success: false,
        code: 'TIME_CONFLICT',
        message: '所选时间与成员已有事件冲突',
        conflicts,
      })
    }

    // 5. 创建会议
    const meeting = this.meetingRepository.create({
      groupId,
      title: dto.title,
      scheduledAt,
      duration,
      meetingUrl: dto.meetingUrl || null,
      location: dto.location || null,
      notes: dto.notes || null,
      status: MeetingStatus.SCHEDULED,
      createdBy: leaderId,
    })
    await this.meetingRepository.save(meeting)

    // 6. 同步到成员日历（创建事件）
    await this.syncToMembersCalendar(meeting, members, roundTable)

    // 7. 发送通知（TODO: 实现通知系统）
    await this.notifyMeetingCreated(groupId, meeting, members)

    this.logger.log(`Meeting created for group ${groupId} by leader ${leaderId}`)

    return {
      success: true,
      data: await this.formatMeeting(meeting, leader.user?.nickname || '匿名用户'),
    }
  }

  /**
   * 获取群组的会议列表
   * GET /api/groups/:id/meetings
   */
  async getMeetings(groupId: string, userId: string) {
    // 验证用户是否是群组成员
    const participant = await this.participantRepository.findOne({
      where: { roundTableId: groupId, userId },
    })

    if (!participant) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: '你不是该群组的成员',
      })
    }

    const meetings = await this.meetingRepository.find({
      where: { groupId },
      relations: ['creator'],
      order: { scheduledAt: 'ASC' },
    })

    return {
      success: true,
      data: {
        meetings: meetings.map(m =>
          this.formatMeeting(m, m.creator?.nickname || '匿名用户')
        ),
      },
    }
  }

  /**
   * 获取会议详情
   * GET /api/groups/:id/meetings/:meetingId
   */
  async getMeetingDetail(groupId: string, meetingId: string, userId: string) {
    // 验证用户是否是群组成员
    const participant = await this.participantRepository.findOne({
      where: { roundTableId: groupId, userId },
    })

    if (!participant) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: '你不是该群组的成员',
      })
    }

    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, groupId },
      relations: ['creator'],
    })

    if (!meeting) {
      throw new NotFoundException({
        success: false,
        code: 'MEETING_NOT_FOUND',
        message: '会议不存在',
      })
    }

    return {
      success: true,
      data: this.formatMeeting(meeting, meeting.creator?.nickname || '匿名用户'),
    }
  }

  /**
   * 更新会议
   * PUT /api/groups/:id/meetings/:meetingId
   */
  async updateMeeting(
    groupId: string,
    meetingId: string,
    leaderId: string,
    dto: UpdateMeetingDto,
  ) {
    // 验证是否为组长
    const leader = await this.participantRepository.findOne({
      where: { roundTableId: groupId, userId: leaderId, isLeader: true },
    })

    if (!leader) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_LEADER',
        message: '只有组长可以更新会议',
      })
    }

    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, groupId },
    })

    if (!meeting) {
      throw new NotFoundException({
        success: false,
        code: 'MEETING_NOT_FOUND',
        message: '会议不存在',
      })
    }

    // 如果更新时间，需要检测冲突
    if (dto.scheduledAt || dto.duration) {
      const newScheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : meeting.scheduledAt
      const newDuration = dto.duration || meeting.duration

      const members = await this.participantRepository.find({
        where: {
          roundTableId: groupId,
          status: In([
            ParticipantStatus.MATCHED,
            ParticipantStatus.JOINED,
            ParticipantStatus.LEADER_CONFIRMED,
          ]),
        },
      })

      const conflicts = await this.detectTimeConflicts(
        members.map(m => m.userId),
        newScheduledAt,
        newDuration,
        meetingId, // 排除当前会议关联的事件
      )

      if (conflicts.length > 0) {
        throw new BadRequestException({
          success: false,
          code: 'TIME_CONFLICT',
          message: '所选时间与成员已有事件冲突',
          conflicts,
        })
      }
    }

    // 更新会议
    Object.assign(meeting, {
      title: dto.title ?? meeting.title,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : meeting.scheduledAt,
      duration: dto.duration ?? meeting.duration,
      meetingUrl: dto.meetingUrl ?? meeting.meetingUrl,
      location: dto.location ?? meeting.location,
      notes: dto.notes ?? meeting.notes,
    })
    await this.meetingRepository.save(meeting)

    this.logger.log(`Meeting ${meetingId} updated by leader ${leaderId}`)

    return {
      success: true,
      data: await this.formatMeeting(meeting, leader.user?.nickname || '匿名用户'),
    }
  }

  /**
   * 取消会议
   * DELETE /api/groups/:id/meetings/:meetingId
   */
  async cancelMeeting(groupId: string, meetingId: string, leaderId: string) {
    // 验证是否为组长
    const leader = await this.participantRepository.findOne({
      where: { roundTableId: groupId, userId: leaderId, isLeader: true },
    })

    if (!leader) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_LEADER',
        message: '只有组长可以取消会议',
      })
    }

    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, groupId },
    })

    if (!meeting) {
      throw new NotFoundException({
        success: false,
        code: 'MEETING_NOT_FOUND',
        message: '会议不存在',
      })
    }

    meeting.status = MeetingStatus.CANCELLED
    await this.meetingRepository.save(meeting)

    // 删除关联的日历事件和用户关联
    await this.userEventRepository.delete({ eventId: meeting.id })
    await this.eventRepository.delete({ relatedId: meetingId })

    this.logger.log(`Meeting ${meetingId} cancelled by leader ${leaderId}`)

    return {
      success: true,
      data: {
        cancelled: true,
      },
    }
  }

  /**
   * 时间冲突检测
   * 检查所有成员在指定时间段是否有其他事件
   */
  private async detectTimeConflicts(
    userIds: string[],
    startTime: Date,
    duration: number,
    excludeMeetingId?: string,
  ): Promise<TimeConflict[]> {
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

    // 获取会议日期和时间
    const meetingDate = startTime.toISOString().split('T')[0]
    const meetingStartTime = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`
    const meetingEndTime = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`

    const conflicts: TimeConflict[] = []

    for (const userId of userIds) {
      // 查询该用户关注的事件
      const events = await this.eventRepository
        .createQueryBuilder('event')
        .innerJoin('event.followers', 'userEvent')
        .where('userEvent.userId = :userId', { userId })
        .andWhere('event.eventDate = :meetingDate', { meetingDate })
        .andWhere('event.startTime IS NOT NULL')
        .andWhere('event.endTime IS NOT NULL')
        .andWhere(
          '(event.startTime < :meetingEndTime AND event.endTime > :meetingStartTime)',
          { meetingStartTime, meetingEndTime },
        )
        .getMany()

      if (events.length > 0) {
        // 获取用户昵称
        const participant = await this.participantRepository.findOne({
          where: { userId },
          relations: ['user'],
        })

        conflicts.push({
          userId,
          nickname: participant?.user?.nickname || '匿名用户',
          events: events.map(e => ({
            id: e.id,
            title: e.title,
            eventDate: e.eventDate,
            startTime: e.startTime || '',
            endTime: e.endTime || '',
          })),
        })
      }
    }

    return conflicts
  }

  /**
   * 同步会议到成员日历
   * 为每个成员创建一个事件
   */
  private async syncToMembersCalendar(
    meeting: GroupMeeting,
    members: RoundTableParticipant[],
    roundTable: RoundTable,
  ) {
    const meetingDate = meeting.scheduledAt.toISOString().split('T')[0]
    const endTime = new Date(meeting.scheduledAt.getTime() + meeting.duration * 60 * 1000)
    const startTime = `${String(meeting.scheduledAt.getHours()).padStart(2, '0')}:${String(meeting.scheduledAt.getMinutes()).padStart(2, '0')}`
    const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`

    for (const member of members) {
      const event = this.eventRepository.create({
        title: `群组会议: ${meeting.title}`,
        company: roundTable.topic || '群组讨论',
        eventDate: meetingDate,
        startTime,
        endTime: endTimeStr,
        location: meeting.location || meeting.meetingUrl || '',
        description: meeting.notes || `群组会议 - ${roundTable.topic}`,
        status: 'active',
        relatedId: meeting.id,
      })
      await this.eventRepository.save(event)

      // 创建用户与事件的关联
      const userEvent = this.userEventRepository.create({
        userId: member.userId,
        eventId: event.id,
        action: UserEventAction.FOLLOW,
      })
      await this.userEventRepository.save(userEvent)
    }

    this.logger.log(`Meeting synced to calendar for ${members.length} members`)
  }

  /**
   * 发送会议创建通知
   */
  private async notifyMeetingCreated(
    groupId: string,
    meeting: GroupMeeting,
    members: RoundTableParticipant[],
  ) {
    const formattedTime = meeting.scheduledAt.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

    for (const member of members) {
      // 不给创建者发通知
      if (member.userId === meeting.createdBy) {
        continue
      }

      await this.notificationService.createNotification({
        userId: member.userId,
        type: NotificationType.ROUND_TABLE_INVITE,
        title: '新会议已创建',
        content: `会议"${meeting.title}"已安排在 ${formattedTime}`,
        data: {
          meetingId: meeting.id,
          groupId,
          scheduledAt: meeting.scheduledAt.toISOString(),
          duration: meeting.duration,
        },
      })
    }

    this.logger.log(
      `Meeting notification sent to ${members.length - 1} members for group ${groupId}`,
    )
  }

  /**
   * 格式化会议数据
   */
  private formatMeeting(meeting: GroupMeeting, creatorNickname: string): FormattedMeeting {
    return {
      id: meeting.id,
      groupId: meeting.groupId,
      title: meeting.title,
      scheduledAt: meeting.scheduledAt.toISOString(),
      duration: meeting.duration,
      meetingUrl: meeting.meetingUrl,
      location: meeting.location,
      notes: meeting.notes,
      status: meeting.status,
      createdBy: meeting.createdBy,
      creatorNickname,
      createdAt: meeting.createdAt.toISOString(),
    }
  }
}