import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Event, CompanyType } from './entities/event.entity';
import { UserEvent, UserEventAction } from './entities/user-event.entity';
import { CalendarQueryDto } from './dto';

/**
 * 事件服务
 * 实现日历核心功能
 */
@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(UserEvent)
    private userEventRepository: Repository<UserEvent>,
  ) {}

  /**
   * 获取日历事件
   * GET /api/events/calendar
   * 按年月查询事件列表
   */
  async getCalendarEvents(query: CalendarQueryDto) {
    const { year, month, companyType, industries } = query;

    // 计算月份的开始和结束日期
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    // 构建查询条件
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.eventDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    // 企业类型筛选
    if (companyType) {
      queryBuilder.andWhere('event.companyType = :companyType', {
        companyType,
      });
    }

    // 行业筛选（基于 tags 字段）
    if (industries && industries.length > 0) {
      queryBuilder.andWhere('event.tags && :industries', {
        industries,
      });
    }

    // 按日期排序
    queryBuilder.orderBy('event.eventDate', 'ASC').addOrderBy('event.startTime', 'ASC');

    const events = await queryBuilder.getMany();

    // 转换为日历事件格式
    const calendarEvents = events.map((event) => ({
      id: event.id,
      date: event.eventDate,
      title: event.title,
      company: event.company,
      companyType: event.companyType,
      position: event.position || '',
    }));

    return {
      success: true,
      data: {
        year,
        month,
        events: calendarEvents,
      },
    };
  }

  /**
   * 获取事件详情
   * GET /api/events/:id
   */
  async getEventDetail(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException({
        success: false,
        code: 'EVENT_NOT_FOUND',
        message: '事件不存在',
      });
    }

    return {
      success: true,
      data: {
        id: event.id,
        title: event.title,
        company: event.company,
        companyType: event.companyType,
        position: event.position,
        description: event.description,
        location: event.location,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        deadline: event.deadline?.toISOString(),
        requirements: event.requirements,
        benefits: event.benefits,
        applyUrl: event.applyUrl,
        tags: event.tags,
        source: event.source,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      },
    };
  }

  /**
   * 关注事件
   * POST /api/events/:id/follow
   */
  async followEvent(eventId: string, userId: string) {
    // 检查事件是否存在
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException({
        success: false,
        code: 'EVENT_NOT_FOUND',
        message: '事件不存在',
      });
    }

    // 检查是否已关注
    const existingFollow = await this.userEventRepository.findOne({
      where: {
        eventId,
        userId,
        action: UserEventAction.FOLLOW,
      },
    });

    if (existingFollow) {
      // 已关注，返回当前状态
      const followerCount = await this.getFollowerCount(eventId);
      return {
        success: true,
        data: {
          followed: true,
          followerCount,
        },
      };
    }

    // 创建关注记录
    const userEvent = this.userEventRepository.create({
      eventId,
      userId,
      action: UserEventAction.FOLLOW,
    });
    await this.userEventRepository.save(userEvent);

    const followerCount = await this.getFollowerCount(eventId);

    return {
      success: true,
      data: {
        followed: true,
        followerCount,
      },
    };
  }

  /**
   * 取消关注事件
   * DELETE /api/events/:id/follow
   */
  async unfollowEvent(eventId: string, userId: string) {
    // 检查事件是否存在
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException({
        success: false,
        code: 'EVENT_NOT_FOUND',
        message: '事件不存在',
      });
    }

    // 删除关注记录
    await this.userEventRepository.delete({
      eventId,
      userId,
      action: UserEventAction.FOLLOW,
    });

    const followerCount = await this.getFollowerCount(eventId);

    return {
      success: true,
      data: {
        followed: false,
        followerCount,
      },
    };
  }

  /**
   * 获取用户已关注的事件
   * GET /api/users/:id/followed-events
   */
  async getFollowedEvents(userId: string) {
    // 查询用户关注的事件ID
    const userEvents = await this.userEventRepository.find({
      where: {
        userId,
        action: UserEventAction.FOLLOW,
      },
      relations: ['event'],
      order: {
        createdAt: 'DESC',
      },
    });

    // 提取事件详情
    const events = userEvents
      .filter((ue) => ue.event) // 过滤掉已删除的事件
      .map((ue) => ({
        id: ue.event.id,
        title: ue.event.title,
        company: ue.event.company,
        companyType: ue.event.companyType,
        position: ue.event.position,
        description: ue.event.description,
        location: ue.event.location,
        eventDate: ue.event.eventDate,
        startTime: ue.event.startTime,
        endTime: ue.event.endTime,
        deadline: ue.event.deadline?.toISOString(),
        requirements: ue.event.requirements,
        benefits: ue.event.benefits,
        applyUrl: ue.event.applyUrl,
        tags: ue.event.tags,
        source: ue.event.source,
        createdAt: ue.event.createdAt.toISOString(),
        updatedAt: ue.event.updatedAt.toISOString(),
      }));

    return {
      success: true,
      data: events,
    };
  }

  /**
   * 获取事件关注数
   */
  private async getFollowerCount(eventId: string): Promise<number> {
    return this.userEventRepository.count({
      where: {
        eventId,
        action: UserEventAction.FOLLOW,
      },
    });
  }
}