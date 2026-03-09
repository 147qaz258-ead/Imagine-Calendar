import { IsDateString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * 查看成员空闲时间查询参数
 * TASK-4.4: 日历共享功能
 */
export class AvailabilityQueryDto {
  @ApiProperty({ description: '开始日期 (YYYY-MM-DD)', example: '2024-01-01' })
  @IsDateString()
  startDate: string

  @ApiProperty({ description: '结束日期 (YYYY-MM-DD)', example: '2024-01-07' })
  @IsDateString()
  endDate: string
}