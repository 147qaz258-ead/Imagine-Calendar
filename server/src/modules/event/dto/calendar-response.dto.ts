import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyType } from '../entities/event.entity';

/**
 * 日历事件列表项
 * 用于日历视图展示
 */
export class CalendarEventDto {
  @ApiProperty({ description: '事件ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: '事件日期 YYYY-MM-DD', example: '2024-03-15' })
  date: string;

  @ApiProperty({ description: '事件标题', example: '字节跳动2024校园招聘' })
  title: string;

  @ApiProperty({ description: '企业名称', example: '字节跳动' })
  company: string;

  @ApiProperty({
    description: '企业类型',
    enum: CompanyType,
    example: CompanyType.PRIVATE,
  })
  companyType: CompanyType;

  @ApiProperty({ description: '岗位名称', example: '前端开发工程师' })
  position: string;
}

/**
 * 日历事件响应
 * GET /api/events/calendar
 */
export class CalendarResponseDto {
  @ApiProperty({ description: '是否成功', example: true })
  success: boolean;

  @ApiProperty({
    description: '响应数据',
    type: 'object',
    properties: {
      year: { type: 'number', example: 2024 },
      month: { type: 'number', example: 3 },
      events: {
        type: 'array',
        items: { $ref: '#/components/schemas/CalendarEventDto' },
      },
    },
  })
  data: {
    year: number;
    month: number;
    events: CalendarEventDto[];
  };
}