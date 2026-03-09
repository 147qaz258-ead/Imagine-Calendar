# 畅选日历 - 完整功能实现设计文档

**文档版本**: V2.0
**创建日期**: 2026-03-08
**状态**: 设计规划

---

## 一、核心问题分析

### 1.1 当前紧急问题

| 问题 | 严重程度 | 状态 | 说明 |
|------|---------|------|------|
| 404 错误 `/api/cognitive-boundary/assessment` | 🔴 紧急 | 待修复 | 可能是部署/数据库表同步问题 |
| 密码表单警告 | 🟡 一般 | 待修复 | 需要包裹在 `<form>` 标签中 |

### 1.2 架构耦合分析

```
用户注册/登录
    ↓
个性化偏好设置 (13维度) ────────┬──→ 活动筛选匹配 (权重算法)
    │                           │
    │                           └──→ 圆桌自动分组 (相似度匹配)
    │                                    │
    ↓                                    ↓
摸索认知边界评估 ────────────→ 认知图谱数据源
    │
    └──→ 会前准备问题清单状态
```

**关键发现**：
1. **个性化设置是核心入口点** - 同时影响活动筛选和圆桌分组
2. **认知边界评估是独立模块** - 但需要与认知图谱绑定
3. **当前流程顺序正确** - welcome → exploration → preferences → completed

---

## 二、用户流程完整定义

### 2.1 新用户首次进入流程（已确认调整）

> **重要决策**：认知边界评估**不在引导流程中**，而是在**认知图谱模块**中，用户主动点击才触发。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     新用户引导流程（简化版）                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐         │
│  │  用户注册   │───→│ 产品定位弹窗     │───→│ 个性化偏好设置     │         │
│  │  /login     │    │ (welcome阶段)    │    │ (preferences阶段)  │         │
│  └─────────────┘    └──────────────────┘    └────────────────────┘         │
│         │                                           │                      │
│         │                                           ↓                      │
│         │                                   ┌────────────────────┐          │
│         │                                   │ 13维度偏好选择     │          │
│         │                                   │ (地点/行业/规模等) │          │
│         │                                   └────────────────────┘          │
│         │                                           │                      │
│         │                                           ↓                      │
│         │                                   ┌────────────────────┐          │
│         │                                   │ 保存偏好后自动     │          │
│         │                                   │ 触发圆桌匹配       │          │
│         │                                   └────────────────────┘          │
│         │                                           │                      │
│         └───────────────────────────────────────────┼──────────────────────│
│                                                     ↓                      │
│                                             ┌────────────────────┐          │
│                                             │ 进入日历主页       │          │
│                                             │ (completed阶段)    │          │
│                                             └────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

【认知边界评估入口】（独立于引导流程）
                              │
                              ↓
                    ┌────────────────────┐
                    │ 用户点击"认知图谱" │
                    │ 或"摸索认知边界"   │
                    └────────────────────┘
                              │
                              ↓
                    ┌────────────────────┐
                    │ 认知边界评估页面   │
                    │ （根据偏好动态展示 │
                    │  相关问题）        │
                    └────────────────────┘
```

### 2.2 状态判断逻辑（调整后）

| 用户状态 | 判断条件 | 触发动作 |
|---------|---------|---------|
| 未登录 | `!localStorage.token` | 跳转到 `/login` |
| 新用户-欢迎阶段 | `onboardingStep === 'welcome'` | 显示产品定位弹窗 |
| ~~新用户-探索阶段~~ | ~~`onboardingStep === 'exploration'`~~ | **删除此阶段** |
| 新用户-偏好阶段 | `onboardingStep === 'preferences'` | 跳转到 `/profile/preferences` |
| 已完成引导 | `onboardingStep === 'completed'` | 正常使用 |

**需要移除 `exploration` 阶段**，简化引导流程。

---

## 三、功能模块详细设计

### 3.1 登录/注册模块

#### 当前实现状态
- ✅ 手机号+验证码登录
- ✅ 手机号+密码登录
- ✅ 手机号+验证码+密码注册
- ✅ JWT Token 管理

#### PRD要求差异
| PRD要求 | 当前实现 | 差异 | 优先级 |
|---------|---------|------|-------|
| 邮箱+密码登录 | 手机号+密码 | 保留手机号方案 | P2(后续) |
| 邀请码必填 | 无邀请码 | **需要新增** | P1 |
| 产品定位弹窗 | ✅ 已实现 | 无 | - |

#### 新增功能：邀请码系统

```typescript
// 新增字段
interface RegisterDto {
  phone: string
  password: string
  verificationCode: string
  inviteCode: string  // 新增：必填邀请码
}

