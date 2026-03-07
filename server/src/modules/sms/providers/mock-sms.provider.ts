import { Injectable, Logger } from '@nestjs/common'
import { SendResult, ISmsService } from '../interfaces/sms.interface'

/**
 * Mock 短信服务
 * 用于开发和测试环境，将短信内容输出到日志
 */
@Injectable()
export class MockSmsService implements ISmsService {
  private readonly logger = new Logger(MockSmsService.name)

  /**
   * 发送验证码短信
   */
  async sendVerifyCode(phone: string, code: string): Promise<SendResult> {
    const content = `【畅选日历】您的验证码为${code}，5分钟内有效，请勿泄露给他人。`

    this.logger.log(`[SMS Mock] 发送验证码到 ${phone}`)
    this.logger.debug(`[SMS Mock] 内容: ${content}`)

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    }
  }

  /**
   * 发送圆桌匹配成功通知
   */
  async sendRoundtableMatched(phone: string, time: string): Promise<SendResult> {
    const content = `【畅选日历】恭喜您已匹配成功！圆桌讨论将于${time}开始，请准时参加。`

    this.logger.log(`[SMS Mock] 发送圆桌匹配通知到 ${phone}`)
    this.logger.debug(`[SMS Mock] 内容: ${content}`)

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    }
  }

  /**
   * 发送圆桌提醒（2小时前）
   */
  async sendRoundtableReminder(phone: string): Promise<SendResult> {
    const content = `【畅选日历】您报名的圆桌将于2小时后开始，请准时参加。`

    this.logger.log(`[SMS Mock] 发送圆桌提醒到 ${phone}`)
    this.logger.debug(`[SMS Mock] 内容: ${content}`)

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    }
  }

  /**
   * 发送活动提醒（24小时前）
   */
  async sendEventReminder(phone: string, eventName: string, time: string): Promise<SendResult> {
    const content = `【畅选日历】您关注的「${eventName}」将于明天${time}开始，别忘了参加哦！`

    this.logger.log(`[SMS Mock] 发送活动提醒到 ${phone}`)
    this.logger.debug(`[SMS Mock] 内容: ${content}`)

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    }
  }
}
