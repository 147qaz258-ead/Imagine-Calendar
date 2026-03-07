import { IsInt, Min, Max, IsOptional, IsEnum, IsArray } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { CompanyType } from '../entities/event.entity'

/**
 * 日历查询参数
 * GET /api/events/calendar
 */
export class CalendarQueryDto {
  @ApiPropertyOptional({ description: '年份', example: 2024 })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number

  @ApiPropertyOptional({ description: '月份 1-12', example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number

  @ApiPropertyOptional({
    description: '企业类型筛选',
    enum: CompanyType,
    example: CompanyType.SOE,
  })
  @IsOptional()
  @IsEnum(CompanyType)
  companyType?: CompanyType

  @ApiPropertyOptional({
    description: '行业筛选',
    type: [String],
    example: ['互联网', '金融'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['互联网', '金融', '制造业', '教育', '医疗', '其他'], { each: true })
  industries?: string[]
}