// 后端逻辑
async register(dto: RegisterDto) {
  // 1. 验证邀请码有效性
  const inviteCode = await this.inviteCodeRepo.findOne({ code: dto.inviteCode })
  if (!inviteCode || inviteCode.usedCount >= inviteCode.maxUses) {
    throw new BadRequestException('邀请码无效或已过期')
  }

  // 2. 创建用户
  const user = await this.createUser(dto)

  // 3. 关联邀请码
  await this.inviteCodeRepo.increment({ id: inviteCode.id }, 'usedCount', 1)

  // 4. 根据邀请码分配到预设群组（如果有）
  if (inviteCode.groupId) {
    await this.assignUserToGroup(user.id, inviteCode.groupId)
  }
}
```

---

### 3.2 个性化偏好设置模块

#### 当前实现状态
- ✅ 13维度偏好选择（多选）
- ✅ 偏好保存和更新
- ✅ 匹配度评分计算
- ✅ 引导流程集成

#### PRD要求差异

**PRD核心要求**：每个偏好问题下方有**认知程度滑动条**

```
┌─────────────────────────────────────────────────────────────────┐
│ 地点偏好                                                        │
│ ┌─────── ┐ ┌─────── ┐ ┌─────── ┐                                │
│ │ 北京  │ │ 上海  │ │ 深圳  │  ← 选项按钮                       │
│ └─────── ┘ └─────── ┘ └─────── ┘                                │
│                                                                 │
│ 你对"北京"的了解程度：                                          │
│ ├─────────────●──────────────────────────────┤                  │
│ 完全不知道    听说过    做过搜索    知道事实    深入了解        │
│                                                                 │
│ 你对"上海"的了解程度：                                          │
│ ├─────────────────────●────────────────────┤                    │
│ 完全不知道    听说过    做过搜索    知道事实    深入了解        │
└─────────────────────────────────────────────────────────────────┘
```

#### 架构调整方案

**方案A（推荐）：合并到认知边界评估**
- 个性化偏好设置时仅选择选项
- 认知程度评估统一在"摸索认知边界"模块完成
- 优点：逻辑清晰，避免重复
- 缺点：需要调整引导流程顺序

**方案B：分步式**
- 每个维度选择后立即弹出认知程度滑动条
- 优点：符合PRD描述
- 缺点：用户体验较繁琐，数据存储重复

**推荐采用方案A**，理由：
1. 当前的"摸索认知边界"已有完整的评估逻辑
2. PRD中的"认知程度滑动条"本质上就是认知边界评估
3. 避免用户在两处填写相似内容

#### 功能完善点

```typescript
// 个性化偏好关联活动筛选
interface UserPreferences {
  locations: string[]
  industries: string[]
  // ... 13个维度

  // 新增：关联的筛选条件
  filterCondition?: {
    minMatchingScore: number  // 最低匹配度阈值
    excludeTags: string[]     // 排除标签
  }
}
```

---

### 3.3 摸索认知边界模块（在认知图谱中触发）

> **重要**：此模块**不在引导流程中**，用户需主动点击"认知图谱"或"摸索认知边界"入口才会触发。

#### 当前实现状态
- ✅ 13维度 × 5问题 = 65题评估
- ✅ 5级滑动条评估
- ✅ 进度追踪
- ✅ 评估结果存储
- ❌ 引导流程集成（需移除）

#### 触发方式调整

```typescript
// 认知图谱页面入口
function CognitivePage() {
  const [showAssessment, setShowAssessment] = useState(false)

  return (
    <div>
      <h1>认知图谱</h1>

      {/* 认知边界评估入口按钮 */}
      <button onClick={() => setShowAssessment(true)}>
        摸索认知边界
      </button>

      {/* 点击后才显示评估页面 */}
      {showAssessment && <CognitiveBoundaryAssessment />}
    </div>
  )
}
```

#### PRD要求差异

**PRD核心要求**：动态问题展示 + 多选独立保存

```
场景：用户选择"北京"和"上海"两个地点

当前实现：
- 显示固定的5个问题（与地点无关的通用问题）

PRD要求：
- "北京"下方显示5个北京相关问题
- "上海"下方显示5个上海相关问题
- 每个选项的答案独立保存
```

#### 架构调整方案

**数据结构调整**

```typescript
// 当前：固定问题结构
interface QuestionAssessmentData {
  questionId: string    // 格式: dimensionKey-number
  level: number
  assessedAt: string
}

// 调整后：支持动态子问题
interface QuestionAssessmentData {
  questionId: string    // 格式: dimensionKey-subCategory-number
  subCategory?: string  // 子类别：如"北京"、"上海"
  level: number
  assessedAt: string
  notes?: string        // 新增：备注框（PRD要求）
  stage?: 'initial' | 'after_roundtable'  // 新增：填写阶段
}
```

**问题数据结构调整**

```typescript
// 新的问题结构
interface CognitiveQuestion {
  id: string
  dimensionKey: string
  subCategory?: string   // 子类别
  question: string
  followUp?: string[]    // 追问
  relatedOptions?: string[]  // 关联的偏好选项
}

// 示例
const LOCATION_QUESTIONS: CognitiveQuestion[] = [
  {
    id: 'location-beijing-1',
    dimensionKey: 'locations',
    subCategory: '北京',
    question: '你对北京的就业市场了解多少？',
    relatedOptions: ['北京']
  },
  {
    id: 'location-shanghai-1',
    dimensionKey: 'locations',
    subCategory: '上海',
    question: '你对上海的就业市场了解多少？',
    relatedOptions: ['上海']
  }
]
```

**前端逻辑调整**

```typescript
// 根据用户偏好动态加载问题
function getDynamicQuestions(preferences: UserPreferences): CognitiveQuestion[] {
  const questions: CognitiveQuestion[] = []

  // 地点问题
  for (const location of preferences.locations) {
    questions.push(...getLocationQuestions(location))
  }

  // 行业问题
  for (const industry of preferences.industries) {
    questions.push(...getIndustryQuestions(industry))
  }

  // ... 其他维度

  return questions
}
```

---

### 3.4 认知图谱模块

#### 当前实现状态
- ✅ 雷达图展示
- ✅ 维度详情卡片
- ✅ 历史记录查看
- ✅ 知识来源记录

#### PRD要求差异

**核心新增功能：认知报告多版本对比**

```
┌─────────────────────────────────────────────────────────────────┐
│                      认知边界对比图                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    雷达图对比                            │   │
│  │    ──── 初始评估（蓝色）                                │   │
│  │    .... 圆桌后评估（绿色）                              │   │
│  │                                                          │   │
│  │         地点认知                                         │   │
│  │           /\          自我定位                           │   │
│  │          /  \           /\                               │   │
│  │         /    \         /  \                              │   │
│  │        /      \_______/    \                             │   │
│  │       /                    \                              │   │
│  │      ────────────────────────                            │   │
│  │         行业认知    发展方向                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 维度详情（点击雷达图后展开）                             │   │
│  │                                                          │   │
│  │ 地点认知：                                               │   │
│  │ ├─ 初始评分：45分 [浅蓝色框]                            │   │
│  │ │  备注：刚开始了解北京市场                             │   │
│  │ │                                                       │   │
│  │ ├─ 圆桌后评分：65分 [浅绿色框]                          │   │
│  │ │  备注：通过讨论了解到北京互联网机会多                 │   │
│  │ │                                                       │   │
│  │ └─ 提升：+20分                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### 数据结构扩展

