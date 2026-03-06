import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getNotifications(
    userId: string,
    options: {
      type?: NotificationType;
      read?: boolean;
      page: number;
      pageSize: number;
    },
  ) {
    const where: any = { userId };

    if (options.type) {
      where.type = options.type;
    }

    if (options.read !== undefined) {
      where.read = options.read;
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    return {
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    const byType = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.read = false')
      .groupBy('notification.type')
      .getRawMany();

    const byTypeResult = byType.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {} as Record<NotificationType, number>);

    return {
      success: true,
      data: {
        count,
        byType: byTypeResult,
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return {
        success: false,
        message: '通知不存在',
      };
    }

    notification.read = true;
    notification.readAt = new Date();

    await this.notificationRepository.save(notification);

    return {
      success: true,
      data: {
        read: true,
        readAt: notification.readAt,
      },
    };
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );

    return {
      success: true,
      data: {
        updatedCount: result.affected || 0,
      },
    };
  }

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    data?: Record<string, any>;
  }) {
    const notification = this.notificationRepository.create(data);
    await this.notificationRepository.save(notification);
    return notification;
  }
}