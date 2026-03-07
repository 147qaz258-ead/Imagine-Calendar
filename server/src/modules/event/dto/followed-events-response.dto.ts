import { ApiProperty } from '@nestjs/swagger'
import { EventDetailDto } from './event-detail.dto'

/**
 * 已关注事件列表响应
 * GET /api/users/:id/followed-events
 */
export class FollowedEventsResponseDto {
  @ApiProperty({ description: '是否成功', example: true })
  success: boolean

  @ApiProperty({ description: '已关注事件列表', type: [EventDetailDto] })
  data: EventDetailDto[]
}
