# TASK-019：通知系统前端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-019 |
| Task Name | 通知系统前端 |
| 关联 Story | STORY-008 (全流程通知) |
| 优先级 | P0 |
| 预估工时 | 1天 |
| BEADS_ID | [待填写] |

## 任务描述

实现通知系统前端，包括通知中心、消息列表、已读状态、实时推送等。

## 技术要点

### 页面设计

1. **通知中心入口**
   - 导航栏图标
   - 未读数角标
   - 点击展开通知列表

2. **通知列表**
   - 分类 Tab（全部/活动/圆桌/系统）
   - 已读/未读状态
   - 点击查看详情

3. **通知详情**
   - 消息内容
   - 时间
   - 相关操作

### 核心功能

1. **通知列表**
   - 分页加载
   - 下拉刷新
   - 无限滚动

2. **已读状态**
   - 点击标记已读
   - 全部已读按钮
   - 未读数实时更新

3. **实时推送**
   - WebSocket 监听
   - 新消息提示
   - 角标更新

### 接口调用

```typescript
// 通知 API
const notificationApi = {
  // 获取通知列表
  getNotifications: (params?: NotificationsQuery) =>
    axios.get('/api/notifications', { params }),

  // 标记已读
  markAsRead: (id: string) =>
    axios.put(`/api/notifications/${id}/read`),

  // 全部已读
  markAllAsRead: () =>
    axios.put('/api/notifications/read-all'),

  // 获取未读数
  getUnreadCount: () =>
    axios.get('/api/notifications/unread-count'),
};
```

### 状态管理

```typescript
// Redux Slice
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  page: number;
  activeTab: 'all' | 'event' | 'roundtable' | 'system';
}
```

### WebSocket 监听

```typescript
// 监听新消息
socket.on('notification:new', (notification: Notification) => {
  // 添加到列表头部
  // 更新未读数
  // 显示 toast 提示
});

// 监听未读数更新
socket.on('notification:unread', (data: { count: number }) => {
  // 更新角标
});
```

## 验收标准

- [ ] 通知中心入口展示正确
- [ ] 未读角标显示正确
- [ ] 通知列表加载正常
- [ ] 分类 Tab 切换正常
- [ ] 已读/未读状态正确
- [ ] 点击标记已读正常
- [ ] 全部已读功能正常
- [ ] 实时推送接收正常
- [ ] 移动端适配

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-004（认证状态）
- TASK-015（WebSocket 连接）

### 接口依赖 (interface_deps)
- TASK-018（需要通知 API 接口契约）

### 接口契约验证
- [ ] 已确认 TASK-018 接口契约定义完整

## 实现记录

_由 dev agent 填写_

## 测试记录

_由 dev agent 填写_

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |