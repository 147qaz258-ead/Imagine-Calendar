import { IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { NotificationType } from '../entities/notification.entity';

/**
 * 通知查询参数
 * GET /api/notifications
 * 对应 API-CONTRACT.md 8.1 NotificationQuery
 */
export class NotificationQueryDto {
  @ApiPropertyOptional({
    description: '通知类型',
    enum: NotificationType,
    example: NotificationType.EVENT_REMINDER,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: '是否已读',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  read?: boolean;

  @ApiPropertyOptional({
    description: '页码',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
}