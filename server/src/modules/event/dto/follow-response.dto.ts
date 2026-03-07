import { ApiProperty } from '@nestjs/swagger'

/**
 * 关注事件响应
 * POST /api/events/:id/follow
 * DELETE /api/events/:id/follow
 */
export class FollowResponseDto {
  @ApiProperty({ description: '是否成功', example: true })
  success: boolean

  @ApiProperty({
    description: '响应数据',
    example: { followed: true, followerCount: 42 },
  })
  data: {
    followed: boolean
    followerCount: number
  }
}
