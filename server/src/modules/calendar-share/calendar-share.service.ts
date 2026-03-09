import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { CalendarShare, CalendarShareStatus } from './entities/calendar-share.entity'
import { RoundTableParticipant, ParticipantStatus, ParticipantRole } from '../roundtable/entities/roundtable-participant.entity'
import { RoundTable, RoundTableStatus } from '../roundtable/entities/roundtable.entity'
import { Event } from '../event/entities/event.entity'

/**
 * 成员空闲时间段
 */
export interface AvailabilitySlot {
  date: string
  startTime: string
  endTime: string
  status: 'available' | 'busy'
}

/**
 * 成员空闲时间信息
 */
export interface MemberAvailability {
  userId: string
  nickname: string
  avatar: string | null
  slots: AvailabilitySlot[]
}

/**
 * 日历共享服务
 * TASK-4.4: 日历共享功能
 */
@Injectable()
export class CalendarShareService {
  private readonly logger = new Logger(CalendarShareService.name)

  constructor(
    @InjectRepository(CalendarShare)
    private calendarShareRepository: Repository<CalendarShare>,
    @InjectRepository(RoundTableParticipant)
    private participantRepository: Repository<RoundTableParticipant>,
    @InjectRepository(RoundTable)
    private roundTableRepository: Repository<RoundTable>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  /**
   * 组长发起点历共享邀请
   * POST /api/groups/:id/share-calendar
   */
  async requestCalendarShare(groupId: string, leaderId: string) {
    // 验证群组存在
    const roundTable = await this.roundTableRepository.findOne({
      where: { id: groupId },
      relations: ['participants', 'participants.user'],
    })

    if (!roundTable) {
      throw new NotFoundException({
        success: false,
        code: 'GROUP_NOT_FOUND',
        message: '群组不存在',
      })
    }

    // 验证用户是组长
    const leaderParticipant = roundTable.participants.find(
      (p) => p.userId === leaderId && p.isLeader === true,
    )

    if (!leaderParticipant) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_LEADER',
        message: '只有组长可以发起日历共享邀请',
      })
    }

    // 获取所有成员（不包括组长自己）
    const members = roundTable.participants.filter(
      (p) =>
        p.userId !== leaderId &&
        p.status !== ParticipantStatus.LEFT &&
        p.status !== ParticipantStatus.CANCELLED,
    )

    if (members.length === 0) {
      throw new BadRequestException({
        success: false,
        code: 'NO_MEMBERS',
        message: '群组中没有其他成员',
      })
    }

    // 为每个成员创建共享邀请（如果不存在）
    const existingShares = await this.calendarShareRepository.find({
      where: { groupId, viewerId: leaderId },
    })

    const existingUserIds = new Set(existingShares.map((s) => s.userId))
    const newShares: CalendarShare[] = []

    for (const member of members) {
      if (!existingUserIds.has(member.userId)) {
        const share = this.calendarShareRepository.create({
          userId: member.userId,
          viewerId: leaderId,
          groupId,
          status: CalendarShareStatus.PENDING,
        })
        newShares.push(share)
      }
    }

    if (newShares.length > 0) {
      await this.calendarShareRepository.save(newShares)
    }

    this.logger.log(`Calendar share requested for group ${groupId} by leader ${leaderId}`)

    // 返回所有共享状态
    const allShares = await this.calendarShareRepository.find({
      where: { groupId, viewerId: leaderId },
      relations: ['user'],
    })

    return {
      success: true,
      data: {
        shares: allShares.map((s) => ({
          id: s.id,
          userId: s.userId,
          nickname: s.user?.nickname || '匿名用户',
          avatar: s.user?.avatar,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        })),
      },
    }
  }

  /**
   * 成员接受共享
   * PUT /api/round-tables/:id/share-calendar/:shareId/accept
   */
  async acceptCalendarShare(shareId: string, userId: string) {
    const share = await this.calendarShareRepository.findOne({
      where: { id: shareId },
    })

    if (!share) {
      throw new NotFoundException({
        success: false,
        code: 'SHARE_NOT_FOUND',
        message: '没有找到共享邀请',
      })
    }

    // 验证用户是该共享邀请的被邀请者
    if (share.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_SHARE_RECIPIENT',
        message: '无权处理此邀请',
      })
    }

    if (share.status !== CalendarShareStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        code: 'SHARE_ALREADY_PROCESSED',
        message: '该邀请已被处理',
      })
    }

    share.status = CalendarShareStatus.ACCEPTED
    share.sharedAt = new Date()
    await this.calendarShareRepository.save(share)

    this.logger.log(`User ${userId} accepted calendar share ${shareId}`)

    return {
      success: true,
      data: {
        status: share.status,
        sharedAt: share.sharedAt.toISOString(),
      },
    }
  }

  /**
   * 成员拒绝共享
   * PUT /api/round-tables/:id/share-calendar/:shareId/decline
   */
  async declineCalendarShare(shareId: string, userId: string) {
    const share = await this.calendarShareRepository.findOne({
      where: { id: shareId },
    })

    if (!share) {
      throw new NotFoundException({
        success: false,
        code: 'SHARE_NOT_FOUND',
        message: '没有找到共享邀请',
      })
    }

    // 验证用户是该共享邀请的被邀请者
    if (share.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_SHARE_RECIPIENT',
        message: '无权处理此邀请',
      })
    }

    if (share.status !== CalendarShareStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        code: 'SHARE_ALREADY_PROCESSED',
        message: '该邀请已被处理',
      })
    }

    share.status = CalendarShareStatus.DECLINED
    await this.calendarShareRepository.save(share)

    this.logger.log(`User ${userId} declined calendar share ${shareId}`)

    return {
      success: true,
      data: {
        status: share.status,
      },
    }
  }

  /**
   * 获取我的共享邀请列表
   * GET /api/groups/:id/share-calendar/my
   */
  async getMyCalendarShares(groupId: string, userId: string) {
    const shares = await this.calendarShareRepository.find({
      where: { groupId, userId },
      relations: ['viewer'],
    })

    return {
      success: true,
      data: {
        shares: shares.map((s) => ({
          id: s.id,
          viewerId: s.viewerId,
          viewerNickname: s.viewer?.nickname || '匿名用户',
          viewerAvatar: s.viewer?.avatar,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          sharedAt: s.sharedAt?.toISOString() || null,
        })),
      },
    }
  }

  /**
   * 组长查看成员空闲时间
   * GET /api/groups/:id/members-availability
   */
  async getMembersAvailability(
    groupId: string,
    leaderId: string,
    startDate: string,
    endDate: string,
  ) {
    // 验证用户是组长
    const participant = await this.participantRepository.findOne({
      where: { roundTableId: groupId, userId: leaderId, isLeader: true },
    })

    if (!participant) {
      throw new ForbiddenException({
        success: false,
        code: 'NOT_LEADER',
        message: '只有组长可以查看成员空闲时间',
      })
    }

    // 获取已接受共享的成员
    const acceptedShares = await this.calendarShareRepository.find({
      where: { groupId, viewerId: leaderId, status: CalendarShareStatus.ACCEPTED },
      relations: ['user'],
    })

    if (acceptedShares.length === 0) {
      return {
        success: true,
        data: {
          availability: [],
          message: '没有成员接受日历共享',
        },
      }
    }

    // 获取每个成员的空闲时间
    const availability: MemberAvailability[] = await Promise.all(
      acceptedShares.map(async (share) => {
        const slots = await this.calculateUserAvailability(
          share.userId,
          startDate,
          endDate,
        )

        return {
          userId: share.userId,
          nickname: share.user?.nickname || '匿名用户',
          avatar: share.user?.avatar,
          slots,
        }
      }),
    )

    return {
      success: true,
      data: {
        startDate,
        endDate,
        availability,
      },
    }
  }

  /**
   * 获取群组的共享状态概览
   * GET /api/groups/:id/share-calendar/status
   */
  async getShareStatus(groupId: string, userId: string) {
    // 检查用户是否是组长
    const participant = await this.participantRepository.findOne({
      where: { roundTableId: groupId, userId },
    })

    if (!participant) {
      throw new NotFoundException({
        success: false,
        code: 'NOT_PARTICIPANT',
        message: '你不是该群组的参与者',
      })
    }

    const isLeader = participant.isLeader

    if (isLeader) {
      // 组长视角：查看所有成员的共享状态
      const shares = await this.calendarShareRepository.find({
        where: { groupId, viewerId: userId },
        relations: ['user'],
      })

      return {
        success: true,
        data: {
          isLeader: true,
          shares: shares.map((s) => ({
            id: s.id,
            userId: s.userId,
            nickname: s.user?.nickname || '匿名用户',
            avatar: s.user?.avatar,
            status: s.status,
            createdAt: s.createdAt.toISOString(),
            sharedAt: s.sharedAt?.toISOString() || null,
          })),
        },
      }
    } else {
      // 成员视角：查看组长发来的邀请
      const shares = await this.calendarShareRepository.find({
        where: { groupId, userId },
        relations: ['viewer'],
      })

      return {
        success: true,
        data: {
          isLeader: false,
          shares: shares.map((s) => ({
            id: s.id,
            viewerId: s.viewerId,
            viewerNickname: s.viewer?.nickname || '匿名用户',
            viewerAvatar: s.viewer?.avatar,
            status: s.status,
            createdAt: s.createdAt.toISOString(),
          })),
        },
      }
    }
  }

  /**
   * 计算用户的空闲时间
   * 只返回空闲/忙碌状态，不返回具体事件内容
   */
  private async calculateUserAvailability(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<AvailabilitySlot[]> {
    // 获取用户关注的事件
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.followers', 'userEvent')
      .where('userEvent.userId = :userId', { userId })
      .andWhere('event.eventDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany()

    // 生成日期范围内的所有时间段
    const slots: AvailabilitySlot[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 时间段定义：上午(9-12)、下午(14-18)、晚上(19-22)
    const timeSlots = [
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '18:00' },
      { startTime: '19:00', endTime: '22:00' },
    ]

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]

      for (const timeSlot of timeSlots) {
        // 检查该时间段是否有事件
        const hasEvent = events.some((e) => {
          if (e.eventDate !== dateStr) return false
          if (!e.startTime || !e.endTime) return false
          // 检查时间重叠
          return (
            e.startTime < timeSlot.endTime && e.endTime > timeSlot.startTime
          )
        })

        slots.push({
          date: dateStr,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          status: hasEvent ? 'busy' : 'available',
        })
      }
    }

    return slots
  }
}