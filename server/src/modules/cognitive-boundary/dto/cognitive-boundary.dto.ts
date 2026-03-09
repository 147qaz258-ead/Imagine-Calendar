import { IsString, IsNumber, IsArray, ValidateNested, Min, Max, IsOptional, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AssessmentStage } from '../entities/cognitive-boundary-assessment.entity'

/**
 * 问题评估DTO
 */
export class QuestionAssessmentDto {
  @ApiProperty({ description: '问题ID，格式: dimensionKey-subCategory-number 或 dimensionKey-number' })
  @IsString()
  questionId: string

  @ApiProperty({ description: '评估等级(1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  level: number

  @ApiPropertyOptional({ description: '评估时间' })
  @IsOptional()
  @IsString()
  assessedAt?: string

  @ApiPropertyOptional({ description: '子类别标识，如 "Beijing"、"Internet" 等' })
  @IsOptional()
  @IsString()
  subCategory?: string

  @ApiPropertyOptional({ description: '用户对该问题的备注' })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({ description: '评估阶段', enum: ['initial', 'after_roundtable'] })
  @IsOptional()
  @IsIn(['initial', 'after_roundtable'])
  stage?: AssessmentStage
}

/**
 * 提交评估请求DTO
 */
export class SubmitAssessmentDto {
  @ApiProperty({ description: '问题评估列表', type: [QuestionAssessmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAssessmentDto)
  assessments: QuestionAssessmentDto[]
}

/**
 * 更新单个问题评估DTO
 */
export class UpdateQuestionAssessmentDto {
  @ApiProperty({ description: '评估等级(1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  level: number

  @ApiPropertyOptional({ description: '子类别标识' })
  @IsOptional()
  @IsString()
  subCategory?: string

  @ApiPropertyOptional({ description: '用户对该问题的备注' })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({ description: '评估阶段', enum: ['initial', 'after_roundtable'] })
  @IsOptional()
  @IsIn(['initial', 'after_roundtable'])
  stage?: AssessmentStage
}