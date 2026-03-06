/**
 * 短信发送结果
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 短信服务接口
 */
export interface ISmsService {
  /**
   * 发送验证码短信
   */
  sendVerifyCode(phone: string, code: string): Promise<SendResult>;

  /**
   * 发送圆桌匹配成功通知
   */
  sendRoundtableMatched(phone: string, time: string): Promise<SendResult>;

  /**
   * 发送圆桌提醒（2小时前）
   */
  sendRoundtableReminder(phone: string): Promise<SendResult>;

  /**
   * 发送活动提醒（24小时前）
   */
  sendEventReminder(phone: string, eventName: string, time: string): Promise<SendResult>;
}