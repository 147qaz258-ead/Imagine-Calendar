# TASK-014：实时通信服务

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-014 |
| Task Name | 实时通信服务 |
| 关联 Story | STORY-006 (圆桌深度交流) |
| 优先级 | P0 |
| 预估工时 | 3天 |
| BEADS_ID | [待填写] |

## 任务描述

实现实时通信服务，包括 WebSocket 服务器、房间管理、消息路由、消息持久化等。

## 技术要点

### 核心功能

1. **WebSocket 服务器**
   - Socket.io 服务端
   - 连接管理
   - 心跳检测

2. **房间管理**
   - 创建/销毁房间
   - 加入/离开房间
   - 房间成员管理

3. **消息路由**
   - 实时消息转发
   - 广播/单播
   - 消息确认

4. **消息持久化**
   - 消息存储
   - 历史消息查询
   - 离线消息

### WebSocket 事件设计

```typescript
// 客户端 -> 服务端
interface ClientToServerEvents {
  // 加入房间
  'room:join': (data: { roundtableId: string }, callback: (response: JoinResponse) => void) => void;

  // 离开房间
  'room:leave': (data: { roundtableId: string }) => void;

  // 发送消息
  'message:send': (data: { roundtableId: string; content: string }) => void;

  // 输入状态
  'typing:start': (data: { roundtableId: string }) => void;
  'typing:stop': (data: { roundtableId: string }) => void;
}

// 服务端 -> 客户端
interface ServerToClientEvents {
  // 接收消息
  'message:receive': (data: {
    messageId: string;
    userId: string;
    nickname: string;
    content: string;
    timestamp: string;
  }) => void;

  // 用户加入
  'user:joined': (data: { userId: string; nickname: string }) => void;

  // 用户离开
  'user:left': (data: { userId: string }) => void;

  // 输入状态
  'user:typing': (data: { userId: string; nickname: string }) => void;

  // 房间结束
  'room:ended': () => void;

  // 系统消息
  'system:message': (data: { type: string; content: string }) => void;
}

// 响应类型
interface JoinResponse {
  success: boolean;
  roomId: string;
  participants: Participant[];
  recentMessages: ChatMessage[];
}
```

### 服务端实现

```typescript
// NestJS Gateway
@WebSocketGateway({
  namespace: '/roundtable',
  cors: { origin: '*' },
})
class RoundtableGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 连接处理
  handleConnection(client: Socket) {
    // 验证 JWT Token
    // 获取用户信息
  }

  // 断开处理
  handleDisconnect(client: Socket) {
    // 清理房间状态
    // 通知其他用户
  }

  // 加入房间
  @SubscribeMessage('room:join')
  async handleJoinRoom(client: Socket, data: { roundtableId: string }) {
    // 验证权限
    // 加入 Socket.io 房间
    // 发送历史消息
    // 通知其他用户
  }

  // 发送消息
  @SubscribeMessage('message:send')
  async handleMessage(client: Socket, data: { roundtableId: string; content: string }) {
    // 保存消息到数据库
    // 广播给房间所有用户
  }
}
```

### 连接管理

```typescript
// Redis 存储连接状态
interface ConnectionStore {
  // 用户 -> Socket ID
  setUserSocket(userId: string, socketId: string): Promise<void>;

  // Socket ID -> 用户
  getSocketUser(socketId: string): Promise<string | null>;

  // 房间成员
  getRoomMembers(roundtableId: string): Promise<string[]>;

  // 添加房间成员
  addRoomMember(roundtableId: string, userId: string): Promise<void>;

  // 移除房间成员
  removeRoomMember(roundtableId: string, userId: string): Promise<void>;
}
```

### 断线重连

```typescript
// 客户端断线重连配置
const socketOptions = {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
};
```

## 验收标准

- [ ] WebSocket 服务器启动正常
- [ ] JWT 认证正常
- [ ] 加入/离开房间正常
- [ ] 消息发送/接收正常
- [ ] 消息持久化正常
- [ ] 历史消息查询正常
- [ ] 断线重连正常
- [ ] 并发 100 用户测试通过
- [ ] API 文档完整

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-001（基础框架）
- TASK-012（圆桌分组数据）

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