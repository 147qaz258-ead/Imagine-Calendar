import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { KnowledgeSourceType } from '../entities/cognitive-map.entity';

/**
 * 知识来源 DTO
 * 对应 API-CONTRACT.md KnowledgeSource
 */
export class KnowledgeSourceDto {
  @ApiProperty({
    enum: KnowledgeSourceType,
    description: '来源类型',
    example: 'self_exploration',
  })
  @IsEnum(KnowledgeSourceType)
  type: KnowledgeSourceType;

  @ApiProperty({ description: '描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '深度 1-3', minimum: 1, maximum: 3 })
  @IsNumber()
  @Min(1)
  @Max(3)
  depth: number;

  @ApiProperty({ description: '贡献时间 ISO 8601' })
  @IsDateString()
  contributedAt: string;
}

/**
 * 认知维度 DTO
 * 对应 API-CONTRACT.md CognitiveDimension
 */
export class CognitiveDimensionDto {
  @ApiProperty({ description: '维度名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '分数 0-100', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({ type: [KnowledgeSourceDto], description: '知识来源' })
  @IsArray()
  knowledgeSource: KnowledgeSourceDto[];
}

/**
 * 更新认知维度请求
 * PUT /api/users/:id/cognitive-map/dimensions
 * 对应 API-CONTRACT.md 7.2 UpdateDimensionRequest
 */
export class UpdateDimensionDto {
  @ApiProperty({ description: '维度名称' })
  @IsString()
  dimension: string;

  @ApiProperty({ description: '分数 0-100', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({ type: KnowledgeSourceDto, description: '知识来源' })
  knowledgeSource: KnowledgeSourceDto;
}

/**
 * 认知历史查询参数
 * GET /api/users/:id/cognitive-map/history
 * 对应 API-CONTRACT.md 7.3 CognitiveHistoryQuery
 */
export class CognitiveHistoryQueryDto {
  @ApiProperty({ required: false, description: '开始日期 ISO 8601' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: '结束日期 ISO 8601' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * 对比认知图谱请求
 * POST /api/cognitive-map/compare
 * 对应 API-CONTRACT.md 7.4 CompareCognitiveMapRequest
 */
export class CompareCognitiveMapDto {
  @ApiProperty({
    type: [String],
    description: '用户 ID 列表，最多 6 人',
    maxItems: 6,
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}