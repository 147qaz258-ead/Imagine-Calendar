import { Injectable, Logger } from '@nestjs/common'
import { SendResult, ISmsService } from '../interfaces/sms.interface'

/**
 * 阿里云短信服务
 * TODO: 实现阿里云短信 API 集成
 */
@Injectable()
export class AliyunSmsService implements ISmsService {
  private readonly logger = new Logger(AliyunSmsService.name)

  // 配置项（从环境变量读取）
  // private accessKeyId: string;
  // private accessKeySecret: string;
  // private signName: string;
  // private templateCodes: Record<string, string>;

  constructor() {
    // TODO: 初始化阿里云客户端
    // this.accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    // this.accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    // this.signName = process.env.ALIYUN_SMS_SIGN_NAME || '畅选日历';
    // this.templateCodes = {
    //   verifyCode: process.env.ALIYUN_SMS_TEMPLATE_VERIFY_CODE,
    //   roundtableMatched: process.env.ALIYUN_SMS_TEMPLATE_ROUNDTABLE_MATCHED,
    //   roundtableReminder: process.env.ALIYUN_SMS_TEMPLATE_ROUNDTABLE_REMINDER,
    //   eventReminder: process.env.ALIYUN_SMS_TEMPLATE_EVENT_REMINDER,
    // };

    this.logger.warn('AliyunSmsService is not fully implemented. Using mock behavior.')
  }

  /**
   * 发送验证码短信
   */
  async sendVerifyCode(phone: string, code: string): Promise<SendResult> {
    // TODO: 实现阿里云短信发送
    // const request = new dysmsapi.SendSmsRequest({
    //   phoneNumbers: phone,
    //   signName: this.signName,
    //   templateCode: this.templateCodes.verifyCode,
    //   templateParam: JSON.stringify({ code }),
    // });
    // const response = await this.client.sendSms(request);

    this.logger.log(`[Aliyun SMS] 发送验证码到 ${phone} (Not Implemented)`)

    return {
      success: false,
      error: 'Aliyun SMS service not implemented',
    }
  }

  /**
   * 发送圆桌匹配成功通知
   */
  async sendRoundtableMatched(phone: string, time: string): Promise<SendResult> {
    this.logger.log(`[Aliyun SMS] 发送圆桌匹配通知到 ${phone} (Not Implemented)`)

    return {
      success: false,
      error: 'Aliyun SMS service not implemented',
    }
  }

  /**
   * 发送圆桌提醒
   */
  async sendRoundtableReminder(phone: string): Promise<SendResult> {
    this.logger.log(`[Aliyun SMS] 发送圆桌提醒到 ${phone} (Not Implemented)`)

    return {
      success: false,
      error: 'Aliyun SMS service not implemented',
    }
  }

  /**
   * 发送活动提醒
   */
  async sendEventReminder(phone: string, eventName: string, time: string): Promise<SendResult> {
    this.logger.log(`[Aliyun SMS] 发送活动提醒到 ${phone} (Not Implemented)`)

    return {
      success: false,
      error: 'Aliyun SMS service not implemented',
    }
  }
}
