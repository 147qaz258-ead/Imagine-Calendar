# TASK-015：圆桌交流前端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-015 |
| Task Name | 圆桌交流前端 |
| 关联 Story | STORY-006 (圆桌深度交流) |
| 优先级 | P0 |
| 预估工时 | 3天 |
| BEADS_ID | [待填写] |

## 任务描述

实现圆桌交流前端，包括会议室页面、聊天组件、会议流程引导、认知图更新入口等。

## 技术要点

### 页面设计

1. **会议室页面**
   - 顶部：会议信息、剩余时间
   - 左侧：参与者列表
   - 中间：聊天区域
   - 底部：输入框

2. **会议流程引导**
   - 当前阶段指示
   - 倒计时
   - 话题展示

3. **聊天组件**
   - 消息列表
   - 输入框
   - 表情支持

### 核心功能

1. **WebSocket 连接**
   - Socket.io 客户端
   - 断线重连
   - 心跳检测

2. **聊天功能**
   - 发送消息
   - 接收消息
   - 消息滚动
   - 输入状态

3. **会议流程**
   - 10 分钟破冰
   - 60 分钟话题讨论
   - 30 分钟认知盘点
   - 20 分钟下一步约定

4. **认知图更新**
   - 会议中更新入口
   - 表单填写
   - 提交保存

### WebSocket 客户端

```typescript
// Socket.io 客户端封装
class RoundtableSocket {
  private socket: Socket;

  connect(roundtableId: string, token: string): void {
    this.socket = io('/roundtable', {
      auth: { token },
      query: { roundtableId },
      ...socketOptions,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    this.socket.on('connect', () => {
      console.log('Connected to roundtable');
    });

    this.socket.on('message:receive', (data) => {
      // 处理接收消息
    });

    this.socket.on('user:joined', (data) => {
      // 处理用户加入
    });

    this.socket.on('disconnect', () => {
      // 处理断开
    });
  }

  sendMessage(content: string): void {
    this.socket.emit('message:send', {
      roundtableId: this.roundtableId,
      content,
    });
  }

  joinRoom(roundtableId: string): Promise<JoinResponse> {
    return new Promise((resolve) => {
      this.socket.emit('room:join', { roundtableId }, resolve);
    });
  }

  leaveRoom(): void {
    this.socket.emit('room:leave', { roundtableId: this.roundtableId });
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
```

### 状态管理

```typescript
// Redux Slice
interface ChatState {
  messages: ChatMessage[];
  participants: Participant[];
  currentPhase: 'icebreaker' | 'discussion' | 'review' | 'wrapup';
  phaseEndTime: string | null;
  currentTopic: string | null;
  isConnected: boolean;
  isTyping: { [userId: string]: boolean };
}
```

### 会议流程时间线

```typescript
const MEETING_PHASES = [
  { id: 'icebreaker', name: '破冰环节', duration: 10, description: '自我介绍' },
  { id: 'discussion1', name: '话题讨论 1', duration: 30, description: '系统推送话题' },
  { id: 'discussion2', name: '话题讨论 2', duration: 30, description: '用户发起话题' },
  { id: 'review', name: '认知盘点', duration: 30, description: '填写认知图更新' },
  { id: 'wrapup', name: '下一步约定', duration: 20, description: '约定后续行动' },
];
```

## 验收标准

- [ ] 会议室页面布局正确
- [ ] WebSocket 连接正常
- [ ] 断线重连正常
- [ ] 发送消息正常
- [ ] 接收消息正常
- [ ] 消息滚动正常
- [ ] 输入状态显示正常
- [ ] 会议流程引导正确
- [ ] 阶段切换正常
- [ ] 认知图更新入口正常
- [ ] 参与者列表正确
- [ ] 移动端适配

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-013（圆桌匹配前端）

### 接口依赖 (interface_deps)
- TASK-014（需要 WebSocket 事件契约）

### 接口契约验证
- [ ] 已确认 TASK-014 接口契约定义完整

## 实现记录

_由 dev agent 填写_

## 测试记录

_由 dev agent 填写_

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |