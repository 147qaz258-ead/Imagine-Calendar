import { IsNotEmpty, IsString, Matches } from 'class-validator'

/**
 * 发送验证码请求 DTO
 */
export class SendVerificationCodeDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string

  @IsString()
  @IsNotEmpty({ message: '场景不能为空' })
  scene: 'login' | 'register'
}

/**
 * 发送通知短信 DTO
 */
export class SendNotificationSmsDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string

  @IsString()
  @IsNotEmpty({ message: '模板类型不能为空' })
  templateType: 'roundtable_matched' | 'roundtable_reminder' | 'event_reminder'

  @IsNotEmpty({ message: '模板参数不能为空' })
  params: Record<string, string>
}

/**
 * 发送圆桌匹配通知 DTO
 */
export class SendRoundtableMatchedDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string

  @IsString()
  @IsNotEmpty({ message: '时间不能为空' })
  time: string
}

/**
 * 发送圆桌提醒 DTO
 */
export class SendRoundtableReminderDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string
}

/**
 * 发送活动提醒 DTO
 */
export class SendEventReminderDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string

  @IsString()
  @IsNotEmpty({ message: '活动名称不能为空' })
  eventName: string

  @IsString()
  @IsNotEmpty({ message: '时间不能为空' })
  time: string
}