```typescript
// 认知版本记录
interface CognitiveVersion {
  id: string
  userId: string
  version: number
  stage: 'initial' | 'after_roundtable' | 'after_study'
  recordedAt: Date
  roundTableId?: string
  dimensions: DimensionSnapshot[]
}

interface DimensionSnapshot {
  dimensionKey: string
  dimensionName: string
  score: number
  color: string  // UI颜色区分
  notes?: string // 备注
  assessments: QuestionAssessmentData[]
}

// 新增API
// GET /api/cognitive/versions - 获取所有版本
// GET /api/cognitive/compare?version1=1&version2=2 - 对比两个版本
// POST /api/cognitive/version - 创建新版本（圆桌后触发）
```

---

### 3.5 圆桌讨论模块（需重命名为"我的群组"）

#### 当前实现状态
- ✅ 圆桌列表展示
- ✅ 自动匹配功能
- ✅ 聊天室基础功能
- ✅ 匹配状态展示

#### PRD要求差异

| PRD要求 | 当前实现 | 差异 | 优先级 |
|---------|---------|------|-------|
| 模块名"我的群组" | "圆桌讨论" | 需重命名 | P1 |
| 邀请码分组 | 自动匹配 | **需要新增** | P0 |
| 日历共享 | 无 | **需要新增** | P1 |
| 发起会议 | 无 | **需要新增** | P1 |
| 时间冲突校验 | 无 | **需要新增** | P1 |
| 组长确认机制 | 部分 | 需完善 | P1 |
| 问题清单状态 | 无 | **需要新增** | P1 |

#### 关键流程：邀请码分组

```typescript
// 新增：邀请码实体
@Entity('invite_codes')
class InviteCode {
  id: string
  code: string           // 邀请码
  groupId?: string       // 关联群组
  createdBy: string      // 创建者
  maxUses: number        // 最大使用次数
  usedCount: number      // 已使用次数
  expiresAt: Date        // 过期时间
  status: 'active' | 'expired' | 'disabled'
}

// 注册时关联群组
async registerWithInviteCode(dto: RegisterDto) {
  // 1. 验证邀请码
  const inviteCode = await this.validateInviteCode(dto.inviteCode)

  // 2. 创建用户
  const user = await this.createUser(dto)

  // 3. 如果邀请码关联了群组，直接加入
  if (inviteCode.groupId) {
    await this.addUserToGroup(user.id, inviteCode.groupId)
  } else {
    // 否则按偏好自动匹配
    await this.autoMatchRoundTable(user.id)
  }
}
```

#### 关键流程：日历共享

```typescript
// 新增：日历共享状态
@Entity('calendar_shares')
class CalendarShare {
  id: string
  userId: string         // 被查看者
  viewerId: string       // 查看者（组长）
  groupId: string        // 所属群组
  status: 'pending' | 'accepted' | 'declined'
  sharedAt?: Date
}

// API设计
// POST /api/groups/:id/share-calendar - 组长发起共享邀请
// PUT /api/groups/:id/share-calendar/accept - 成员接受
// PUT /api/groups/:id/share-calendar/decline - 成员拒绝
// GET /api/groups/:id/members-availability - 组长查看成员空闲时间
```

#### 关键流程：发起会议

```typescript
// 新增：会议实体
@Entity('group_meetings')
class GroupMeeting {
  id: string
  groupId: string
  title: string
  scheduledAt: Date
  duration: number       // 分钟
  meetingUrl?: string    // 线上会议链接
  location?: string      // 线下地址
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  createdBy: string      // 组长
}

// 时间冲突校验
async createMeeting(groupId: string, dto: CreateMeetingDto) {
  // 1. 获取所有成员的日历事件
  const members = await this.getGroupMembers(groupId)
  const events = await this.getMembersEvents(members, dto.scheduledAt, dto.duration)

  // 2. 检查冲突
  if (events.length > 0) {
    throw new BadRequestException('所选时间与成员已有事件冲突')
  }

  // 3. 创建会议
  const meeting = await this.create(groupId, dto)

  // 4. 同步到所有成员日历
  await this.syncToMembersCalendar(meeting, members)

  return meeting
}
```

