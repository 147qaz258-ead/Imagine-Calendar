# TASK-013：圆桌匹配前端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-013 |
| Task Name | 圆桌匹配前端 |
| 关联 Story | STORY-005 (同频人匹配) |
| 优先级 | P0 |
| 预估工时 | 1天 |
| BEADS_ID | [待填写] |

## 任务描述

实现圆桌匹配前端，包括报名入口、报名页、匹配状态展示、我的圆桌列表等。

## 技术要点

### 页面设计

1. **报名入口**
   - 首页/日历页入口
   - "圆桌讨论"按钮
   - 显示当前报名人数

2. **报名页**
   - 偏好确认
   - 可修改偏好
   - 提交报名按钮

3. **匹配状态页**
   - "匹配中"状态
   - 当前人数/目标人数
   - 取消报名按钮

4. **我的圆桌列表**
   - 匹配中
   - 即将开始
   - 已完成

### 核心功能

1. **报名流程**
   - 显示用户偏好
   - 可修改偏好
   - 提交报名

2. **状态展示**
   - 匹配中动画
   - 当前人数（3/6）
   - 预计等待时间

3. **圆桌列表**
   - 分类展示
   - 点击进入详情
   - 取消报名

### 接口调用

```typescript
// 圆桌 API
const roundtableApi = {
  // 报名圆桌
  apply: (preferences: Partial<Preferences>) =>
    axios.post('/api/roundtable/apply', { preferences }),

  // 获取我的圆桌
  getMyRoundtables: () =>
    axios.get('/api/roundtable/my'),

  // 获取圆桌详情
  getRoundtableDetail: (id: string) =>
    axios.get(`/api/roundtable/${id}`),

  // 取消报名
  cancel: (id: string) =>
    axios.post(`/api/roundtable/${id}/cancel`),
};
```

### 状态管理

```typescript
// Redux Slice
interface RoundtableState {
  myRoundtables: {
    matching: RoundtableInfo[];
    upcoming: RoundtableInfo[];
    completed: RoundtableInfo[];
  };
  currentRoundtable: RoundtableInfo | null;
  loading: boolean;
  error: string | null;
}
```

## 验收标准

- [x] 报名入口展示正确
- [x] 报名页布局正确
- [x] 偏好确认/修改正常
- [x] 提交报名正常
- [x] 匹配状态展示正确
- [x] 人数进度显示正确
- [x] 我的圆桌列表正确
- [x] 取消报名正常
- [x] 移动端适配

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-009（日历核心前端）

### 接口依赖 (interface_deps)
- TASK-012（需要圆桌 API 接口契约）

### 接口契约验证
- [x] 已确认 TASK-012 接口契约定义完整

## 实现记录

### 创建的文件

1. **类型定义** - `web/src/modules/roundtable/types.ts`
   - RoundTableStatus 枚举
   - ParticipantRole 枚举
   - RoundTable 接口
   - Participant 接口
   - WebSocket 事件类型
   - 聊天消息类型

2. **API 服务** - `web/src/modules/roundtable/services/roundTableApi.ts`
   - getRoundTables - 获取圆桌列表
   - apply - 创建圆桌报名
   - getDetail - 获取圆桌详情
   - join - 加入圆桌
   - leave - 离开圆桌
   - getQuestions - 获取问题清单

3. **WebSocket 服务** - `web/src/modules/roundtable/services/roundtableSocket.ts`
   - RoundtableSocket 类
   - 事件监听机制
   - 消息发送/语音控制

4. **Redux Slice** - `web/src/modules/roundtable/store/roundTableSlice.ts`
   - 状态管理
   - 异步 Thunk 函数
   - 圆桌分类逻辑

5. **聊天 Slice** - `web/src/modules/roundtable/store/chatSlice.ts`
   - 聊天状态管理
   - 会议阶段控制

6. **组件**
   - RoundTableCard.tsx - 圆桌卡片
   - MatchingStatus.tsx - 匹配状态展示
   - ApplyForm.tsx - 报名表单
   - SixPeopleGroup.tsx - 六人小组展示
   - RoundTableList.tsx - 圆桌列表
   - RoundTableDetail.tsx - 圆桌详情

### 关键实现

1. **圆桌列表页面** (`/roundtable`)
   - Tab 切换（全部/匹配中/即将开始/已完成）
   - 报名按钮入口
   - 空状态展示

2. **圆桌详情页面** (`/roundtable/:id`)
   - 状态展示
   - 六人小组布局
   - 问题清单展示
   - 操作按钮

3. **报名流程**
   - 期望时间段选择
   - 话题选择（预设 + 自定义）
   - 提交成功反馈

4. **匹配状态**
   - 进度环形图
   - 当前参与者展示
   - 空位占位符
   - 预计等待时间

### 接口契约遵循

所有 API 调用严格遵循 API-CONTRACT.md 定义：
- GET /api/round-tables
- POST /api/round-tables/apply
- GET /api/round-tables/:id
- POST /api/round-tables/:id/join
- POST /api/round-tables/:id/leave
- GET /api/round-tables/questions

## 测试记录

### 编译测试
- [x] TypeScript 编译通过
- [x] Vite 构建成功
- [x] 无类型错误

### 功能验证
- [x] 圆桌列表页面可访问
- [x] 圆桌详情页面可访问
- [x] 报名表单交互正常
- [x] 匹配状态展示正常
- [x] 六人小组布局正确

### 待集成测试
- [ ] 后端 API 联调
- [ ] WebSocket 连接测试
- [ ] E2E 测试

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |