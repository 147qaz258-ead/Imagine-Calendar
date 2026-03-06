> **接口契约唯一可信源**: `API-CONTRACT.md`
> 所有接口定义以 API-CONTRACT.md 为准，禁止添加任何中间层。


# 畅选日历 MVP 1.0 - 技术方案 v1

## 文档元信息

| 项目 | 内容 |
|------|------|
| EPIC_ID | E-001 |
| 状态 | DRAFT |
| 创建日期 | 2026-03-04 |
| 关联文档 | `/docs/PRD-v0.md`, `/docs/STORY.md`, `/docs/biz-overview.md` |

---

## 1. 目标与范围对齐

### 1.1 业务目标（引用 biz-overview）

1. 验证学生愿意来（获取）
2. 验证学生愿意用（参与）
3. 验证用了有帮助（效果）

### 1.2 技术目标

1. 构建可扩展的 Web 应用架构，支持后续迁移至小程序/App
2. 确保数据安全，第一批用户原始数据永久保留
3. 实现高可用的实时通信系统（圆桌讨论）
4. 建立完善的可观测性体系（埋点、日志、监控）

### 1.3 范围

**本期 Must Have**：
- 用户身份认证（STORY-001）
- 用户画像建立（STORY-002）
- 机会发现核心（STORY-003）
- 精准筛选匹配（STORY-004）
- 同频人匹配（STORY-005）
- 圆桌深度交流（STORY-006）
- 成长可视化（STORY-007）
- 全流程通知（STORY-008）

**本期 Won't Have**：
- 雇主端、合作伙伴端
- 完整 8 步解锁（仅第 1-2 步）
- 简历生成器、AI 面试官

---

## 2. 现状与约束

### 2.1 代码现状

[ASSUMPTION] 项目为全新项目，无现有代码库。
[VERIFIED] 已有原型文件位于 `/docs/prototype/` 目录。

### 2.2 硬约束

| 约束类型 | 说明 |
|----------|------|
| 技术栈 | 前端 React，后端 Node.js，数据库 PostgreSQL |
| 部署 | 先 Web 端，后续迁移小程序/App |
| 数据安全 | 第一批用户原始数据永久保留 |
| 开发周期 | 8 周 |

### 2.3 核心风险

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 数据丢失 | 高 | 多级备份策略（全量 + 增量） |
| 圆桌凑不齐 6 人 | 高 | 匹配时间窗口放宽，提供备选方案 |
| 实时通信不稳定 | 中 | 断线重连机制，消息持久化 |

---

## 3. 方案总览

### 3.1 一句话方案

采用前后端分离架构，React SPA + Node.js API + PostgreSQL，通过 WebSocket 实现实时通信，Redis 缓存热点数据，构建可扩展的职业规划日历平台。

### 3.2 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端层 (Web)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   React     │  │   Redux     │  │ Socket.io   │              │
│  │   SPA       │  │   Store     │  │  Client     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        网关层 (Nginx)                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  负载均衡 / SSL 终止 / 静态资源服务 / 反向代理            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│    API 服务 (Node.js)    │    │   实时通信服务 (Socket.io)       │
│  ┌───────────────────┐  │    │  ┌───────────────────────────┐  │
│  │  Express/NestJS   │  │    │  │  WebSocket Server         │  │
│  │  REST API         │  │    │  │  房间管理 / 消息路由       │  │
│  │  JWT 鉴权         │  │    │  └───────────────────────────┘  │
│  └─────────┬─────────┘  │    └──────────────┬──────────────────┘
└────────────┼────────────┘                   │
             │                                │
             ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据层                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │   Redis     │  │   OSS       │              │
│  │  主数据库    │  │  缓存/Session│  │  文件存储   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Trade-off 分析

| 决策点 | 选择 | 理由 | 代价 |
|--------|------|------|------|
| 前端框架 | React | 生态成熟，后续迁移 RN 方便 | 学习曲线 |
| 后端框架 | NestJS | 模块化设计，TypeScript 原生支持 | 比 Express 略重 |
| 数据库 | PostgreSQL | JSONB 支持，适合灵活的偏好数据 | 运维复杂度 |
| 实时通信 | Socket.io | 成熟稳定，断线重连内置 | 包体积较大 |

### 3.4 影响面

- **新系统**：无历史包袱，可自由设计
- **数据迁移**：无历史数据迁移需求
- **用户迁移**：无历史用户

---

## 4. 详细设计

### 4.1 模块/服务边界与职责

```
前端模块结构:
├── src/
│   ├── modules/
│   │   ├── auth/           # 认证模块
│   │   ├── profile/        # 用户画像
│   │   ├── calendar/       # 日历核心
│   │   ├── filter/         # 筛选匹配
│   │   ├── roundtable/     # 圆桌讨论
│   │   ├── cognitive/      # 认知图谱
│   │   └── notification/   # 通知系统
│   ├── shared/
│   │   ├── components/     # 公共组件
│   │   ├── hooks/          # 公共 Hooks
│   │   ├── services/       # API 服务
│   │   └── utils/          # 工具函数
│   └── store/              # Redux Store

后端模块结构:
├── src/
│   ├── modules/
│   │   ├── auth/           # 认证服务
│   │   ├── user/           # 用户服务
│   │   ├── event/          # 活动服务
│   │   ├── roundtable/     # 圆桌服务
│   │   ├── notification/   # 通知服务
│   │   └── ocr/            # OCR 服务
│   ├── common/
│   │   ├── guards/         # 守卫
│   │   ├── interceptors/   # 拦截器
│   │   └── decorators/     # 装饰器
│   └── config/             # 配置
```

### 4.2 数据模型设计

#### 4.2.1 核心表结构

**用户表 (users)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) UNIQUE NOT NULL,
  nickname VARCHAR(50) DEFAULT '用户' || SUBSTRING(phone, 8, 4),
  avatar_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**用户画像表 (user_profiles)**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  school_id UUID REFERENCES schools(id),
  major_id UUID REFERENCES majors(id),
  grade VARCHAR(20),
  graduation_year INTEGER,
  city VARCHAR(50),
  name VARCHAR(50),
  student_id VARCHAR(50),
  preferences JSONB DEFAULT '{}',  -- 13维度偏好
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_school ON user_profiles(school_id);
CREATE INDEX idx_user_preferences ON user_profiles USING GIN(preferences);
```

**学校表 (schools)**
```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  province VARCHAR(50),
  city VARCHAR(50),
  level VARCHAR(20),  -- 一本/二本/三本/专科
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schools_name ON schools(name);
CREATE INDEX idx_schools_level ON schools(level);
```

**活动事件表 (events)**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  company_type VARCHAR(50),  -- 国企/外企/民企/事业单位
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location VARCHAR(500),
  job_types TEXT[],
  target_year VARCHAR(20),
  detail_url VARCHAR(500),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_company_type ON events(company_type);
CREATE INDEX idx_events_target_year ON events(target_year);
```

**用户关注事件表 (user_events)**
```sql
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  action VARCHAR(20) NOT NULL,  -- follow/interested/applied
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id, action)
);

CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_event ON user_events(event_id);
```

**圆桌分组表 (roundtables)**
```sql
CREATE TABLE roundtables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(20) DEFAULT 'matching',  -- matching/scheduled/completed/cancelled
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 120,
  topic VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roundtables_status ON roundtables(status);
CREATE INDEX idx_roundtables_scheduled ON roundtables(scheduled_at);
```

**圆桌参与者表 (roundtable_participants)**
```sql
CREATE TABLE roundtable_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roundtable_id UUID NOT NULL REFERENCES roundtables(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'applied',  -- applied/matched/attended/cancelled
  preferences JSONB DEFAULT '{}',
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roundtable_id, user_id)
);

CREATE INDEX idx_roundtable_participants_user ON roundtable_participants(user_id);
CREATE INDEX idx_roundtable_participants_rt ON roundtable_participants(roundtable_id);
```

**聊天消息表 (chat_messages)**
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roundtable_id UUID NOT NULL REFERENCES roundtables(id),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_rt ON chat_messages(roundtable_id, created_at);
```

**认知图谱表 (cognitive_maps)**
```sql
CREATE TABLE cognitive_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  dimensions JSONB NOT NULL,  -- 5维度分数
  sources JSONB DEFAULT '{}',  -- 知识来源标记
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  roundtable_id UUID REFERENCES roundtables(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cognitive_maps_user ON cognitive_maps(user_id, recorded_at);
```

**通知消息表 (notifications)**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type VARCHAR(50) NOT NULL,  -- event/roundtable/system
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at);
```

**验证码表 (verification_codes)**
```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_codes_phone ON verification_codes(phone, created_at);
```

### 4.3 API 契约设计

#### 4.3.1 认证模块

**POST /api/auth/send-code** - 发送验证码
```typescript
// Request
interface SendCodeRequest {
  phone: string;  // 11位手机号
}

// Response
interface SendCodeResponse {
  success: boolean;
  message: string;
}

// Error Codes
// - INVALID_PHONE: 手机号格式错误
// - RATE_LIMIT: 发送过于频繁
// - SMS_SERVICE_ERROR: 短信服务异常
```

**POST /api/auth/verify** - 验证登录
```typescript
// Request
interface VerifyRequest {
  phone: string;
  code: string;  // 6位验证码
}

// Response
interface VerifyResponse {
  success: boolean;
  data: {
    userId: string;
    isNewUser: boolean;
    token: string;  // JWT
    expiresIn: number;  // 7天
  };
}

// Error Codes
// - INVALID_CODE: 验证码错误
// - CODE_EXPIRED: 验证码已过期
// - TOO_MANY_ATTEMPTS: 尝试次数过多
```

#### 4.3.2 用户模块

**GET /api/user/profile** - 获取用户画像
```typescript
interface UserProfile {
  userId: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  school?: School;
  major?: Major;
  grade?: string;
  graduationYear?: number;
  city?: string;
  preferences: Preferences;
}

interface Preferences {
  location: string[];
  selfPositioning: string[];
  developmentDirection: string[];
  industry: string[];
  platformType: string[];
  companyScale: string[];
  companyCulture: string[];
  leadershipStyle: string[];
  trainingProgram: string[];
  overtimePreference: string[];
  holiday: string[];
  medicalInsurance: string[];
  maternityBenefit: string[];
}
```

**PUT /api/user/profile** - 更新用户画像
```typescript
interface UpdateProfileRequest {
  schoolId?: string;
  majorId?: string;
  grade?: string;
  city?: string;
  name?: string;
  studentId?: string;
  preferences?: Partial<Preferences>;
}
```

#### 4.3.3 日历模块

**GET /api/calendar/events** - 获取月度事件
```typescript
// Query: year, month
interface CalendarEventsResponse {
  year: number;
  month: number;
  events: CalendarEvent[];
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
```

**POST /api/calendar/filter** - 筛选事件
```typescript
interface FilterEventsRequest {
  filters: Partial<Preferences>;
  year?: number;
  month?: number;
}

interface FilterEventsResponse {
  total: number;
  events: CalendarEvent[];
}
```

**POST /api/calendar/events/:eventId/action** - 事件操作
```typescript
interface EventActionRequest {
  action: 'follow' | 'interested' | 'apply';
}
```

#### 4.3.4 圆桌模块

**POST /api/roundtable/apply** - 报名圆桌
```typescript
interface RoundtableApplyRequest {
  preferences: Partial<Preferences>;
}

interface RoundtableApplyResponse {
  applyId: string;
  status: 'matching' | 'matched';
  currentCount: number;
  targetCount: number;  // 6
}
```

**GET /api/roundtable/my** - 获取我的圆桌
```typescript
interface MyRoundtablesResponse {
  matching: RoundtableInfo[];   // 匹配中
  upcoming: RoundtableInfo[];   // 即将开始
  completed: RoundtableInfo[];  // 已完成
}

interface RoundtableInfo {
  id: string;
  status: string;
  scheduledAt?: string;
  participantCount: number;
  topic?: string;
}
```

**WebSocket 事件 (Socket.io)**
```typescript
// 客户端 -> 服务端
interface ClientEvents {
  'room:join': { roundtableId: string };
  'room:leave': { roundtableId: string };
  'message:send': { roundtableId: string; content: string };
}

// 服务端 -> 客户端
interface ServerEvents {
  'message:receive': { userId: string; nickname: string; content: string; timestamp: string };
  'user:joined': { userId: string; nickname: string };
  'user:left': { userId: string };
  'room:ended': {};
}
```

#### 4.3.5 通知模块

**GET /api/notifications** - 获取通知列表
```typescript
interface NotificationsResponse {
  total: number;
  unread: number;
  items: Notification[];
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'event' | 'roundtable' | 'system';
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}
```

**PUT /api/notifications/:id/read** - 标记已读
**PUT /api/notifications/read-all** - 全部已读

### 4.4 可观测性设计

#### 4.4.1 埋点事件定义

| 事件名 | 触发时机 | 参数 | 用途 |
|--------|----------|------|------|
| page_view | 页面加载 | page_name | 页面访问统计 |
| click_register | 点击注册 | - | 转化漏斗 |
| click_send_code | 点击发送验证码 | phone_md5 | 发送成功率 |
| verify_success | 验证成功 | is_new_user | 注册转化率 |
| verify_fail | 验证失败 | error_type | 问题定位 |
| calendar_view | 日历页加载 | year, month | 日历使用率 |
| event_click | 点击事件 | event_id | 事件关注度 |
| filter_apply | 应用筛选 | filter_keys | 筛选使用率 |
| roundtable_apply | 报名圆桌 | - | 报名转化率 |
| roundtable_attend | 参加圆桌 | roundtable_id | 到场率 |
| cognitive_update | 更新认知图 | dimension_changes | 认知变化追踪 |

#### 4.4.2 日志规范

```typescript
// 日志格式
interface LogEntry {
  timestamp: string;      // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;        // api/websocket/worker
  traceId: string;        // 链路追踪 ID
  userId?: string;
  action: string;
  data?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}
```

#### 4.4.3 监控指标

| 指标类型 | 指标名 | 说明 |
|----------|--------|------|
| Counter | api_requests_total | API 请求总数 |
| Counter | api_errors_total | API 错误总数 |
| Histogram | api_duration_seconds | API 响应时间 |
| Gauge | websocket_connections | WebSocket 连接数 |
| Gauge | active_users | 活跃用户数 |

---

## 5. NFR（非功能性需求）

### 5.1 性能要求

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 页面加载时间 | ≤3秒 | Lighthouse |
| API 响应时间 | ≤1秒 (P95) | APM |
| 并发用户数 | ≥100 | 压力测试 |
| WebSocket 延迟 | ≤200ms | 端到端测试 |

### 5.2 可靠性要求

| 指标 | 目标 |
|------|------|
| 服务可用性 | ≥99.5% |
| 数据持久性 | 99.999% |
| 故障恢复时间 | ≤30分钟 |

### 5.3 安全要求

| 要求 | 实现方式 |
|------|----------|
| 传输加密 | HTTPS (TLS 1.2+) |
| 密码存储 | 不存储密码，仅验证码登录 |
| JWT 安全 | 7天有效期，定期刷新 |
| API 限流 | 滑动窗口限流 |
| SQL 注入防护 | 参数化查询 |
| XSS 防护 | 输入过滤 + CSP |

---

## 6. 数据安全方案

### 6.1 备份策略

| 备份类型 | 频率 | 保留期 | 存储位置 |
|----------|------|--------|----------|
| 全量备份 | 每日凌晨 2:00 | 30 天 | 云存储 |
| 增量备份 | 每小时 | 7 天 | 云存储 |
| WAL 归档 | 实时 | 7 天 | 云存储 |

### 6.2 数据恢复

- RPO（恢复点目标）：≤1小时
- RTO（恢复时间目标）：≤4小时

### 6.3 跨端账号打通

- 手机号作为唯一标识
- 用户数据云端统一存储
- JWT Token 跨端通用
- 后续小程序/App 复用同一套 API

---

## 7. 部署方案

### 7.1 环境规划

| 环境 | 用途 | 域名 |
|------|------|------|
| Development | 开发环境 | dev.changxuan.com |
| Staging | 测试环境 | staging.changxuan.com |
| Production | 生产环境 | www.changxuan.com |

### 7.2 服务器配置（初期）

| 服务 | 配置 | 数量 |
|------|------|------|
| Web 服务器 | 2核4G | 1 |
| API 服务器 | 4核8G | 1 |
| 数据库 | 4核8G + 100G SSD | 1 |
| Redis | 2核4G | 1 |

### 7.3 CI/CD 流程

```
代码提交 -> GitHub Actions
    -> 单元测试
    -> 构建 Docker 镜像
    -> 部署到对应环境
    -> 自动化测试
    -> 通知团队
```

---

## 8. 风险与预案

| 风险 | 等级 | 影响 | 应对预案 |
|------|------|------|----------|
| 数据丢失 | 高 | 用户数据永久丢失 | 多级备份 + 异地容灾 |
| 短信服务故障 | 中 | 用户无法登录 | 多短信服务商备份 |
| 圆桌匹配效率低 | 中 | 用户体验差 | 放宽匹配条件 + 引导邀请 |
| OCR 识别率低 | 低 | 用户需手动输入 | 优化识别算法 + 降级手动 |

---

## 9. TASK 拆解建议

### 9.1 任务概览

| Task ID | Task Name | 依赖 Story | 优先级 | 预估工时 |
|---------|-----------|------------|--------|----------|
| TASK-001 | 项目初始化与基础架构 | - | P0 | 2天 |
| TASK-002 | 数据库设计与初始化 | TASK-001 | P0 | 1天 |
| TASK-003 | 认证服务后端 | STORY-001 | P0 | 2天 |
| TASK-004 | 认证服务前端 | STORY-001 | P0 | 2天 |
| TASK-005 | 用户画像后端 | STORY-002 | P0 | 2天 |
| TASK-006 | 用户画像前端 | STORY-002 | P0 | 2天 |
| TASK-007 | OCR 服务集成 | STORY-002 | P0 | 1天 |
| TASK-008 | 日历核心后端 | STORY-003 | P0 | 2天 |
| TASK-009 | 日历核心前端 | STORY-003 | P0 | 3天 |
| TASK-010 | 筛选匹配后端 | STORY-004 | P0 | 2天 |
| TASK-011 | 筛选匹配前端 | STORY-004 | P0 | 2天 |
| TASK-012 | 圆桌匹配后端 | STORY-005 | P0 | 2天 |
| TASK-013 | 圆桌匹配前端 | STORY-005 | P0 | 1天 |
| TASK-014 | 实时通信服务 | STORY-006 | P0 | 3天 |
| TASK-015 | 圆桌交流前端 | STORY-006 | P0 | 3天 |
| TASK-016 | 认知图谱后端 | STORY-007 | P1 | 2天 |
| TASK-017 | 认知图谱前端 | STORY-007 | P1 | 2天 |
| TASK-018 | 通知系统后端 | STORY-008 | P0 | 2天 |
| TASK-019 | 通知系统前端 | STORY-008 | P0 | 1天 |
| TASK-020 | 短信通知集成 | STORY-008 | P0 | 1天 |
| TASK-021 | 部署与运维配置 | - | P0 | 2天 |

### 9.2 依赖关系说明

详见任务依赖分析表。

---

## 10. [OPEN] 待确认事项

| 问题 | 负责人 | 状态 |
|------|--------|------|
| 招聘数据接口格式 | 数据对接负责人 | 待确认 |
| OCR 服务商选择（百度/阿里云） | 技术负责人 | 待确认 |
| 短信服务商选择 | 技术负责人 | 待确认 |
| 服务器预算审批 | 金主 | 待确认 |
| UI 设计稿 | 设计师 | 待开始 |

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |