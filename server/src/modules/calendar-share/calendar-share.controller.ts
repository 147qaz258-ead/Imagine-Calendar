import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common'
import { CalendarShareService } from './calendar-share.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AvailabilityQueryDto } from './dto'

interface RequestWithUser {
  user: { id: string; phone: string }
}

@ApiTags('calendar-share')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('round-tables')
export class CalendarShareController {
  constructor(private readonly calendarShareService: CalendarShareService) {}

  /**
   * 发起日历共享邀请
   * POST /api/round-tables/:id/share-calendar
   * TASK-4.4: 组长发起点历共享邀请
   */
  @Post(':id/share-calendar')
  @ApiOperation({ summary: '发起日历共享邀请' })
  async requestCalendarShare(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.calendarShareService.requestCalendarShare(id, req.user.id)
  }

  /**
   * 接受日历共享
   * PUT /api/round-tables/:id/share-calendar/:shareId/accept
   * TASK-4.4: 成员接受共享
   */
  @Put(':id/share-calendar/:shareId/accept')
  @ApiOperation({ summary: '接受日历共享邀请' })
  async acceptCalendarShare(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return this.calendarShareService.acceptCalendarShare(shareId, req.user.id)
  }

  /**
   * 拒绝日历共享
   * PUT /api/round-tables/:id/share-calendar/:shareId/decline
   * TASK-4.4: 成员拒绝共享
   */
  @Put(':id/share-calendar/:shareId/decline')
  @ApiOperation({ summary: '拒绝日历共享邀请' })
  async declineCalendarShare(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    return this.calendarShareService.declineCalendarShare(shareId, req.user.id)
  }

  /**
   * 获取共享状态
   * GET /api/round-tables/:id/share-calendar/status
   * TASK-4.4: 获取共享状态概览
   */
  @Get(':id/share-calendar/status')
  @ApiOperation({ summary: '获取日历共享状态' })
  async getShareStatus(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.calendarShareService.getShareStatus(id, req.user.id)
  }

  /**
   * 查看成员空闲时间
   * GET /api/round-tables/:id/members-availability
   * TASK-4.4: 组长查看成员空闲时间
   */
  @Get(':id/members-availability')
  @ApiOperation({ summary: '查看成员空闲时间' })
  async getMembersAvailability(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.calendarShareService.getMembersAvailability(
      id,
      req.user.id,
      query.startDate,
      query.endDate,
    )
  }
}