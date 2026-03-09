import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Notification, NotificationType } from './entities/notification.entity'

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getNotifications(
    userId: string,
    options: {
      type?: NotificationType
      read?: boolean
      page: number
      pageSize: number
    },
  ) {
    const where: any = { userId }

    if (options.type) {
      where.type = options.type
    }

    if (options.read !== undefined) {
      where.read = options.read
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    })

    const unreadCount = await this.notificationRepository.count({
      where: { userId, read: false },
    })

    return {
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
      },
    }
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, read: false },
    })

    const byType = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.read = false')
      .groupBy('notification.type')
      .getRawMany()

    const byTypeResult = byType.reduce(
      (acc, item) => {
        acc[item.type] = parseInt(item.count)
        return acc
      },
      {} as Record<NotificationType, number>,
    )

    return {
      success: true,
      data: {
        count,
        byType: byTypeResult,
      },
    }
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    })

    if (!notification) {
      return {
        success: false,
        message: '通知不存在',
      }
    }

    notification.read = true
    notification.readAt = new Date()

    await this.notificationRepository.save(notification)

    return {
      success: true,
      data: {
        read: true,
        readAt: notification.readAt,
      },
    }
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    )

    return {
      success: true,
      data: {
        updatedCount: result.affected || 0,
      },
    }
  }

  async createNotification(data: {
    userId: string
    type: NotificationType
    title: string
    content: string
    data?: Record<string, any>
  }) {
    const notification = this.notificationRepository.create(data)
    await this.notificationRepository.save(notification)
    return notification
  }

  /**
   * 发送认知边界评估任务通知
   * 注册成功后触发
   */
  async sendCognitiveTaskNotification(userId: string) {
    return this.createNotification({
      userId,
      type: NotificationType.COGNITIVE_TASK,
      title: '认知边界评估任务',
      content: '请完成认知边界评估，帮助您更好地了解自己',
      data: { link: '/cognitive' },
    })
  }

  /**
   * 发送群组已满员通知
   * 群组满6人时触发
   */
  async sendGroupReadyNotification(groupId: string, userIds: string[]) {
    return Promise.all(
      userIds.map((userId) =>
        this.createNotification({
          userId,
          type: NotificationType.GROUP_READY,
          title: '群组已满员',
          content: '您的群组已满6人，请确认是否成为组长',
          data: { link: `/groups/${groupId}`, groupId },
        }),
      ),
    )
  }

  /**
   * 发送确认组长通知
   * 需要用户确认是否成为组长时触发
   */
  async sendLeaderConfirmNotification(userId: string, groupId: string) {
    return this.createNotification({
      userId,
      type: NotificationType.LEADER_CONFIRM,
      title: '请确认是否成为组长',
      content: '您被推荐为群组组长，请确认是否接受',
      data: { link: `/groups/${groupId}`, groupId },
    })
  }

  /**
   * 发送日历共享请求通知
   * 组长请求查看成员日历时触发
   */
  async sendCalendarShareRequestNotification(
    userId: string,
    requesterId: string,
    groupId: string,
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.CALENDAR_SHARE_REQUEST,
      title: '日历共享请求',
      content: '组长请求查看您的日历，请确认是否同意',
      data: { link: `/groups/${groupId}`, requesterId, groupId },
    })
  }

  /**
   * 发送会议创建通知
   * 会议创建成功后触发
   */
  async sendMeetingCreatedNotification(
    userId: string,
    meetingId: string,
    meetingTime: string,
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.MEETING_CREATED,
      title: '新会议已安排',
      content: `新会议已安排：${meetingTime}`,
      data: { link: `/meetings/${meetingId}`, meetingId, meetingTime },
    })
  }

  /**
   * 发送会议提醒通知
   * 会议前1小时触发
   */
  async sendMeetingReminderNotification(
    userId: string,
    meetingId: string,
    meetingTime: string,
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.MEETING_REMINDER,
      title: '会议即将开始',
      content: `会议将在1小时后开始：${meetingTime}`,
      data: { link: `/meetings/${meetingId}`, meetingId, meetingTime },
    })
  }
}
