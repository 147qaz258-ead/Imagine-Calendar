# 任务依赖分析表

## 概述

本文档分析畅选日历 MVP 1.0 所有任务的依赖关系，区分**硬依赖**和**接口依赖**。

## 依赖类型定义

| 类型 | 定义 | 标记方式 | 开发策略 |
|------|------|----------|----------|
| **硬依赖** | 代码直接 import 其他任务的模块，必须等待前置任务完成 | `deps: [TASK-XXX]` | 禁止 mock，必须等实现完成 |
| **接口依赖** | 只需调用接口，不依赖具体实现 | `interface_deps: [TASK-XXX]` | 允许契约先行，但类型必须对齐 |

---

## 任务依赖关系总表

| Task ID | Task Name | 依赖类型 | 依赖于 | 说明 |
|---------|-----------|----------|--------|------|
| TASK-001 | 项目初始化与基础架构 | - | 无 | 所有任务的基础设施依赖 |
| TASK-002 | 数据库设计与初始化 | 硬依赖 | TASK-001 | 需要 TASK-001 完成数据库连接配置 |
| TASK-003 | 认证服务后端 | 硬依赖 | TASK-001, TASK-002 | 需要 DB 表和基础框架 |
| TASK-004 | 认证服务前端 | 接口依赖 | TASK-003 | 需要 API 接口契约，可按契约并行开发 |
| TASK-005 | 用户画像后端 | 硬依赖 | TASK-002, TASK-003 | 需要 users 表和认证中间件 |
| TASK-006 | 用户画像前端 | 接口依赖 | TASK-005 | 需要 API 接口契约 |
| TASK-007 | OCR 服务集成 | 硬依赖 | TASK-005 | 需要用户画像 API |
| TASK-008 | 日历核心后端 | 硬依赖 | TASK-002 | 需要 events 表 |
| TASK-009 | 日历核心前端 | 接口依赖 | TASK-008 | 需要 API 接口契约 |
| TASK-010 | 筛选匹配后端 | 硬依赖 | TASK-005, TASK-008 | 需要用户偏好和事件数据 |
| TASK-011 | 筛选匹配前端 | 接口依赖 | TASK-010 | 需要 API 接口契约 |
| TASK-012 | 圆桌匹配后端 | 硬依赖 | TASK-005, TASK-010 | 需要用户偏好和筛选逻辑 |
| TASK-013 | 圆桌匹配前端 | 接口依赖 | TASK-012 | 需要 API 接口契约 |
| TASK-014 | 实时通信服务 | 硬依赖 | TASK-001, TASK-012 | 需要基础框架和圆桌分组数据 |
| TASK-015 | 圆桌交流前端 | 接口依赖 | TASK-014 | 需要 WebSocket 事件契约 |
| TASK-016 | 认知图谱后端 | 硬依赖 | TASK-012, TASK-014 | 需要圆桌数据和消息记录 |
| TASK-017 | 认知图谱前端 | 接口依赖 | TASK-016 | 需要 API 接口契约 |
| TASK-018 | 通知系统后端 | 硬依赖 | TASK-002 | 需要 notifications 表 |
| TASK-019 | 通知系统前端 | 接口依赖 | TASK-018 | 需要 API 接口契约 |
| TASK-020 | 短信通知集成 | 硬依赖 | TASK-003, TASK-018 | 需要验证码和通知服务 |
| TASK-021 | 部署与运维配置 | 硬依赖 | TASK-001~020 | 需要所有服务完成 |

---

## 并行开发路线图

### 阶段 1：基础设施 (Week 1)

```
TASK-001 (项目初始化) ──→ TASK-002 (数据库设计)
```

**可并行**: 无

### 阶段 2：认证模块 (Week 1-2)

```
TASK-003 (认证后端)
      │
      ├── [接口依赖] ──→ TASK-004 (认证前端) [可并行]
      │
      └── [硬依赖] ──→ TASK-005 (用户画像后端)
```

### 阶段 3：核心功能 (Week 2-4)

```
TASK-005 (画像后端) ──→ TASK-006 (画像前端) [接口依赖，可并行]
      │
      └── TASK-008 (日历后端) ──→ TASK-009 (日历前端) [接口依赖，可并行]
              │
              └── TASK-010 (筛选后端) ──→ TASK-011 (筛选前端) [接口依赖，可并行]
                      │
                      └── TASK-012 (圆桌匹配后端)
```

**并行机会**:
- TASK-007 (OCR) 可与 TASK-008 并行
- TASK-018 (通知后端) 可与 TASK-008~012 并行

### 阶段 4：圆桌与通信 (Week 5-7)

```
TASK-012 (圆桌匹配后端)
      │
      ├── [接口依赖] ──→ TASK-013 (圆桌匹配前端) [可并行]
      │
      └── TASK-014 (实时通信) ──→ TASK-015 (圆桌交流前端) [接口依赖，可并行]
              │
              └── TASK-016 (认知图谱后端) ──→ TASK-017 (认知图谱前端) [接口依赖，可并行]
```

### 阶段 5：完善闭环 (Week 8)

```
TASK-018 (通知后端) ──→ TASK-019 (通知前端) [接口依赖，可并行]
      │
      └── TASK-020 (短信集成)

TASK-021 (部署配置)
```

---

## 接口契约定义

### 认证接口契约 (TASK-003 定义，TASK-004 使用)

```typescript
// 认证服务接口
interface AuthService {
  // 发送验证码
  sendCode(phone: string): Promise<{ success: boolean; message: string }>;

  // 验证登录
  verify(phone: string, code: string): Promise<{
    userId: string;
    isNewUser: boolean;
    token: string;
    expiresIn: number;
  }>;
}
```

### 用户画像接口契约 (TASK-005 定义，TASK-006 使用)

```typescript
// 用户画像服务接口
interface UserProfileService {
  // 获取画像
  getProfile(userId: string): Promise<UserProfile>;

  // 更新画像
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<void>;

  // 更新偏好
  updatePreferences(userId: string, preferences: Partial<Preferences>): Promise<void>;
}
```

### 日历接口契约 (TASK-008 定义，TASK-009 使用)

```typescript
// 日历服务接口
interface CalendarService {
  // 获取月度事件
  getMonthlyEvents(year: number, month: number): Promise<CalendarEvent[]>;

  // 获取事件详情
  getEventDetail(eventId: string): Promise<CalendarEvent>;

  // 事件操作
  performAction(eventId: string, action: 'follow' | 'interested' | 'apply'): Promise<void>;
}
```

### 筛选接口契约 (TASK-010 定义，TASK-011 使用)

```typescript
// 筛选服务接口
interface FilterService {
  // 筛选事件
  filterEvents(filters: Partial<Preferences>, year?: number, month?: number): Promise<{
    total: number;
    events: CalendarEvent[];
  }>;

  // 保存筛选条件
  saveFilters(userId: string, filters: Partial<Preferences>): Promise<void>;
}
```

### 圆桌接口契约 (TASK-012 定义，TASK-013 使用)

```typescript
// 圆桌服务接口
interface RoundtableService {
  // 报名圆桌
  apply(preferences: Partial<Preferences>): Promise<{
    applyId: string;
    status: 'matching' | 'matched';
    currentCount: number;
    targetCount: number;
  }>;

  // 获取我的圆桌
  getMyRoundtables(): Promise<{
    matching: RoundtableInfo[];
    upcoming: RoundtableInfo[];
    completed: RoundtableInfo[];
  }>;
}
```

### WebSocket 事件契约 (TASK-014 定义，TASK-015 使用)

```typescript
// WebSocket 事件接口
interface WebSocketEvents {
  // 客户端 -> 服务端
  'room:join': { roundtableId: string };
  'room:leave': { roundtableId: string };
  'message:send': { roundtableId: string; content: string };

  // 服务端 -> 客户端
  'message:receive': { userId: string; nickname: string; content: string; timestamp: string };
  'user:joined': { userId: string; nickname: string };
  'user:left': { userId: string };
  'room:ended': {};
}
```

### 通知接口契约 (TASK-018 定义，TASK-019 使用)

```typescript
// 通知服务接口
interface NotificationService {
  // 获取通知列表
  getNotifications(page: number, pageSize: number): Promise<{
    total: number;
    unread: number;
    items: Notification[];
  }>;

  // 标记已读
  markAsRead(notificationId: string): Promise<void>;

  // 全部已读
  markAllAsRead(): Promise<void>;
}
```

---

## 风险提示

### 高风险依赖链

1. **TASK-003 → TASK-005 → TASK-010 → TASK-012 → TASK-014**
   - 这是最长的硬依赖链，影响整体进度
   - 建议优先保障这条链路的开发资源

2. **TASK-014 (实时通信)**
   - 技术复杂度高，是圆桌功能的核心
   - 建议提前进行技术验证

### 接口契约变更风险

- 接口契约一旦定义，应保持稳定
- 如需变更，必须同步更新前后端代码
- 建议使用 TypeScript 类型定义共享契约

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |