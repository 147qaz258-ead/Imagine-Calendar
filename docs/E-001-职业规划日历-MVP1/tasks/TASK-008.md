# TASK-008：日历核心后端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-008 |
| Task Name | 日历核心后端 |
| 关联 Story | STORY-003 (机会发现核心) |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现日历核心服务后端，包括活动事件查询、事件详情、用户关注等功能。

## 技术要点

### 核心功能

1. **月度事件查询**
   - 按年月查询事件列表
   - 返回该月所有活动
   - 支持分页

2. **事件详情**
   - 获取单个事件详细信息
   - 包含企业、时间、地点、岗位等

3. **用户行为**
   - 关注事件
   - 取消关注
   - 标记感兴趣
   - 记录申请

4. **事件管理**
   - 事件状态管理
   - 过期事件标记

### 接口定义

```typescript
// GET /api/calendar/events
interface CalendarEventsQuery {
  year: number;
  month: number;
}

interface CalendarEventsResponse {
  success: boolean;
  data: {
    year: number;
    month: number;
    events: CalendarEvent[];
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  companyName: string;
  companyType: '国企' | '外企' | '民企' | '事业单位' | '其他';
  startTime: string;  // ISO 8601
  endTime: string;
  location: string;
  jobTypes: string[];
  targetYear: string;
  detailUrl?: string;
  description?: string;
}

// GET /api/calendar/events/:id
interface EventDetailResponse {
  success: boolean;
  data: CalendarEvent & {
    isFollowed: boolean;
    isInterested: boolean;
    isApplied: boolean;
  };
}

// POST /api/calendar/events/:id/action
interface EventActionRequest {
  action: 'follow' | 'unfollow' | 'interested' | 'apply';
}

interface EventActionResponse {
  success: boolean;
}

// GET /api/calendar/followed
interface FollowedEventsResponse {
  success: boolean;
  data: {
    total: number;
    events: CalendarEvent[];
  };
}
```

### 颜色编码规则

| 企业类型 | 颜色 | 色值 |
|----------|------|------|
| 国企 | 红色 | #E74C3C |
| 外企 | 蓝色 | #3498DB |
| 民企 | 绿色 | #27AE60 |
| 事业单位 | 紫色 | #9B59B6 |
| 其他 | 灰色 | #95A5A6 |

### 数据库优化

- 按开始时间索引
- 按企业类型索引
- 支持时间范围查询

## 验收标准

- [ ] 月度事件查询接口正常
- [ ] 事件详情接口正常
- [ ] 关注事件接口正常
- [ ] 取消关注接口正常
- [ ] 标记感兴趣接口正常
- [ ] 关注列表查询接口正常
- [ ] 颜色编码正确返回
- [ ] 过期事件标记正确
- [ ] Swagger 文档完整

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-002（数据库 events、user_events 表）

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