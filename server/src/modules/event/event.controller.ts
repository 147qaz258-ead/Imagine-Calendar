import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarQueryDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';

interface RequestWithUser {
  user: { id: string; phone: string };
}

@ApiTags('events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Public()
  @Get('calendar')
  @ApiOperation({ summary: '获取日历事件' })
  async getCalendar(@Query() query: CalendarQueryDto) {
    return this.eventService.getCalendarEvents(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取事件详情' })
  async getEventDetail(@Param('id') id: string) {
    return this.eventService.getEventDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/follow')
  @ApiOperation({ summary: '关注事件' })
  async followEvent(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.eventService.followEvent(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id/follow')
  @ApiOperation({ summary: '取消关注事件' })
  async unfollowEvent(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.eventService.unfollowEvent(id, req.user.id);
  }
}