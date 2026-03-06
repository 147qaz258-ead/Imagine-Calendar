import { Injectable, Logger } from '@nestjs/common';
import { SendResult, ISmsService } from '../interfaces/sms.interface';

/**
 * 腾讯云短信服务
 * TODO: 实现腾讯云短信 API 集成
 */
@Injectable()
export class TencentSmsService implements ISmsService {
  private readonly logger = new Logger(TencentSmsService.name);

  // 配置项（从环境变量读取）
  // private secretId: string;
  // private secretKey: string;
  // private appId: string;
  // private signName: string;
  // private templateIds: Record<string, string>;

  constructor() {
    // TODO: 初始化腾讯云客户端
    // this.secretId = process.env.TENCENT_SECRET_ID;
    // this.secretKey = process.env.TENCENT_SECRET_KEY;
    // this.appId = process.env.TENCENT_SMS_APP_ID;
    // this.signName = process.env.TENCENT_SMS_SIGN_NAME || '畅选日历';
    // this.templateIds = {
    //   verifyCode: process.env.TENCENT_SMS_TEMPLATE_VERIFY_CODE,
    //   roundtableMatched: process.env.TENCENT_SMS_TEMPLATE_ROUNDTABLE_MATCHED,
    //   roundtableReminder: process.env.TENCENT_SMS_TEMPLATE_ROUNDTABLE_REMINDER,
    //   eventReminder: process.env.TENCENT_SMS_TEMPLATE_EVENT_REMINDER,
    // };

    this.logger.warn('TencentSmsService is not fully implemented. Using mock behavior.');
  }

  /**
   * 发送验证码短信
   */
  async sendVerifyCode(phone: string, code: string): Promise<SendResult> {
    this.logger.log(`[Tencent SMS] 发送验证码到 ${phone} (Not Implemented)`);

    return {
      success: false,
      error: 'Tencent SMS service not implemented',
    };
  }

  /**
   * 发送圆桌匹配成功通知
   */
  async sendRoundtableMatched(phone: string, time: string): Promise<SendResult> {
    this.logger.log(`[Tencent SMS] 发送圆桌匹配通知到 ${phone} (Not Implemented)`);

    return {
      success: false,
      error: 'Tencent SMS service not implemented',
    };
  }

  /**
   * 发送圆桌提醒
   */
  async sendRoundtableReminder(phone: string): Promise<SendResult> {
    this.logger.log(`[Tencent SMS] 发送圆桌提醒到 ${phone} (Not Implemented)`);

    return {
      success: false,
      error: 'Tencent SMS service not implemented',
    };
  }

  /**
   * 发送活动提醒
   */
  async sendEventReminder(phone: string, eventName: string, time: string): Promise<SendResult> {
    this.logger.log(`[Tencent SMS] 发送活动提醒到 ${phone} (Not Implemented)`);

    return {
      success: false,
      error: 'Tencent SMS service not implemented',
    };
  }
}