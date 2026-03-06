# TASK-020：短信通知集成

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-020 |
| Task Name | 短信通知集成 |
| 关联 Story | STORY-008 (全流程通知) |
| 优先级 | P0 |
| 预估工时 | 1天 |
| BEADS_ID | [待填写] |

## 任务描述

集成短信服务商，实现验证码发送、圆桌通知、活动提醒等短信发送功能。

## 技术要点

### 短信服务商选择

**推荐**：阿里云短信（或腾讯云短信）

- 稳定性高
- 价格合理
- API 完善

### 核心功能

1. **验证码短信**
   - 登录验证码
   - 模板短信

2. **通知短信**
   - 圆桌匹配成功通知
   - 会议开始前 2 小时提醒
   - 活动开始前 24 小时提醒

### 短信模板定义

```
// 验证码模板
SMS_VERIFY_CODE: "您的验证码为${code}，5分钟内有效，请勿泄露给他人。"

// 圆桌匹配成功
ROUNDTABLE_MATCHED: "【畅选日历】恭喜您已匹配成功！圆桌讨论将于${time}开始，请准时参加。"

// 圆桌提醒
ROUNDTABLE_REMINDER: "【畅选日历】您报名的圆桌将于2小时后开始，请准时参加。"

// 活动提醒
EVENT_REMINDER: "【畅选日历】您关注的「${eventName}」将于明天${time}开始，别忘了参加哦！"
```

### 服务实现

```typescript
// 短信服务
interface SMSService {
  // 发送验证码
  sendVerifyCode(phone: string, code: string): Promise<SendResult>;

  // 发送圆桌匹配通知
  sendRoundtableMatched(phone: string, time: string): Promise<SendResult>;

  // 发送圆桌提醒
  sendRoundtableReminder(phone: string): Promise<SendResult>;

  // 发送活动提醒
  sendEventReminder(phone: string, eventName: string, time: string): Promise<SendResult>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

### 阿里云短信集成

```typescript
// 阿里云短信客户端
import Dysmsapi20170525, * as dysmsapi from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';

class AliyunSMSService implements SMSService {
  private client: Dysmsapi20170525;

  constructor() {
    const config = new OpenApi.Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'dysmsapi.aliyuncs.com',
    });
    this.client = new Dysmsapi20170525(config);
  }

  async sendVerifyCode(phone: string, code: string): Promise<SendResult> {
    const request = new dysmsapi.SendSmsRequest({
      phoneNumbers: phone,
      signName: '畅选日历',
      templateCode: 'SMS_VERIFY_CODE',
      templateParam: JSON.stringify({ code }),
    });

    try {
      const response = await this.client.sendSms(request);
      return {
        success: response.body.code === 'OK',
        messageId: response.body.bizId,
        error: response.body.message,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ... 其他方法实现
}
```

### 发送限流

```typescript
// Redis 限流
const SMS_RATE_LIMIT = {
  verifyCode: {
    key: 'sms:verify:{phone}',
    limit: 1,      // 60 秒内 1 次
    window: 60,    // 60 秒
  },
  notification: {
    key: 'sms:notify:{phone}',
    limit: 10,     // 1 天内 10 次
    window: 86400, // 1 天
  },
};
```

### 错误处理

| 错误码 | 说明 | 处理 |
|--------|------|------|
| isv.BUSINESS_LIMIT_CONTROL | 业务限流 | 提示用户稍后再试 |
| isv.DAY_LIMIT_CONTROL | 日发送限制 | 提示用户明天再试 |
| isv.MOBILE_NUMBER_ILLEGAL | 手机号非法 | 校验手机号格式 |
| isv.TEMPLATE_MISSING_PARAMETERS | 模板参数缺失 | 检查参数完整性 |

## 验收标准

- [ ] 验证码短信发送正常
- [ ] 圆桌匹配通知发送正常
- [ ] 圆桌提醒发送正常
- [ ] 活动提醒发送正常
- [ ] 发送限流正常
- [ ] 发送失败重试正常
- [ ] 发送日志记录正常
- [ ] 单元测试通过

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-003（验证码服务）
- TASK-018（通知服务）

### 接口依赖 (interface_deps)
- 无

## 实现记录

_由 dev agent 填写_

## 测试记录

_由 dev agent 填写_

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |