import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsInt, Min, IsDateString, IsUUID, MaxLength } from 'class-validator'

/**
 * 创建邀请码 DTO
 */
export class CreateInviteCodeDto {
  @ApiPropertyOptional({
    description: '邀请码（不填则自动生成）',
    maxLength: 20,
    example: 'INVITE2024',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string

  @ApiPropertyOptional({
    description: '关联群组ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  groupId?: string

  @ApiPropertyOptional({
    description: '最大使用次数',
    default: 10,
    minimum: 1,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number

  @ApiPropertyOptional({
    description: '过期时间（ISO 8601 格式）',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string
}

/**
 * 更新邀请码 DTO
 */
export class UpdateInviteCodeDto {
  @ApiPropertyOptional({
    description: '最大使用次数',
    minimum: 1,
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number

  @ApiPropertyOptional({
    description: '过期时间（ISO 8601 格式）',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string
}

/**
 * 验证邀请码 DTO
 */
export class ValidateInviteCodeDto {
  @ApiProperty({
    description: '邀请码',
    maxLength: 20,
    example: 'INVITE2024',
  })
  @IsString()
  @MaxLength(20)
  code: string
}

/**
 * 查询邀请码 DTO
 */
export class QueryInviteCodeDto {
  @ApiPropertyOptional({
    description: '页码',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({
    description: '每页数量',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number

  @ApiPropertyOptional({
    description: '状态筛选',
    enum: ['active', 'expired', 'disabled'],
  })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({
    description: '创建者ID',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string
}
