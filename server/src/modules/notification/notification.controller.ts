import { Controller, Get, Put, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationType } from '../notification/entities/notification.entity';

interface RequestWithUser {
  user: { id: string; phone: string };
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取通知列表' })
  async getNotifications(
    @Request() req: RequestWithUser,
    @Query('type') type?: NotificationType,
    @Query('read') read?: boolean,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.notificationService.getNotifications(req.user.id, {
      type,
      read,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读数量' })
  async getUnreadCount(@Request() req: RequestWithUser) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记已读' })
  async markAsRead(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Put('read-all')
  @ApiOperation({ summary: '全部已读' })
  async markAllAsRead(@Request() req: RequestWithUser) {
    return this.notificationService.markAllAsRead(req.user.id);
  }
}