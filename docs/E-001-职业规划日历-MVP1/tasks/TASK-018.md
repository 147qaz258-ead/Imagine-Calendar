# TASK-018：通知系统后端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-018 |
| Task Name | 通知系统后端 |
| 关联 Story | STORY-008 (全流程通知) |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现通知系统后端，包括站内消息、通知类型管理、已读状态、消息推送等功能。

## 技术要点

### 核心功能

1. **站内消息**
   - 创建消息
   - 获取消息列表
   - 标记已读
   - 全部已读

2. **通知类型**
   - 活动提醒（关注的活动开始前 24 小时）
   - 圆桌通知（匹配成功、会议提醒）
   - 系统消息

3. **消息推送**
   - WebSocket 实时推送
   - 离线消息存储

### 通知类型定义

```typescript
// 通知类型
type NotificationType = 'event' | 'roundtable' | 'system';

// 通知模板
interface NotificationTemplate {
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

// 预定义模板
const NOTIFICATION_TEMPLATES = {
  // 活动提醒
  EVENT_REMINDER: {
    type: 'event',
    title: '活动即将开始',
    content: '您关注的「{eventTitle}」将于明天 {time} 开始',
  },

  // 圆桌匹配成功
  ROUNDTABLE_MATCHED: {
    type: 'roundtable',
    title: '圆桌匹配成功',
    content: '您已成功匹配圆桌，会议时间：{scheduledAt}',
  },

  // 圆桌提醒
  ROUNDTABLE_REMINDER: {
    type: 'roundtable',
    title: '圆桌即将开始',
    content: '您报名的圆桌将于 2 小时后开始，请准时参加',
  },

  // 系统消息
  SYSTEM_ANNOUNCEMENT: {
    type: 'system',
    title: '系统公告',
    content: '{content}',
  },
};
```

### 接口定义

```typescript
// GET /api/notifications
interface NotificationsQuery {
  page?: number;
  pageSize?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    total: number;
    unread: number;
    items: Notification[];
  };
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

// PUT /api/notifications/:id/read
interface MarkReadResponse {
  success: boolean;
}

// PUT /api/notifications/read-all
interface MarkAllReadResponse {
  success: boolean;
  data: {
    updatedCount: number;
  };
}

// GET /api/notifications/unread-count
interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}
```

### 定时任务

```typescript
// 活动提醒定时任务（每小时执行）
@Cron('0 * * * *')
async sendEventReminders(): Promise<void> {
  // 查询 24 小时内开始的活动
  // 发送提醒通知
}

// 圆桌提醒定时任务（每 30 分钟执行）
@Cron('*/30 * * * *')
async sendRoundtableReminders(): Promise<void> {
  // 查询 2 小时内开始的圆桌
  // 发送提醒通知
}
```

### WebSocket 推送

```typescript
// 新消息推送
interface NewNotificationEvent {
  event: 'notification:new';
  data: Notification;
}

// 未读数更新
interface UnreadCountEvent {
  event: 'notification:unread';
  data: { count: number };
}
```

## 验收标准

- [ ] 获取通知列表接口正常
- [ ] 标记已读接口正常
- [ ] 全部已读接口正常
- [ ] 未读数接口正常
- [ ] 活动提醒定时任务正常
- [ ] 圆桌提醒定时任务正常
- [ ] WebSocket 推送正常
- [ ] Swagger 文档完整

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-002（数据库 notifications 表）

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