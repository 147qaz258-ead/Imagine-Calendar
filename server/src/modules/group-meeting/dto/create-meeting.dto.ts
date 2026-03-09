import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, Max, IsUrl, MaxLength } from 'class-validator'

/**
 * 创建会议 DTO
 * TASK-4.5: 发起会议功能
 */
export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty({ message: '会议标题不能为空' })
  @MaxLength(100, { message: '会议标题不能超过100个字符' })
  title: string

  @IsDateString({}, { message: '会议时间格式不正确' })
  scheduledAt: string

  @IsInt({ message: '时长必须是整数' })
  @Min(15, { message: '时长至少15分钟' })
  @Max(480, { message: '时长不能超过8小时' })
  @IsOptional()
  duration?: number // 默认120分钟

  @IsUrl({}, { message: '会议链接格式不正确' })
  @MaxLength(500, { message: '会议链接不能超过500个字符' })
  @IsOptional()
  meetingUrl?: string

  @IsString()
  @MaxLength(200, { message: '地点不能超过200个字符' })
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  notes?: string
}

/**
 * 更新会议 DTO
 */
export class UpdateMeetingDto {
  @IsString()
  @IsNotEmpty({ message: '会议标题不能为空' })
  @MaxLength(100, { message: '会议标题不能超过100个字符' })
  @IsOptional()
  title?: string

  @IsDateString({}, { message: '会议时间格式不正确' })
  @IsOptional()
  scheduledAt?: string

  @IsInt({ message: '时长必须是整数' })
  @Min(15, { message: '时长至少15分钟' })
  @Max(480, { message: '时长不能超过8小时' })
  @IsOptional()
  duration?: number

  @IsUrl({}, { message: '会议链接格式不正确' })
  @MaxLength(500, { message: '会议链接不能超过500个字符' })
  @IsOptional()
  meetingUrl?: string

  @IsString()
  @MaxLength(200, { message: '地点不能超过200个字符' })
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  notes?: string
}