---

### 3.6 日历模块

#### 当前实现状态
- ✅ 月历视图
- ✅ 事件展示
- ✅ 事件详情弹窗
- ✅ 关注/取消关注

#### PRD要求差异

| PRD要求 | 当前实现 | 差异 | 优先级 |
|---------|---------|------|-------|
| 日历占主屏80% | 标准布局 | 需调整UI | P2 |
| 企业类型颜色区分 | 部分 | 需完善 | P1 |
| 圆桌讨论显示 | 无 | 需新增 | P1 |

#### 主界面布局调整

```css
/* PRD要求：日历主导 */
.calendar-main {
  width: 80%;
  float: left;
}

.sidebar-modules {
  width: 20%;
  float: right;
}

/* 或采用全屏日历+侧边栏模式 */
```

---

### 3.7 通知模块

#### 当前实现状态
- ✅ 通知列表
- ✅ 已读/未读状态
- ✅ 标记已读

#### PRD要求差异

**新增通知类型**

| 通知类型 | 触发条件 | 优先级 |
|---------|---------|-------|
| 探索认知边界任务 | 注册成功后 | P1 |
| 圆桌组队成功 | 满6人成组 | P1 |
| 组长确认请求 | 组队成功后 | P1 |
| 日历共享邀请 | 组长发起点 | P1 |
| 会议即将开始 | 会议前1小时 | P2 |
| 认知报告更新 | 圆桌后更新 | P2 |

---

## 四、功能优先级总览

### P0 - 核心功能（必须实现）

| 功能 | 模块 | 工作量 | 依赖 |
|------|------|-------|------|
| 修复404错误 | 认知边界 | 小 | - |
| 邀请码系统 | 认证+群组 | 中 | - |
| 按邀请码分组 | 群组 | 中 | 邀请码系统 |
| 认知边界动态问题 | 认知边界 | 大 | - |
| 问题清单状态展示 | 群组 | 中 | - |

### P1 - 重要功能

| 功能 | 模块 | 工作量 | 依赖 |
|------|------|-------|------|
| 模块重命名"我的群组" | 全局 | 小 | - |
| 认知报告多版本对比 | 认知图谱 | 大 | - |
| 日历共享功能 | 群组+日历 | 大 | - |
| 发起会议功能 | 群组 | 大 | 日历共享 |
| 时间冲突校验 | 群组+日历 | 中 | 发起会议 |
| 组长确认机制完善 | 群组 | 中 | - |
| 学生证上传功能 | 用户 | 中 | - |

### P2 - 优化功能

| 功能 | 模块 | 工作量 | 依赖 |
|------|------|-------|------|
| 主界面布局调整 | UI | 小 | - |
| 企业类型颜色区分 | 日历 | 小 | - |
| 邮箱登录方式 | 认证 | 中 | - |
| OCR截图识别 | 日历 | 大 | - |

---

## 五、技术架构评估

### 5.1 当前架构优势

1. **模块化设计** - NestJS模块 + React模块化组件
2. **Redux状态管理** - 清晰的状态流
3. **TypeORM实体关系** - 完善的数据模型
4. **JWT认证** - 安全的用户认证

### 5.2 需要调整的架构点

| 问题 | 当前方案 | 调整建议 |
|------|---------|---------|
| 认知边界问题固定 | 硬编码65题 | 改为动态加载 |
| 偏好与认知分离 | 两个独立页面 | 保持分离但数据关联 |
| 群组匹配逻辑 | 仅按偏好 | 增加邀请码优先 |
| 日历事件类型 | 仅招聘活动 | 增加圆桌会议类型 |

### 5.3 数据库表新增

```sql
-- 邀请码表
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  group_id UUID REFERENCES round_tables(id),
  created_by UUID REFERENCES users(id),
  max_uses INT DEFAULT 10,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 日历共享表
CREATE TABLE calendar_shares (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  viewer_id UUID REFERENCES users(id),
  group_id UUID REFERENCES round_tables(id),
  status VARCHAR(20) DEFAULT 'pending',
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 群组会议表
CREATE TABLE group_meetings (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES round_tables(id),
  title VARCHAR(100),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INT DEFAULT 120,
  meeting_url VARCHAR(500),
  location VARCHAR(200),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 认知版本表
CREATE TABLE cognitive_versions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  version INT NOT NULL,
  stage VARCHAR(30) NOT NULL,
  round_table_id UUID REFERENCES round_tables(id),
  dimensions JSONB NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, version)
);
```

---

## 六、实施计划（并行开发）

> **决策**：修复404错误与功能开发并行进行

### 并行任务分配

**任务线A：问题修复**
- [ ] 排查认知边界API 404错误（部署/数据库）
- [ ] 修复密码表单警告
- [ ] 移除引导流程中的 exploration 阶段

**任务线B：邀请码系统**
- [ ] 后端：邀请码实体和数据库表
- [ ] 后端：邀请码CRUD接口
- [ ] 前端：注册页面添加邀请码输入
- [ ] 后端：注册逻辑关联邀请码分组

**任务线C：认知边界重构**
- [ ] 问题数据结构调整为动态加载
- [ ] 将评估入口移至认知图谱页面
- [ ] 根据偏好选项动态展示问题
- [ ] 认知报告多版本存储

**任务线D：群组功能完善**
- [ ] 模块重命名"我的群组"
- [ ] 日历共享邀请功能（仅显示空闲状态）
- [ ] 发起会议功能
- [ ] 时间冲突校验
- [ ] 问题清单完成状态展示

---

### 第一阶段：基础调整（1-2天）

**任务线A+B**
- [ ] 修复404错误
- [ ] 修复密码表单警告
- [ ] 移除 `exploration` 阶段
- [ ] 添加邀请码数据库表
- [ ] 调整引导流程代码

### 第二阶段：核心功能开发（3-5天）

**任务线B+C**
- [ ] 邀请码CRUD接口
- [ ] 注册页面邀请码输入
- [ ] 认知边界评估入口调整
- [ ] 动态问题加载逻辑

### 第三阶段：群组协作功能（3-4天）

**任务线D**
- [ ] 模块重命名
- [ ] 日历共享（空闲状态）
- [ ] 发起会议
- [ ] 时间冲突校验

### 第四阶段：完善与测试（2-3天）

- [ ] 认知报告多版本对比
- [ ] 问题清单状态展示
- [ ] 主界面布局调整
- [ ] 全流程测试

---

## 七、已确认的关键决策

### 决策1：引导流程顺序 ✅ 已确认

**最终方案**：简化引导流程，认知边界评估独立于引导流程

```
登录 → 产品定位(welcome) → 偏好设置(preferences) → 完成
                                    │
                                    ↓
                        自动触发圆桌匹配
                                    │
                                    ↓
                              进入日历主页

【认知边界评估】→ 独立入口 → 用户点击"认知图谱"后触发
```

**理由**：
- 认知问题清单在认知图谱中，不主动触发
- 用户需要主动探索认知边界
- 减少引导流程的复杂度

### 决策2：邀请码分组的优先级 ✅ 已确认

**最终方案**：并行开发
- 邀请码功能与404修复并行进行
- 优先级：邀请码分组 > 自动匹配

**分组逻辑**：
- 有邀请码且关联群组：直接加入群组
- 有邀请码但无关联群组：按偏好匹配
- 无邀请码：按偏好匹配

### 决策3：日历共享的隐私保护 ✅ 已确认

**最终方案**：仅显示空闲状态
- 成员接受共享后，组长只能看到"空闲/已约"状态
- 不显示具体事件内容，保护隐私
- 时间冲突检测时自动校验

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 引导流程改动影响现有用户 | 高 | 添加迁移脚本，保留现有用户状态 |
| 动态问题导致评估题数变化 | 中 | 保持每个维度5题，总数可变 |
| 邀请码系统复杂度 | 中 | 先实现基础功能，迭代优化 |
| 日历共享权限管理 | 中 | 清晰定义角色权限矩阵 |

---

**文档结束**

*下一步：根据此设计文档开始实施开发工作*