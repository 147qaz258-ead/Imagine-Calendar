import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common'
import { GroupMeetingService } from './group-meeting.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CreateMeetingDto, UpdateMeetingDto } from './dto'

interface RequestWithUser {
  user: { id: string; phone: string }
}

@ApiTags('group-meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupMeetingController {
  constructor(private readonly meetingService: GroupMeetingService) {}

  /**
   * 创建会议
   * POST /api/groups/:id/meetings
   * TASK-4.5: 发起会议功能
   */
  @Post(':id/meetings')
  @ApiOperation({ summary: '创建会议' })
  async createMeeting(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingService.createMeeting(id, req.user.id, dto)
  }

  /**
   * 获取群组的会议列表
   * GET /api/groups/:id/meetings
   */
  @Get(':id/meetings')
  @ApiOperation({ summary: '获取会议列表' })
  async getMeetings(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.meetingService.getMeetings(id, req.user.id)
  }

  /**
   * 获取会议详情
   * GET /api/groups/:id/meetings/:meetingId
   */
  @Get(':id/meetings/:meetingId')
  @ApiOperation({ summary: '获取会议详情' })
  async getMeetingDetail(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ) {
    return this.meetingService.getMeetingDetail(id, meetingId, req.user.id)
  }

  /**
   * 更新会议
   * PUT /api/groups/:id/meetings/:meetingId
   */
  @Put(':id/meetings/:meetingId')
  @ApiOperation({ summary: '更新会议' })
  async updateMeeting(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingService.updateMeeting(id, meetingId, req.user.id, dto)
  }

  /**
   * 取消会议
   * DELETE /api/groups/:id/meetings/:meetingId
   */
  @Delete(':id/meetings/:meetingId')
  @ApiOperation({ summary: '取消会议' })
  async cancelMeeting(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ) {
    return this.meetingService.cancelMeeting(id, meetingId, req.user.id)
  }
}