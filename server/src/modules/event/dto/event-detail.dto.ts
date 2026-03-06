import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyType } from '../entities/event.entity';

/**
 * 事件详情响应
 * GET /api/events/:id
 */
export class EventDetailDto {
  @ApiProperty({ description: '事件ID' })
  id: string;

  @ApiProperty({ description: '事件标题' })
  title: string;

  @ApiProperty({ description: '企业名称' })
  company: string;

  @ApiProperty({ description: '企业类型', enum: CompanyType })
  companyType: CompanyType;

  @ApiPropertyOptional({ description: '岗位名称' })
  position?: string;

  @ApiPropertyOptional({ description: '事件描述' })
  description?: string;

  @ApiPropertyOptional({ description: '地点' })
  location?: string;

  @ApiProperty({ description: '事件日期 YYYY-MM-DD' })
  eventDate: string;

  @ApiPropertyOptional({ description: '开始时间 HH:mm' })
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间 HH:mm' })
  endTime?: string;

  @ApiPropertyOptional({ description: '截止日期 ISO 8601' })
  deadline?: string;

  @ApiPropertyOptional({ description: '岗位要求', type: [String] })
  requirements?: string[];

  @ApiPropertyOptional({ description: '福利待遇', type: [String] })
  benefits?: string[];

  @ApiPropertyOptional({ description: '申请链接' })
  applyUrl?: string;

  @ApiPropertyOptional({ description: '标签', type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ description: '来源' })
  source?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: string;

  @ApiProperty({ description: '更新时间' })
  updatedAt: string;
}

/**
 * 事件详情响应包装
 */
export class EventDetailResponseDto {
  @ApiProperty({ description: '是否成功', example: true })
  success: boolean;

  @ApiProperty({ description: '事件详情', type: EventDetailDto })
  data: EventDetailDto;
}