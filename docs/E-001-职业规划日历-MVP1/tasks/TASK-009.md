# TASK-009：日历核心前端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-009 |
| Task Name | 日历核心前端 |
| 关联 Story | STORY-003 (机会发现核心) |
| 优先级 | P0 |
| 预估工时 | 3天 |
| BEADS_ID | [待填写] |

## 任务描述

实现日历核心前端，包括月份视图、事件展示、事件详情、颜色编码、关注功能等。

## 技术要点

### 页面设计

1. **日历月份视图**
   - 标准日历网格布局
   - 月份切换（< / >）
   - 今日高亮
   - 事件展示（最多 3 个，超出显示 "+N 更多"）

2. **事件详情卡片**
   - 模态框/抽屉展示
   - 企业信息
   - 时间地点
   - 岗位类型
   - 操作按钮

3. **颜色编码**
   - 国企红色、外企蓝色、民企绿色、事业单位紫色、其他灰色

### 核心功能

1. **日历渲染**
   - 月初第一天定位
   - 当月天数计算
   - 事件日期映射
   - 响应式布局

2. **事件展示**
   - 单日 <= 3 个：全部显示
   - 单日 > 3 个：显示前 2 个 + "+N 更多"
   - 点击展开列表

3. **事件详情**
   - 点击事件打开详情
   - 关注/取消关注
   - 标记感兴趣
   - 申请跳转

4. **月份切换**
   - 前后月切换
   - 数据加载动画
   - 骨架屏

### 接口调用

```typescript
// 日历 API
const calendarApi = {
  // 获取月度事件
  getMonthlyEvents: (year: number, month: number) =>
    axios.get('/api/calendar/events', { params: { year, month } }),

  // 获取事件详情
  getEventDetail: (eventId: string) =>
    axios.get(`/api/calendar/events/${eventId}`),

  // 事件操作
  performAction: (eventId: string, action: string) =>
    axios.post(`/api/calendar/events/${eventId}/action`, { action }),

  // 获取关注列表
  getFollowedEvents: () =>
    axios.get('/api/calendar/followed'),
};
```

### 状态管理

```typescript
// Redux Slice
interface CalendarState {
  currentYear: number;
  currentMonth: number;
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  followedEventIds: string[];
  loading: boolean;
  error: string | null;
}
```

## 验收标准

- [ ] 日历月份视图正确
- [ ] 月份切换正常
- [ ] 今日日期高亮
- [ ] 事件按日期正确展示
- [ ] 单日事件超过 3 个显示 "+N 更多"
- [ ] 点击事件显示详情
- [ ] 颜色编码正确
- [ ] 关注功能正常
- [ ] 标记感兴趣功能正常
- [ ] 骨架屏加载
- [ ] 移动端适配

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-001（基础框架）
- TASK-004（认证状态）

### 接口依赖 (interface_deps)
- TASK-008（需要日历 API 接口契约）

### 接口契约验证
- [ ] 已确认 TASK-008 接口契约定义完整

## 实现记录

_由 dev agent 填写_

## 测试记录

_由 dev agent 填写_

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |