# API Contract - 唯一可信源

> ⚠️ **治理规则**
> 1. 本文档是接口契约的唯一可信源（Single Source of Truth）
> 2. 任何接口新增/修改必须先更新本文档
> 3. 前后端开发必须严格遵循本文档定义
> 4. 禁止添加任何中间层、禁止出现违反接口的代码
> 5. 契约变更需要评审并记录 CHANGELOG

---

## 目录

1. [数据模型](#1-数据模型)
2. [认证接口](#2-认证接口)
3. [用户画像接口](#3-用户画像接口)
4. [日历核心接口](#4-日历核心接口)
5. [筛选匹配接口](#5-筛选匹配接口)
6. [圆桌讨论接口](#6-圆桌讨论接口)
7. [认知图谱接口](#7-认知图谱接口)
8. [通知系统接口](#8-通知系统接口)
9. [WebSocket 事件](#9-websocket-事件)
10. [错误码定义](#10-错误码定义)

---

## 1. 数据模型

### 1.1 User（用户）

```typescript
interface User {
  id: string;                    // UUID
  phone: string;                 // 手机号（唯一标识）
  nickname?: string;             // 昵称
  avatar?: string;               // 头像URL
  school?: string;               // 学校
  major?: string;                // 专业
  grade?: string;                // 年级
  studentId?: string;            // 学号
  graduationYear?: number;       // 毕业年份
  preferences: UserPreferences;  // 用户偏好（13维度）
  cognitiveMap?: CognitiveMap;   // 认知边界图
  status: UserStatus;            // 用户状态
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

interface UserPreferences {
  locations: string[];           // 地点偏好
  selfPositioning: string[];     // 自我定位
  developmentDirection: string[];// 发展方向
  industries: string[];          // 行业偏好
  platformTypes: string[];       // 平台性质
  companyScales: string[];       // 企业规模
  companyCulture: string[];      // 企业文化
  leadershipStyle: string[];     // 领导风格
  trainingPrograms: string[];    // 培训项目
  overtimePreference: string[];  // 加班偏好
  holidayPolicy: string[];       // 假期偏好
  medicalBenefits: string[];     // 医疗保障
  maternityBenefits: string[];   // 生育福利
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned'
}
```

### 1.2 Event（招聘事件）

```typescript
interface Event {
  id: string;                    // UUID
  title: string;                 // 事件标题
  company: string;               // 企业名称
  companyType: CompanyType;      // 企业类型（颜色编码）
  position: string;              // 岗位名称
  description?: string;          // 事件描述
  location?: string;             // 地点
  eventDate: string;             // 事件日期 YYYY-MM-DD
  startTime?: string;            // 开始时间 HH:mm
  endTime?: string;              // 结束时间 HH:mm
  deadline?: string;             // 截止日期 ISO 8601
  requirements?: string[];       // 岗位要求
  benefits?: string[];           // 福利待遇
  applyUrl?: string;             // 申请链接
  tags: string[];                // 标签
  source: string;                // 来源
  createdAt: string;
  updatedAt: string;
}

enum CompanyType {
  SOE = 'soe',                   // 国企（灰色）
  FOREIGN = 'foreign',           // 外企（紫色）
  PRIVATE = 'private',           // 民企（黄色）
  STARTUP = 'startup',           // 创业公司（橙色）
  GOVERNMENT = 'government',     // 事业单位（蓝色）
}
```

### 1.3 RoundTable（圆桌讨论）

```typescript
interface RoundTable {
  id: string;                    // UUID
  topic: string;                 // 讨论主题
  description?: string;          // 描述
  scheduledAt: string;           // 预定时间 ISO 8601
  duration: number;              // 时长（分钟）
  maxParticipants: number;       // 最大参与人数（固定6人）
  participants: Participant[];   // 参与者列表
  status: RoundTableStatus;      // 状态
  questions: string[];           // 讨论问题清单
  summary?: string;              // 讨论纪要
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  userId: string;
  nickname: string;
  avatar?: string;
  joinedAt: string;
  role: ParticipantRole;
}

enum RoundTableStatus {
  MATCHING = 'matching',         // 匹配中
  READY = 'ready',               // 人齐待开始
  IN_PROGRESS = 'in_progress',   // 进行中
  COMPLETED = 'completed',       // 已完成
  CANCELLED = 'cancelled'        // 已取消
}

enum ParticipantRole {
  HOST = 'host',                 // 主持人
  MEMBER = 'member'              // 普通成员
}
```

### 1.4 CognitiveMap（认知边界图）

```typescript
interface CognitiveMap {
  id: string;
  userId: string;
  dimensions: CognitiveDimension[];
  history: CognitiveHistory[];
  createdAt: string;
  updatedAt: string;
}

interface CognitiveDimension {
  name: string;                  // 维度名称
  score: number;                 // 分数 0-100
  knowledgeSource: KnowledgeSource[]; // 知识来源
}

interface KnowledgeSource {
  type: KnowledgeSourceType;     // 来源类型
  description: string;           // 描述
  depth: number;                 // 深度 1-3
  contributedAt: string;         // 贡献时间
}

enum KnowledgeSourceType {
  SELF_EXPLORATION = 'self_exploration',    // 自我探索（深绿）
  OTHERS_SHARING = 'others_sharing',        // 他人分享（浅绿）
  ROUND_TABLE = 'round_table',              // 圆桌讨论（特定色）
  STUDY_BUDDY = 'study_buddy',              // 学习伙伴
  CASE_STUDY = 'case_study',                // 案例实践
}

interface CognitiveHistory {
  date: string;
  dimensions: CognitiveDimension[];
  triggeredBy: string;           // 触发原因
}
```

### 1.5 Notification（通知）

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;    // 附加数据
  read: boolean;
  readAt?: string;
  createdAt: string;
}

enum NotificationType {
  EVENT_REMINDER = 'event_reminder',         // 活动提醒
  ROUND_TABLE_INVITE = 'round_table_invite', // 圆桌邀请
  ROUND_TABLE_START = 'round_table_start',   // 圆桌开始
  SYSTEM = 'system',                         // 系统消息
}
```

---

## 2. 认证接口

### 2.1 发送验证码

```typescript
// POST /api/auth/send-code
// Request
interface SendCodeRequest {
  phone: string;                 // 手机号
  scene: 'login' | 'register';   // 场景
}

// Response
interface SendCodeResponse {
  success: boolean;
  message: string;
  data?: {
    expiresIn: number;           // 验证码有效期（秒）
  };
}

// Error Codes: AUTH_PHONE_INVALID, AUTH_CODE_TOO_FREQUENT
```

### 2.2 验证码登录/注册

```typescript
// POST /api/auth/login
// Request
interface LoginRequest {
  phone: string;
  code: string;                  // 验证码
}

// Response
interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;               // JWT Token
    expiresIn: number;           // Token有效期（秒）
    isNewUser: boolean;          // 是否新用户
  };
}

// Error Codes: AUTH_CODE_INVALID, AUTH_CODE_EXPIRED
```

### 2.3 刷新 Token

```typescript
// POST /api/auth/refresh
// Request
interface RefreshRequest {
  token: string;
}

// Response
interface RefreshResponse {
  success: boolean;
  data: {
    token: string;
    expiresIn: number;
  };
}

// Error Codes: AUTH_TOKEN_INVALID, AUTH_TOKEN_EXPIRED
```

### 2.4 获取当前用户

```typescript
// GET /api/auth/me
// Headers: Authorization: Bearer <token>
// Response
interface MeResponse {
  success: boolean;
  data: User;
}

// Error Codes: AUTH_UNAUTHORIZED
```

---

## 3. 用户画像接口

### 3.1 获取用户画像

```typescript
// GET /api/users/:id/profile
// Response
interface ProfileResponse {
  success: boolean;
  data: User;
}

// Error Codes: USER_NOT_FOUND
```

### 3.2 更新用户画像

```typescript
// PUT /api/users/:id/profile
// Request
interface UpdateProfileRequest {
  nickname?: string;
  avatar?: string;
  school?: string;
  major?: string;
  grade?: string;
  studentId?: string;
  graduationYear?: number;
}

// Response
interface UpdateProfileResponse {
  success: boolean;
  data: User;
}

// Error Codes: USER_NOT_FOUND, USER_UPDATE_FAILED
```

### 3.3 更新用户偏好（13维度）

```typescript
// PUT /api/users/:id/preferences
// Request
interface UpdatePreferencesRequest {
  preferences: Partial<UserPreferences>;
}

// Response
interface UpdatePreferencesResponse {
  success: boolean;
  data: {
    preferences: UserPreferences;
    matchingScore: number;       // 匹配度评分
  };
}

// Error Codes: USER_NOT_FOUND, PREFERENCES_INVALID
```

### 3.4 上传学生证（OCR）

```typescript
// POST /api/users/:id/student-card
// Request: multipart/form-data
interface UploadStudentCardRequest {
  image: File;                   // 学生证图片
}

// Response
interface UploadStudentCardResponse {
  success: boolean;
  data: {
    school?: string;
    major?: string;
    grade?: string;
    studentId?: string;
    confidence: number;          // OCR置信度
  };
}

// Error Codes: UPLOAD_FAILED, OCR_FAILED
```

---

## 4. 日历核心接口

### 4.1 获取日历事件

```typescript
// GET /api/events/calendar
// Query Parameters
interface CalendarQuery {
  year: number;                  // 年份
  month: number;                 // 月份 1-12
  companyType?: CompanyType;     // 企业类型筛选
  industries?: string[];         // 行业筛选
}

// Response
interface CalendarResponse {
  success: boolean;
  data: {
    year: number;
    month: number;
    events: CalendarEvent[];
  };
}

interface CalendarEvent {
  id: string;
  date: string;                  // YYYY-MM-DD
  title: string;
  company: string;
  companyType: CompanyType;
  position: string;
}
```

### 4.2 获取事件详情

```typescript
// GET /api/events/:id
// Response
interface EventDetailResponse {
  success: boolean;
  data: Event;
}

// Error Codes: EVENT_NOT_FOUND
```

### 4.3 关注/取消关注事件

```typescript
// POST /api/events/:id/follow
// DELETE /api/events/:id/follow
// Response
interface FollowResponse {
  success: boolean;
  data: {
    followed: boolean;
    followerCount: number;
  };
}
```

### 4.4 获取已关注事件

```typescript
// GET /api/users/:id/followed-events
// Response
interface FollowedEventsResponse {
  success: boolean;
  data: Event[];
}
```

---

## 5. 筛选匹配接口

### 5.1 获取筛选选项

```typescript
// GET /api/filters/options
// Response
interface FilterOptionsResponse {
  success: boolean;
  data: {
    locations: FilterOption[];
    selfPositioning: FilterOption[];
    developmentDirection: FilterOption[];
    industries: FilterOption[];
    platformTypes: FilterOption[];
    companyScales: FilterOption[];
    companyCulture: FilterOption[];
    leadershipStyle: FilterOption[];
    trainingPrograms: FilterOption[];
    overtimePreference: FilterOption[];
    holidayPolicy: FilterOption[];
    medicalBenefits: FilterOption[];
    maternityBenefits: FilterOption[];
  };
}

interface FilterOption {
  value: string;
  label: string;
  description?: string;
}
```

### 5.2 筛选事件

```typescript
// POST /api/events/filter
// Request
interface FilterEventsRequest {
  preferences: Partial<UserPreferences>;
  dateRange?: {
    start: string;               // YYYY-MM-DD
    end: string;                 // YYYY-MM-DD
  };
  page?: number;
  pageSize?: number;
}

// Response
interface FilterEventsResponse {
  success: boolean;
  data: {
    events: Event[];
    total: number;
    page: number;
    pageSize: number;
  };
}
```

### 5.3 获取匹配度分析

```typescript
// POST /api/matching/analyze
// Request
interface MatchingAnalyzeRequest {
  eventId: string;
}

// Response
interface MatchingAnalyzeResponse {
  success: boolean;
  data: {
    overallScore: number;        // 总匹配度 0-100
    dimensions: DimensionMatch[];
    suggestions: string[];       // 改进建议
  };
}

interface DimensionMatch {
  name: string;
  score: number;
  matched: boolean;
  gap?: string;                  // 差距说明
}
```

---

## 6. 圆桌讨论接口

### 6.1 获取圆桌列表

```typescript
// GET /api/round-tables
// Query Parameters
interface RoundTableQuery {
  status?: RoundTableStatus;
  page?: number;
  pageSize?: number;
}

// Response
interface RoundTableListResponse {
  success: boolean;
  data: {
    roundTables: RoundTable[];
    total: number;
    page: number;
    pageSize: number;
  };
}
```

### 6.2 创建圆桌报名

```typescript
// POST /api/round-tables/apply
// Request
interface ApplyRoundTableRequest {
  preferredTimes: string[];      // 期望时间段 ISO 8601
  topics?: string[];             // 感兴趣的话题
}

// Response
interface ApplyRoundTableResponse {
  success: boolean;
  data: {
    applicationId: string;
    status: 'pending' | 'matched';
    estimatedWaitTime?: number;  // 预计等待时间（分钟）
  };
}
```

### 6.3 获取圆桌详情

```typescript
// GET /api/round-tables/:id
// Response
interface RoundTableDetailResponse {
  success: boolean;
  data: RoundTable;
}

// Error Codes: ROUND_TABLE_NOT_FOUND
```

### 6.4 加入圆桌

```typescript
// POST /api/round-tables/:id/join
// Response
interface JoinRoundTableResponse {
  success: boolean;
  data: {
    roundTable: RoundTable;
    wsEndpoint: string;          // WebSocket 连接地址
  };
}

// Error Codes: ROUND_TABLE_FULL, ROUND_TABLE_NOT_READY
```

### 6.5 离开圆桌

```typescript
// POST /api/round-tables/:id/leave
// Response
interface LeaveRoundTableResponse {
  success: boolean;
  data: {
    left: boolean;
    roundTable?: RoundTable;     // 更新后的圆桌信息
  };
}
```

### 6.6 提交圆桌讨论纪要

```typescript
// POST /api/round-tables/:id/summary
// Request
interface SubmitSummaryRequest {
  summary: string;
  keyPoints: string[];
  actionItems?: string[];
}

// Response
interface SubmitSummaryResponse {
  success: boolean;
  data: {
    roundTable: RoundTable;
    cognitiveMapUpdate?: CognitiveMap;
  };
}
```

### 6.7 获取圆桌问题清单

```typescript
// GET /api/round-tables/questions
// Response
interface QuestionsResponse {
  success: boolean;
  data: {
    questions: RoundTableQuestion[];
  };
}

interface RoundTableQuestion {
  id: string;
  category: string;              // 问题类别
  question: string;              // 问题内容
  followUp?: string[];           // 追问
}
```

---

## 7. 认知图谱接口

### 7.1 获取认知图谱

```typescript
// GET /api/users/:id/cognitive-map
// Response
interface CognitiveMapResponse {
  success: boolean;
  data: CognitiveMap;
}

// Error Codes: COGNITIVE_MAP_NOT_FOUND
```

### 7.2 更新认知维度

```typescript
// PUT /api/users/:id/cognitive-map/dimensions
// Request
interface UpdateDimensionRequest {
  dimension: string;
  score: number;
  knowledgeSource: KnowledgeSource;
}

// Response
interface UpdateDimensionResponse {
  success: boolean;
  data: CognitiveMap;
}
```

### 7.3 获取认知历史

```typescript
// GET /api/users/:id/cognitive-map/history
// Query Parameters
interface CognitiveHistoryQuery {
  startDate?: string;            // ISO 8601
  endDate?: string;              // ISO 8601
}

// Response
interface CognitiveHistoryResponse {
  success: boolean;
  data: {
    history: CognitiveHistory[];
    trend: DimensionTrend[];
  };
}

interface DimensionTrend {
  dimension: string;
  values: {
    date: string;
    score: number;
  }[];
}
```

### 7.4 对比认知图谱

```typescript
// POST /api/cognitive-map/compare
// Request
interface CompareCognitiveMapRequest {
  userIds: string[];             // 最多6人
}

// Response
interface CompareCognitiveMapResponse {
  success: boolean;
  data: {
    users: {
      userId: string;
      nickname: string;
      dimensions: CognitiveDimension[];
    }[];
    commonStrengths: string[];   // 共同优势
    commonGaps: string[];        // 共同差距
    complementary: string[];     // 互补项
  };
}
```

---

## 8. 通知系统接口

### 8.1 获取通知列表

```typescript
// GET /api/notifications
// Query Parameters
interface NotificationQuery {
  type?: NotificationType;
  read?: boolean;
  page?: number;
  pageSize?: number;
}

// Response
interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    total: number;
    unreadCount: number;
  };
}
```

### 8.2 标记通知已读

```typescript
// PUT /api/notifications/:id/read
// Response
interface MarkReadResponse {
  success: boolean;
  data: {
    read: boolean;
    readAt: string;
  };
}
```

### 8.3 全部标记已读

```typescript
// PUT /api/notifications/read-all
// Response
interface MarkAllReadResponse {
  success: boolean;
  data: {
    updatedCount: number;
  };
}
```

### 8.4 获取未读数量

```typescript
// GET /api/notifications/unread-count
// Response
interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
    byType: Record<NotificationType, number>;
  };
}
```

---

## 9. WebSocket 事件

### 9.1 连接

```typescript
// WebSocket 连接地址
// ws://host/round-tables/:id/ws?token=<jwt>

// 连接成功
interface ConnectedEvent {
  type: 'connected';
  data: {
    roundTableId: string;
    userId: string;
    participants: Participant[];
  };
}
```

### 9.2 用户事件

```typescript
// 用户加入
interface UserJoinedEvent {
  type: 'user_joined';
  data: {
    user: Participant;
  };
}

// 用户离开
interface UserLeftEvent {
  type: 'user_left';
  data: {
    userId: string;
  };
}

// 用户状态变更
interface UserStatusEvent {
  type: 'user_status';
  data: {
    userId: string;
    status: 'speaking' | 'idle' | 'typing';
  };
}
```

### 9.3 消息事件

```typescript
// 发送消息
interface SendMessagePayload {
  type: 'send_message';
  data: {
    content: string;
    contentType: 'text' | 'image' | 'file';
  };
}

// 接收消息
interface ReceiveMessageEvent {
  type: 'receive_message';
  data: {
    id: string;
    userId: string;
    nickname: string;
    content: string;
    contentType: 'text' | 'image' | 'file';
    createdAt: string;
  };
}
```

### 9.4 语音事件

```typescript
// 开始说话
interface StartSpeakingPayload {
  type: 'start_speaking';
}

// 停止说话
interface StopSpeakingPayload {
  type: 'stop_speaking';
}

// 语音数据（二进制）
// 通过 WebRTC 传输，不经过 WebSocket
```

### 9.5 圆桌状态事件

```typescript
// 圆桌开始
interface RoundTableStartEvent {
  type: 'round_table_start';
  data: {
    startedAt: string;
    duration: number;
  };
}

// 圆桌结束
interface RoundTableEndEvent {
  type: 'round_table_end';
  data: {
    endedAt: string;
    duration: number;
    summary: string;
  };
}

// 进入下一环节
interface NextPhaseEvent {
  type: 'next_phase';
  data: {
    phase: number;
    phaseName: string;
    question?: string;
  };
}
```

### 9.6 错误事件

```typescript
interface ErrorEvent {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}
```

---

## 10. 错误码定义

### 10.1 通用错误码

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| SUCCESS | 200 | 成功 |
| BAD_REQUEST | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### 10.2 认证错误码 (AUTH_*)

| 错误码 | 说明 |
|--------|------|
| AUTH_PHONE_INVALID | 手机号格式无效 |
| AUTH_CODE_INVALID | 验证码错误 |
| AUTH_CODE_EXPIRED | 验证码已过期 |
| AUTH_CODE_TOO_FREQUENT | 验证码发送过于频繁 |
| AUTH_TOKEN_INVALID | Token无效 |
| AUTH_TOKEN_EXPIRED | Token已过期 |
| AUTH_UNAUTHORIZED | 未登录 |

### 10.3 用户错误码 (USER_*)

| 错误码 | 说明 |
|--------|------|
| USER_NOT_FOUND | 用户不存在 |
| USER_UPDATE_FAILED | 用户信息更新失败 |
| PREFERENCES_INVALID | 偏好设置无效 |

### 10.4 事件错误码 (EVENT_*)

| 错误码 | 说明 |
|--------|------|
| EVENT_NOT_FOUND | 事件不存在 |
| EVENT_ALREADY_FOLLOWED | 已关注该事件 |
| EVENT_NOT_FOLLOWED | 未关注该事件 |

### 10.5 圆桌错误码 (ROUND_TABLE_*)

| 错误码 | 说明 |
|--------|------|
| ROUND_TABLE_NOT_FOUND | 圆桌不存在 |
| ROUND_TABLE_FULL | 圆桌已满 |
| ROUND_TABLE_NOT_READY | 圆桌未准备好 |
| ROUND_TABLE_ALREADY_STARTED | 圆桌已开始 |
| ROUND_TABLE_NOT_PARTICIPANT | 非圆桌参与者 |

### 10.6 文件上传错误码 (UPLOAD_*)

| 错误码 | 说明 |
|--------|------|
| UPLOAD_FAILED | 上传失败 |
| UPLOAD_FILE_TOO_LARGE | 文件过大 |
| UPLOAD_INVALID_TYPE | 文件类型不支持 |
| OCR_FAILED | OCR识别失败 |

---

## 变更日志

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 2026-03-04 | v1.0.0 | 初始版本 | tech agent |

---

## 治理流程

### 新增接口
1. 在对应章节添加接口定义
2. 更新变更日志
3. 提交评审
4. 评审通过后方可开发

### 修改接口
1. 在变更日志记录变更内容
2. 评估影响范围
3. 通知相关开发者
4. 版本号递增

### 废弃接口
1. 标记为 `@deprecated`
2. 在变更日志记录废弃原因
3. 设置废弃时间（至少保留3个版本）
4. 通知所有使用者