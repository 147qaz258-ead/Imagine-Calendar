import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { RoundTableStatus } from '../entities/roundtable.entity';

/**
 * 圆桌列表查询参数
 * GET /api/round-tables
 * 对应 API-CONTRACT.md 6.1 RoundTableQuery
 */
export class RoundTableQueryDto {
  @ApiProperty({ required: false, enum: RoundTableStatus, description: '圆桌状态筛选' })
  @IsOptional()
  @IsEnum(RoundTableStatus)
  status?: RoundTableStatus;

  @ApiProperty({ required: false, default: 1, description: '页码' })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, description: '每页数量' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10;
}

/**
 * 圆桌报名请求
 * POST /api/round-tables/apply
 * 对应 API-CONTRACT.md 6.2 ApplyRoundTableRequest
 */
export class ApplyRoundTableDto {
  @ApiProperty({ type: [String], description: '期望时间段 ISO 8601' })
  @IsArray()
  @IsString({ each: true })
  preferredTimes: string[];

  @ApiProperty({ required: false, type: [String], description: '感兴趣的话题' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];
}

/**
 * 提交讨论纪要请求
 * POST /api/round-tables/:id/summary
 * 对应 API-CONTRACT.md 6.6 SubmitSummaryRequest
 */
export class SubmitSummaryDto {
  @ApiProperty({ description: '讨论纪要内容' })
  @IsString()
  summary: string;

  @ApiProperty({ type: [String], description: '关键点' })
  @IsArray()
  @IsString({ each: true })
  keyPoints: string[];

  @ApiProperty({ required: false, type: [String], description: '行动项' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actionItems?: string[];
}