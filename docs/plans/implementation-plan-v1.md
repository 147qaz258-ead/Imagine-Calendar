# 畅选日历 - 完整功能实施计划

**计划版本**: V1.0
**创建日期**: 2026-03-08
**预计工期**: 10-14天
**基准文档**: docs/design/full-feature-implementation-design.md, docs/design/prd-feature-comparison.md

---

## 计划概述

本文档定义了畅选日历项目完整功能的实施计划，涵盖所有PRD要求的功能点。
总功能数：52项，已完成：26项，需新增：24项，需修改：2项。

### 关键决策摘要

1. **引导流程简化**：移除 `exploration` 阶段，认知边界评估独立于引导流程
2. **并行开发**：修复问题与功能开发同时进行
3. **日历隐私**：组长查看成员日历时仅显示空闲状态

---

## EPIC-1: 引导流程重构与问题修复

**目标**: 简化用户引导流程，修复现有问题

### TASK-1.1: 修复认知边界API 404错误

**优先级**: P0 | **工作量**: 0.5天 | **依赖**: 无

**问题描述**:
访问 `GET /api/cognitive-boundary/assessment` 返回 404

**排查步骤**:
1. 检查 Render 后端日志，确认服务启动状态
2. 检查数据库中 `cognitive_boundary_assessments` 表是否存在
3. 检查 TypeORM 实体同步配置

**修复方案**:
```typescript
// 确认 database.module.ts 中是否同步了实体
// 如果表不存在，手动创建或启用 synchronize
```

**验证标准**:
- [ ] API 返回 200 状态码
- [ ] 数据库表存在且结构正确
- [ ] 新用户可以正常访问评估页面

**相关文件**:
- `server/src/modules/cognitive-boundary/cognitive-boundary.controller.ts`
- `server/src/database/database.module.ts`

---

### TASK-1.2: 修复密码表单警告

**优先级**: P1 | **工作量**: 0.5小时 | **依赖**: 无

**问题描述**:
浏览器警告 "Password field is not contained in a form"

**修复方案**:
```tsx
// web/src/modules/auth/components/LoginPage.tsx
// 将密码输入框包裹在 form 标签中
<form onSubmit={handleSubmit}>
  <input type="password" ... />
</form>
```

**验证标准**:
- [ ] 浏览器控制台无警告
- [ ] 表单提交功能正常

**相关文件**:
- `web/src/modules/auth/components/LoginPage.tsx`

---

### TASK-1.3: 移除引导流程 exploration 阶段

**优先级**: P0 | **工作量**: 1天 | **依赖**: 无

**目标**: 简化引导流程，移除认知边界评估的强制触发

**实现步骤**:

#### Step 1: 更新类型定义
```typescript
// web/src/modules/auth/types/index.ts
// 移除 'exploration'
export type OnboardingStep = 'welcome' | 'preferences' | 'completed'
```

#### Step 2: 更新状态管理
```typescript
// web/src/modules/auth/store/authSlice.ts
// 修改 getStoredOnboardingStep 函数
// 移除 exploration 相关逻辑
```

#### Step 3: 更新布局组件
```typescript
// web/src/shared/components/Layout.tsx
// 移除 case 'exploration' 分支
// 产品定位弹窗确认后直接跳转到偏好设置页面
```

#### Step 4: 更新认知边界页面
```typescript
// web/src/modules/cognitive-boundary/components/CognitiveBoundaryPage.tsx
// 移除 setOnboardingStep('preferences') 调用
// 移除自动跳转逻辑
```

#### Step 5: 更新偏好设置页面
```typescript
// web/src/modules/profile/components/PreferencesForm.tsx
// 保持现有的完成逻辑不变
```

**验证标准**:
- [ ] 新用户流程：登录 → 产品定位 → 偏好设置 → 日历主页
- [ ] localStorage 中不再存储 'exploration' 值
- [ ] 认知边界页面可独立访问，不触发引导流程跳转

**相关文件**:
- `web/src/modules/auth/types/index.ts`
- `web/src/modules/auth/store/authSlice.ts`
- `web/src/shared/components/Layout.tsx`
- `web/src/modules/cognitive-boundary/components/CognitiveBoundaryPage.tsx`

---

## EPIC-2: 邀请码系统

**目标**: 实现邀请码功能，支持注册时按邀请码分组

### TASK-2.1: 创建邀请码数据库实体

**优先级**: P0 | **工作量**: 0.5天 | **依赖**: 无

**实现步骤**:

#### Step 1: 创建实体文件
```typescript
// server/src/modules/invite-code/entities/invite-code.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../user/entities/user.entity'
import { RoundTable } from '../../roundtable/entities/roundtable.entity'

@Entity('invite_codes')
export class InviteCode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string

  @Column({ type: 'uuid', name: 'group_id', nullable: true })
  groupId: string

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string

  @Column({ type: 'int', name: 'max_uses', default: 10 })
  maxUses: number

  @Column({ type: 'int', name: 'used_count', default: 0 })
  usedCount: number

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt: Date | null

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'expired' | 'disabled'

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User

  @ManyToOne(() => RoundTable)
  @JoinColumn({ name: 'group_id' })
  group: RoundTable
}
```

#### Step 2: 创建模块和服务
```typescript
// server/src/modules/invite-code/invite-code.module.ts
// server/src/modules/invite-code/invite-code.service.ts
// server/src/modules/invite-code/invite-code.controller.ts
```

#### Step 3: 注册模块
```typescript
// server/src/app.module.ts
import { InviteCodeModule } from './modules/invite-code'
// 添加到 imports 数组
```

**验证标准**:
- [ ] 数据库表 `invite_codes` 创建成功
- [ ] 实体与其他表正确关联

**相关文件**:
- `server/src/modules/invite-code/entities/invite-code.entity.ts` (新建)
- `server/src/modules/invite-code/invite-code.module.ts` (新建)
- `server/src/modules/invite-code/invite-code.service.ts` (新建)
- `server/src/modules/invite-code/invite-code.controller.ts` (新建)
- `server/src/app.module.ts` (修改)

---

### TASK-2.2: 实现邀请码CRUD接口

**优先级**: P0 | **工作量**: 0.5天 | **依赖**: TASK-2.1

**API设计**:

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/invite-codes | 创建邀请码 | Admin |
| GET | /api/invite-codes | 获取邀请码列表 | Admin |
| GET | /api/invite-codes/:code | 验证邀请码 | Public |
| PUT | /api/invite-codes/:id | 更新邀请码 | Admin |
| DELETE | /api/invite-codes/:id | 删除邀请码 | Admin |

**验证邀请码接口**:
```typescript
@Get(':code')
async validateCode(@Param('code') code: string) {
  const inviteCode = await this.service.validateCode(code)
  return {
    success: true,
    data: {
      valid: !!inviteCode,
      hasGroup: !!inviteCode?.groupId,
    }
  }
}
```

**验证标准**:
- [ ] 所有CRUD接口正常工作
- [ ] 验证接口正确返回邀请码状态

**相关文件**:
- `server/src/modules/invite-code/invite-code.controller.ts`
- `server/src/modules/invite-code/invite-code.service.ts`
- `server/src/modules/invite-code/dto/invite-code.dto.ts` (新建)

---

### TASK-2.3: 注册页面添加邀请码输入

**优先级**: P0 | **工作量**: 0.5天 | **依赖**: TASK-2.2

**前端实现**:

#### Step 1: 更新注册表单UI
```tsx
// web/src/modules/auth/components/LoginPage.tsx
// 在注册Tab中添加邀请码输入框

<div className="space-y-4">
  {/* 现有的手机号、验证码、密码输入框 */}

  {/* 新增：邀请码输入框（必填） */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      邀请码 <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      value={inviteCode}
      onChange={(e) => setInviteCode(e.target.value)}
      placeholder="请输入邀请码"
      className="..."
      required
    />
  </div>
</div>
```

#### Step 2: 添加邀请码验证
```tsx
// 注册前验证邀请码
const handleRegister = async () => {
  // 1. 验证邀请码
  const validateResult = await dispatch(validateInviteCode(inviteCode))
  if (!validateResult.payload.valid) {
    setError('邀请码无效或已过期')
    return
  }

  // 2. 继续注册流程
  // ...
}
```

#### Step 3: 更新API调用
```typescript
// web/src/modules/auth/store/authSlice.ts
// 更新 register action，添加 inviteCode 参数
```

**验证标准**:
- [ ] 注册页面显示邀请码输入框
- [ ] 无效邀请码显示错误提示
- [ ] 有效邀请码可继续注册

**相关文件**:
- `web/src/modules/auth/components/LoginPage.tsx`
- `web/src/modules/auth/store/authSlice.ts`
- `web/src/modules/auth/services/authApi.ts`

---

### TASK-2.4: 注册逻辑关联邀请码分组

**优先级**: P0 | **工作量**: 1天 | **依赖**: TASK-2.3

**后端实现**:

```typescript
// server/src/modules/auth/auth.service.ts
async register(dto: RegisterDto) {
  // 1. 验证邀请码
  const inviteCode = await this.inviteCodeService.validateCode(dto.inviteCode)
  if (!inviteCode) {
    throw new BadRequestException('邀请码无效或已过期')
  }

  // 2. 创建用户
  const user = await this.createUser(dto)

  // 3. 更新邀请码使用次数
  await this.inviteCodeService.incrementUsage(inviteCode.id)

  // 4. 根据邀请码分配群组
  if (inviteCode.groupId) {
    // 直接加入关联群组
    await this.roundTableService.addUserToGroup(user.id, inviteCode.groupId)
  } else {
    // 按偏好自动匹配（等待用户完成偏好设置后触发）
    // 不在这里处理，在偏好设置完成后触发
  }

  // 5. 生成Token
  const token = this.generateToken(user)

  return { user, token }
}
```

**新增：直接加入群组方法**
```typescript
// server/src/modules/roundtable/roundtable.service.ts
async addUserToGroup(userId: string, groupId: string) {
  const group = await this.roundTableRepository.findOne({
    where: { id: groupId },
    relations: ['participants']
  })

  if (!group) {
    throw new NotFoundException('群组不存在')
  }

  // 检查是否已满
  const activeCount = group.participants.filter(
    p => p.status !== ParticipantStatus.LEFT && p.status !== ParticipantStatus.CANCELLED
  ).length

  if (activeCount >= group.maxParticipants) {
    throw new BadRequestException('群组已满')
  }

  // 创建参与者记录
  const participant = this.participantRepository.create({
    roundTableId: groupId,
    userId,
    role: ParticipantRole.MEMBER,
    status: ParticipantStatus.MATCHED,
    matchedAt: new Date(),
  })

  await this.participantRepository.save(participant)

  // 检查是否人齐
  await this.checkAndUpdateRoundTableStatus(groupId)

  return participant
}
```

**验证标准**:
- [ ] 有效邀请码可以注册成功
- [ ] 邀请码关联群组时用户直接加入
- [ ] 邀请码使用次数正确更新

**相关文件**:
- `server/src/modules/auth/auth.service.ts`
- `server/src/modules/auth/dto/auth.dto.ts`
- `server/src/modules/roundtable/roundtable.service.ts`

---

## EPIC-3: 认知边界模块重构

**目标**: 将认知边界评估入口移至认知图谱，支持动态问题展示

### TASK-3.1: 认知边界评估入口迁移

**优先级**: P1 | **工作量**: 1天 | **依赖**: TASK-1.3

**目标**: 在认知图谱页面添加"摸索认知边界"入口按钮

**实现步骤**:

#### Step 1: 更新认知图谱页面
```tsx
// web/src/modules/cognitive/components/CognitivePage.tsx
import { useState } from 'react'
import { CognitiveBoundaryAssessment } from '@/modules/cognitive-boundary'

export function CognitivePage() {
  const [showAssessment, setShowAssessment] = useState(false)
  const { user } = useAppSelector(state => state.auth)
  const { cognitiveMap } = useAppSelector(state => state.cognitive)

  // 获取用户偏好，用于动态加载问题
  const preferences = user?.profile?.preferences

  if (showAssessment) {
    return (
      <CognitiveBoundaryAssessment
        preferences={preferences}
        onComplete={() => {
          setShowAssessment(false)
          // 刷新认知图谱数据
        }}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h1>认知图谱</h1>

      {/* 评估入口按钮 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3>摸索认知边界</h3>
        <p>通过回答问题，了解你在职业发展各维度的认知深度</p>
        <button onClick={() => setShowAssessment(true)}>
          {cognitiveMap ? '更新评估' : '开始评估'}
        </button>
      </div>

      {/* 现有的雷达图等组件 */}
      {/* ... */}
    </div>
  )
}
```

#### Step 2: 创建独立的评估组件
```tsx
// web/src/modules/cognitive-boundary/components/CognitiveBoundaryAssessment.tsx
interface Props {
  preferences: UserPreferences
  onComplete: () => void
}

export function CognitiveBoundaryAssessment({ preferences, onComplete }: Props) {
  // 根据偏好动态加载问题
  const questions = useMemo(() => {
    return getDynamicQuestions(preferences)
  }, [preferences])

  // ... 评估逻辑
}
```

**验证标准**:
- [ ] 认知图谱页面显示评估入口
- [ ] 点击后显示评估页面
- [ ] 完成后返回认知图谱页面

**相关文件**:
- `web/src/modules/cognitive/components/CognitivePage.tsx`
- `web/src/modules/cognitive-boundary/components/CognitiveBoundaryAssessment.tsx` (新建)
- `web/src/modules/cognitive-boundary/index.ts`

---

### TASK-3.2: 动态问题数据结构

**优先级**: P0 | **工作量**: 1天 | **依赖**: 无

**目标**: 重构问题数据结构，支持按偏好选项动态加载

**数据结构调整**:

#### Step 1: 创建新的问题类型
```typescript
// web/src/data/cognitive-questions.ts
export interface CognitiveQuestion {
  id: string
  dimensionKey: string
  dimensionName: string
  subCategory?: string  // 子类别：如"北京"、"互联网"
  question: string
  level: number  // 问题难度 1-5
  relatedOptions?: string[]  // 关联的偏好选项
}

// 通用问题（适用于所有选项）
export const COMMON_QUESTIONS: CognitiveQuestion[] = [
  // 每个维度的通用问题
]

// 地点相关问题
export const LOCATION_QUESTIONS: Record<string, CognitiveQuestion[]> = {
  '北京': [
    { id: 'location-beijing-1', dimensionKey: 'locations', subCategory: '北京', question: '你对北京的就业市场了解多少？', ... },
    // 5个北京相关问题
  ],
  '上海': [
    // 5个上海相关问题
  ],
  // 其他城市...
}

// 行业相关问题
export const INDUSTRY_QUESTIONS: Record<string, CognitiveQuestion[]> = {
  '互联网/科技': [
    // 5个互联网相关问题
  ],
  // 其他行业...
}
```

#### Step 2: 创建动态加载函数
```typescript
// web/src/data/cognitive-questions.ts
export function getDynamicQuestions(preferences: UserPreferences): CognitiveQuestion[] {
  const questions: CognitiveQuestion[] = []

  // 1. 添加通用问题（每个维度1个）
  questions.push(...COMMON_QUESTIONS)

  // 2. 根据偏好选项添加特定问题
  if (preferences.locations) {
    for (const location of preferences.locations) {
      if (LOCATION_QUESTIONS[location]) {
        questions.push(...LOCATION_QUESTIONS[location])
      }
    }
  }

  if (preferences.industries) {
    for (const industry of preferences.industries) {
      if (INDUSTRY_QUESTIONS[industry]) {
        questions.push(...INDUSTRY_QUESTIONS[industry])
      }
    }
  }

  // ... 其他维度

  return questions
}
```

**验证标准**:
- [ ] 问题数据结构支持子类别
- [ ] 动态加载函数正确返回相关问题
- [ ] 不同偏好选项返回不同问题集

**相关文件**:
- `web/src/data/cognitive-questions.ts` (重构)
- `web/src/data/location-questions.ts` (新建)
- `web/src/data/industry-questions.ts` (新建)

---

### TASK-3.3: 更新后端数据结构支持子类别

**优先级**: P0 | **工作量**: 0.5天 | **依赖**: TASK-3.2

**目标**: 更新评估数据结构，支持子类别和备注

**实体更新**:
```typescript
// server/src/modules/cognitive-boundary/entities/cognitive-boundary-assessment.entity.ts
export interface QuestionAssessmentData {
  questionId: string
  subCategory?: string  // 新增：子类别
  level: number
  assessedAt: string
  notes?: string        // 新增：备注
  stage?: 'initial' | 'after_roundtable'  // 新增：阶段
}

export interface DimensionAssessmentData {
  dimensionKey: string
  dimensionName: string
  subCategories?: string[]  // 新增：已评估的子类别
  assessments: QuestionAssessmentData[]
  averageScore: number
}
```

**服务更新**:
```typescript
// server/src/modules/cognitive-boundary/cognitive-boundary.service.ts
async submitAssessment(userId: string, dto: SubmitAssessmentDto) {
  // 更新分组逻辑，支持子类别
  const dimensionMap = new Map<string, Map<string, QuestionAssessmentData[]>>()

  for (const assessment of dto.assessments) {
    const dimensionKey = assessment.questionId.split('-')[0]
    const subCategory = assessment.subCategory || 'general'

    if (!dimensionMap.has(dimensionKey)) {
      dimensionMap.set(dimensionKey, new Map())
    }
    if (!dimensionMap.get(dimensionKey)!.has(subCategory)) {
      dimensionMap.get(dimensionKey)!.set(subCategory, [])
    }

    dimensionMap.get(dimensionKey)!.get(subCategory)!.push({
      questionId: assessment.questionId,
      subCategory: assessment.subCategory,
      level: assessment.level,
      assessedAt: assessment.assessedAt || new Date().toISOString(),
      notes: assessment.notes,
      stage: assessment.stage || 'initial',
    })
  }

  // 构建维度数据...
}
```

**验证标准**:
- [ ] 数据库正确存储子类别信息
- [ ] 评估记录包含备注和阶段信息

**相关文件**:
- `server/src/modules/cognitive-boundary/entities/cognitive-boundary-assessment.entity.ts`
- `server/src/modules/cognitive-boundary/cognitive-boundary.service.ts`
- `server/src/modules/cognitive-boundary/dto/cognitive-boundary.dto.ts`

---

### TASK-3.4: 认知报告多版本存储

**优先级**: P1 | **工作量**: 1.5天 | **依赖**: TASK-3.3

**目标**: 实现认知报告的版本记录和对比功能

**数据库设计**:
```sql
CREATE TABLE cognitive_versions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  version INT NOT NULL,
  stage VARCHAR(30) NOT NULL,  -- 'initial', 'after_roundtable', 'after_study'
  round_table_id UUID REFERENCES round_tables(id),
  dimensions JSONB NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, version)
);
```

**实体创建**:
```typescript
// server/src/modules/cognitive/entities/cognitive-version.entity.ts
@Entity('cognitive_versions')
export class CognitiveVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'int' })
  version: number

  @Column({ type: 'varchar', length: 30 })
  stage: 'initial' | 'after_roundtable' | 'after_study'

  @Column({ type: 'uuid', name: 'round_table_id', nullable: true })
  roundTableId: string | null

  @Column({ type: 'jsonb' })
  dimensions: DimensionSnapshot[]

  @Column({ type: 'timestamptz', name: 'recorded_at' })
  recordedAt: Date

  // 关联...
}
```

**API设计**:
```typescript
// GET /api/cognitive/versions
async getVersions(userId: string) {
  const versions = await this.cognitiveVersionRepo.find({
    where: { userId },
    order: { version: 'DESC' },
  })
  return { success: true, data: versions }
}

// GET /api/cognitive/compare?v1=1&v2=2
async compareVersions(userId: string, v1: number, v2: number) {
  const version1 = await this.cognitiveVersionRepo.findOne({
    where: { userId, version: v1 }
  })
  const version2 = await this.cognitiveVersionRepo.findOne({
    where: { userId, version: v2 }
  })

  // 计算差异
  const diff = this.calculateDiff(version1.dimensions, version2.dimensions)

  return { success: true, data: { version1, version2, diff } }
}

// POST /api/cognitive/version
async createVersion(userId: string, stage: string, roundTableId?: string) {
  // 获取当前评估数据
  const assessment = await this.getLatestAssessment(userId)

  // 获取下一个版本号
  const latestVersion = await this.getLatestVersion(userId)
  const nextVersion = (latestVersion?.version || 0) + 1

  // 创建版本记录
  const version = this.cognitiveVersionRepo.create({
    userId,
    version: nextVersion,
    stage,
    roundTableId,
    dimensions: assessment.dimensions,
    recordedAt: new Date(),
  })

  await this.cognitiveVersionRepo.save(version)
  return version
}
```

**前端对比UI**:
```tsx
// web/src/modules/cognitive/components/CognitiveComparison.tsx
export function CognitiveComparison({ versions }: Props) {
  // 雷达图对比显示
  // 维度详情对比
  // 提升百分比计算
}
```

**验证标准**:
- [ ] 版本正确存储和查询
- [ ] 对比API返回正确的差异数据
- [ ] 前端正确显示对比图

**相关文件**:
- `server/src/modules/cognitive/entities/cognitive-version.entity.ts` (新建)
- `server/src/modules/cognitive/cognitive.service.ts`
- `server/src/modules/cognitive/cognitive.controller.ts`
- `web/src/modules/cognitive/components/CognitiveComparison.tsx` (新建)

---

## EPIC-4: 群组功能完善（我的群组）

**目标**: 完善群组协作功能，包括日历共享、会议发起等

### TASK-4.1: 模块重命名（圆桌讨论 → 我的群组）

**优先级**: P1 | **工作量**: 0.5天 | **依赖**: 无

**目标**: 全局重命名所有"圆桌讨论"相关文案

**前端修改**:
```tsx
// 1. App.tsx
{ id: 'roundtable', title: '我的群组', description: '...', path: '/groups' }

// 2. 路由
<Route path="/groups" element={<GroupList />} />
<Route path="/groups/:id" element={<GroupDetail />} />

// 3. 底部导航
<BottomNav label="我的群组" />

// 4. 所有文案替换
// 圆桌讨论 → 我的群组
// 圆桌 → 群组
```

**后端修改**:
- API路径保持不变（/api/roundtable），只修改文案
- 或考虑新增 /api/groups 路由别名

**验证标准**:
- [ ] 所有页面显示"我的群组"
- [ ] 路由正常工作
- [ ] 无遗漏的旧文案

**相关文件**:
- `web/src/App.tsx`
- `web/src/shared/components/BottomNav.tsx`
- `web/src/modules/roundtable/components/*.tsx`
- `server/src/modules/roundtable/roundtable.controller.ts` (API文档)

---

### TASK-4.2: 组长确认机制完善

**优先级**: P1 | **工作量**: 1天 | **依赖**: 无

**目标**: 完善组长确认逻辑，支持12小时超时自动指定

**后端实现**:

#### Step 1: 更新参与者状态
```typescript
// server/src/modules/roundtable/entities/roundtable-participant.entity.ts
export enum ParticipantStatus {
  APPLIED = 'applied',
  MATCHED = 'matched',
  JOINED = 'joined',
  LEADER_CONFIRMED = 'leader_confirmed',  // 新增：确认成为组长
  LEFT = 'left',
  CANCELLED = 'cancelled',
}

// 新增字段
@Column({ type: 'timestamptz', name: 'leader_confirm_deadline', nullable: true })
leaderConfirmDeadline: Date | null

@Column({ type: 'boolean', name: 'is_leader', default: false })
isLeader: boolean
```

#### Step 2: 实现组长确认逻辑
```typescript
// server/src/modules/roundtable/roundtable.service.ts

// 群组满6人时调用
async onGroupFull(roundTableId: string) {
  // 1. 设置确认截止时间（12小时后）
  const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000)

  // 2. 更新所有参与者状态
  await this.participantRepository.update(
    { roundTableId, status: ParticipantStatus.MATCHED },
    { leaderConfirmDeadline: deadline }
  )

  // 3. 发送系统消息
  await this.sendLeaderConfirmMessage(roundTableId, deadline)

  // 4. 设置定时任务（12小时后检查）
  await this.scheduleLeaderCheck(roundTableId, deadline)
}

// 用户确认成为组长
async confirmAsLeader(userId: string, roundTableId: string) {
  // 检查是否已有组长
  const existingLeader = await this.participantRepository.findOne({
    where: { roundTableId, isLeader: true }
  })

  if (existingLeader) {
    throw new BadRequestException('已有组长')
  }

  // 设置为组长
  await this.participantRepository.update(
    { userId, roundTableId },
    { isLeader: true, role: ParticipantRole.HOST, status: ParticipantStatus.LEADER_CONFIRMED }
  )

  // 发送确认消息
  await this.sendLeaderConfirmedMessage(roundTableId, userId)

  return { success: true }
}

// 定时任务：12小时后随机指定组长
async assignRandomLeader(roundTableId: string) {
  const participants = await this.participantRepository.find({
    where: { roundTableId, status: ParticipantStatus.MATCHED }
  })

  // 检查是否已有组长
  if (participants.some(p => p.isLeader)) {
    return
  }

  // 随机选择一个
  const randomIndex = Math.floor(Math.random() * participants.length)
  const newLeader = participants[randomIndex]

  await this.participantRepository.update(
    { id: newLeader.id },
    { isLeader: true, role: ParticipantRole.HOST, status: ParticipantStatus.LEADER_CONFIRMED }
  )

  await this.sendLeaderAssignedMessage(roundTableId, newLeader.userId)
}
```

**前端实现**:
```tsx
// web/src/modules/roundtable/components/LeaderConfirm.tsx
export function LeaderConfirm({ groupId, deadline }: Props) {
  const [remaining, setRemaining] = useState(getRemaining(deadline))

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemaining(deadline))
    }, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  return (
    <div className="p-4 bg-yellow-50 rounded-lg">
      <p>群组已满6人，请确认是否成为组长</p>
      <p>剩余时间：{formatTime(remaining)}</p>
      <button onClick={handleConfirm}>我愿意成为组长</button>
    </div>
  )
}
```

**验证标准**:
- [ ] 满6人后触发组长确认流程
- [ ] 用户可以确认成为组长
- [ ] 12小时后自动指定组长
- [ ] 系统消息正确发送

**相关文件**:
- `server/src/modules/roundtable/entities/roundtable-participant.entity.ts`
- `server/src/modules/roundtable/roundtable.service.ts`
- `web/src/modules/roundtable/components/LeaderConfirm.tsx` (新建)

---

### TASK-4.3: 问题清单完成状态

**优先级**: P1 | **工作量**: 1天 | **依赖**: TASK-3.3

**目标**: 在群组中显示问题清单完成状态

**后端实现**:
```typescript
// server/src/modules/roundtable/roundtable.service.ts
async getQuestionnaireStatus(groupId: string) {
  const participants = await this.participantRepository.find({
    where: { roundTableId: groupId },
    relations: ['user']
  })

  // 获取每个参与者的认知边界评估状态
  const statusList = await Promise.all(
    participants.map(async (p) => {
      const assessment = await this.cognitiveBoundaryService.getAssessment(p.userId)
      return {
        userId: p.userId,
        nickname: p.user.nickname,
        avatar: p.user.avatar,
        completed: assessment?.data?.completedAt != null,
        progress: assessment?.data?.assessedQuestions || 0,
        total: assessment?.data?.totalQuestions || 65,
      }
    })
  )

  return {
    success: true,
    data: {
      total: participants.length,
      completed: statusList.filter(s => s.completed).length,
      statusList,
    }
  }
}
```

**前端实现**:
```tsx
// web/src/modules/roundtable/components/QuestionnaireStatus.tsx
export function QuestionnaireStatus({ groupId }: Props) {
  const { data, isLoading } = useQuery(['questionnaire-status', groupId], () =>
    roundTableApi.getQuestionnaireStatus(groupId)
  )

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4>问题清单完成状态</h4>
      <div className="flex gap-2 mt-2">
        {data?.statusList.map((status) => (
          <div key={status.userId} className="flex items-center gap-1">
            <img src={status.avatar} className="w-8 h-8 rounded-full" />
            {status.completed ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-gray-400">○</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-2">
        已完成：{data.completed}/{data.total}
      </p>
    </div>
  )
}
```

**验证标准**:
- [ ] 群组页面显示问题清单状态
- [ ] 完成状态实时更新

**相关文件**:
- `server/src/modules/roundtable/roundtable.service.ts`
- `server/src/modules/roundtable/roundtable.controller.ts`
- `web/src/modules/roundtable/components/QuestionnaireStatus.tsx` (新建)

---

### TASK-4.4: 日历共享功能

**优先级**: P1 | **工作量**: 2天 | **依赖**: 无

**目标**: 组长发起点历共享邀请，成员接受后组长可查看空闲时间

**数据库设计**:
```sql
CREATE TABLE calendar_shares (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),        -- 被查看者
  viewer_id UUID REFERENCES users(id),      -- 查看者（组长）
  group_id UUID REFERENCES round_tables(id),
  status VARCHAR(20) DEFAULT 'pending',     -- pending, accepted, declined
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**后端实现**:

```typescript
// server/src/modules/calendar-share/entities/calendar-share.entity.ts
@Entity('calendar_shares')
export class CalendarShare {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'uuid', name: 'viewer_id' })
  viewerId: string

  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'accepted' | 'declined'

  @Column({ type: 'timestamptz', name: 'shared_at', nullable: true })
  sharedAt: Date | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date
}
```

**API设计**:
```typescript
// POST /api/groups/:id/share-calendar
// 组长发起点历共享邀请给所有成员
async requestCalendarShare(groupId: string, leaderId: string) {
  const participants = await this.getParticipants(groupId)

  const shares = participants
    .filter(p => p.userId !== leaderId)
    .map(p => this.calendarShareRepo.create({
      userId: p.userId,
      viewerId: leaderId,
      groupId,
      status: 'pending',
    }))

  await this.calendarShareRepo.save(shares)

  // 发送通知
  await this.notifyCalendarShareRequest(groupId, leaderId, participants)

  return { success: true }
}

// PUT /api/groups/:id/share-calendar/accept
// 成员接受共享
async acceptCalendarShare(groupId: string, userId: string) {
  await this.calendarShareRepo.update(
    { groupId, userId },
    { status: 'accepted', sharedAt: new Date() }
  )
  return { success: true }
}

// PUT /api/groups/:id/share-calendar/decline
// 成员拒绝共享
async declineCalendarShare(groupId: string, userId: string) {
  await this.calendarShareRepo.update(
    { groupId, userId },
    { status: 'declined' }
  )
  return { success: true }
}

// GET /api/groups/:id/members-availability
// 组长查看成员空闲时间（仅显示空闲/已约状态）
async getMembersAvailability(groupId: string, leaderId: string, startDate: Date, endDate: Date) {
  // 验证权限
  const acceptedShares = await this.calendarShareRepo.find({
    where: { groupId, viewerId: leaderId, status: 'accepted' }
  })

  if (acceptedShares.length === 0) {
    throw new ForbiddenException('没有权限查看')
  }

  // 获取每个成员的日历事件
  const availability = await Promise.all(
    acceptedShares.map(async (share) => {
      const events = await this.eventService.getUserEvents(
        share.userId,
        startDate,
        endDate
      )

      // 只返回空闲状态，不返回具体事件内容
      return {
        userId: share.userId,
        slots: this.calculateAvailability(events, startDate, endDate),
      }
    })
  )

  return { success: true, data: availability }
}
```

**前端实现**:
```tsx
// web/src/modules/roundtable/components/CalendarShare.tsx
export function CalendarShare({ groupId, isLeader }: Props) {
  if (isLeader) {
    return <LeaderCalendarShare groupId={groupId} />
  }
  return <MemberCalendarShare groupId={groupId} />
}

function LeaderCalendarShare({ groupId }: Props) {
  // 发起共享邀请
  // 查看成员空闲时间
}

function MemberCalendarShare({ groupId }: Props) {
  // 接受/拒绝共享邀请
}
```

**验证标准**:
- [ ] 组长可以发起共享邀请
- [ ] 成员可以接受/拒绝
- [ ] 组长只能看到空闲状态，看不到具体事件

**相关文件**:
- `server/src/modules/calendar-share/entities/calendar-share.entity.ts` (新建)
- `server/src/modules/calendar-share/calendar-share.service.ts` (新建)
- `server/src/modules/calendar-share/calendar-share.controller.ts` (新建)
- `web/src/modules/roundtable/components/CalendarShare.tsx` (新建)

---

### TASK-4.5: 发起会议功能

**优先级**: P1 | **工作量**: 2天 | **依赖**: TASK-4.4

**目标**: 组长可以发起会议，系统自动检测时间冲突

**数据库设计**:
```sql
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
```

**后端实现**:
```typescript
// server/src/modules/group-meeting/entities/group-meeting.entity.ts
@Entity('group_meetings')
export class GroupMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string

  @Column({ type: 'varchar', length: 100 })
  title: string

  @Column({ type: 'timestamptz', name: 'scheduled_at' })
  scheduledAt: Date

  @Column({ type: 'int', default: 120 })
  duration: number

  @Column({ type: 'varchar', length: 500, name: 'meeting_url', nullable: true })
  meetingUrl: string | null

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: 'scheduled' | 'completed' | 'cancelled'

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date
}
```

**API实现**:
```typescript
// POST /api/groups/:id/meetings
async createMeeting(groupId: string, leaderId: string, dto: CreateMeetingDto) {
  // 1. 验证是否为组长
  const leader = await this.participantRepo.findOne({
    where: { roundTableId: groupId, userId: leaderId, isLeader: true }
  })
  if (!leader) {
    throw new ForbiddenException('只有组长可以发起会议')
  }

  // 2. 检查日历共享状态
  const acceptedShares = await this.calendarShareRepo.find({
    where: { groupId, status: 'accepted' }
  })

  // 3. 时间冲突检测
  const members = await this.getParticipants(groupId)
  const conflicts = await this.detectTimeConflicts(
    members.map(m => m.userId),
    dto.scheduledAt,
    dto.duration
  )

  if (conflicts.length > 0) {
    throw new BadRequestException({
      code: 'TIME_CONFLICT',
      message: '所选时间与成员已有事件冲突',
      conflicts,
    })
  }

  // 4. 创建会议
  const meeting = this.meetingRepo.create({
    groupId,
    ...dto,
    createdBy: leaderId,
  })
  await this.meetingRepo.save(meeting)

  // 5. 同步到成员日历
  await this.syncToMembersCalendar(meeting, members)

  // 6. 发送通知
  await this.notifyMeetingCreated(groupId, meeting)

  return { success: true, data: meeting }
}

// 时间冲突检测
async detectTimeConflicts(userIds: string[], startTime: Date, duration: number) {
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

  const conflicts = []
  for (const userId of userIds) {
    const events = await this.eventRepo
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId })
      .andWhere('event.startTime < :endTime AND event.endTime > :startTime', {
        startTime,
        endTime,
      })
      .getMany()

    if (events.length > 0) {
      conflicts.push({ userId, events })
    }
  }

  return conflicts
}

// 同步到成员日历
async syncToMembersCalendar(meeting: GroupMeeting, members: Participant[]) {
  for (const member of members) {
    const event = this.eventRepo.create({
      userId: member.userId,
      title: `圆桌会议: ${meeting.title}`,
      startTime: meeting.scheduledAt,
      endTime: new Date(meeting.scheduledAt.getTime() + meeting.duration * 60 * 1000),
      type: 'roundtable',
      relatedId: meeting.id,
    })
    await this.eventRepo.save(event)
  }
}
```

**前端实现**:
```tsx
// web/src/modules/roundtable/components/CreateMeetingForm.tsx
export function CreateMeetingForm({ groupId }: Props) {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>()
  const [duration, setDuration] = useState(120)
  const [meetingUrl, setMeetingUrl] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const handleCreate = async () => {
    try {
      await roundTableApi.createMeeting(groupId, {
        title: '圆桌讨论会议',
        scheduledAt: combineDateTime(date, time),
        duration,
        meetingUrl: meetingUrl || undefined,
        location: location || undefined,
        notes: notes || undefined,
      })
      // 成功提示
    } catch (error) {
      if (error.code === 'TIME_CONFLICT') {
        // 显示冲突详情
      }
    }
  }

  return (
    <form>
      {/* 日期时间选择 */}
      {/* 会议链接/地址 */}
      {/* 备注 */}
      {/* 提交按钮 */}
    </form>
  )
}
```

**验证标准**:
- [ ] 组长可以创建会议
- [ ] 时间冲突检测正常工作
- [ ] 会议同步到成员日历
- [ ] 通知正确发送

**相关文件**:
- `server/src/modules/group-meeting/entities/group-meeting.entity.ts` (新建)
- `server/src/modules/group-meeting/group-meeting.service.ts` (新建)
- `server/src/modules/group-meeting/group-meeting.controller.ts` (新建)
- `web/src/modules/roundtable/components/CreateMeetingForm.tsx` (新建)

---

## EPIC-5: 通知系统扩展

**目标**: 新增多种通知类型

### TASK-5.1: 新增通知类型

**优先级**: P1 | **工作量**: 1天 | **依赖**: 无

**新增通知类型**:

| 类型 | 触发条件 | 模板 |
|------|---------|------|
| COGNITIVE_TASK | 注册成功后 | "请完成认知边界评估" |
| GROUP_READY | 群组满6人 | "您的群组已满员，请确认组长" |
| LEADER_CONFIRM | 需要确认组长 | "请确认是否成为组长" |
| CALENDAR_SHARE_REQUEST | 日历共享邀请 | "组长请求查看您的日历" |
| MEETING_CREATED | 会议创建 | "新会议已安排：{时间}" |
| MEETING_REMINDER | 会议前1小时 | "会议将在1小时后开始" |

**后端实现**:
```typescript
// server/src/modules/notification/entities/notification.entity.ts
export enum NotificationType {
  SYSTEM = 'system',
  COGNITIVE_TASK = 'cognitive_task',
  GROUP_READY = 'group_ready',
  LEADER_CONFIRM = 'leader_confirm',
  CALENDAR_SHARE_REQUEST = 'calendar_share_request',
  MEETING_CREATED = 'meeting_created',
  MEETING_REMINDER = 'meeting_reminder',
}
```

**通知服务扩展**:
```typescript
// server/src/modules/notification/notification.service.ts
async sendCognitiveTaskNotification(userId: string) {
  return this.create(userId, {
    type: NotificationType.COGNITIVE_TASK,
    title: '认知边界评估任务',
    content: '请完成认知边界评估，帮助您更好地了解自己',
    link: '/cognitive',
  })
}

async sendGroupReadyNotification(groupId: string, userIds: string[]) {
  return Promise.all(
    userIds.map(userId =>
      this.create(userId, {
        type: NotificationType.GROUP_READY,
        title: '群组已满员',
        content: '您的群组已满6人，请确认是否成为组长',
        link: `/groups/${groupId}`,
        metadata: { groupId },
      })
    )
  )
}
```

**验证标准**:
- [ ] 各类通知正确触发
- [ ] 通知内容正确
- [ ] 点击跳转正确

**相关文件**:
- `server/src/modules/notification/entities/notification.entity.ts`
- `server/src/modules/notification/notification.service.ts`

---

## EPIC-6: 日历与UI优化

**目标**: 优化主界面布局，完善日历功能

### TASK-6.1: 主界面布局调整

**优先级**: P2 | **工作量**: 1天 | **依赖**: 无

**目标**: 日历占主屏80%

**实现方案**:
```tsx
// web/src/pages/HomePage.tsx
export function HomePage() {
  return (
    <div className="flex h-full">
      {/* 主日历区域 */}
      <div className="w-4/5 p-4">
        <Calendar />
      </div>

      {/* 侧边栏模块入口 */}
      <div className="w-1/5 p-4 border-l">
        <QuickLinks />
        <UpcomingEvents />
        <GroupStatus />
      </div>
    </div>
  )
}
```

**验证标准**:
- [ ] 日历占屏幕80%
- [ ] 侧边栏显示快捷入口

**相关文件**:
- `web/src/pages/HomePage.tsx` (新建或修改)
- `web/src/shared/components/Layout.tsx`

---

### TASK-6.2: 企业类型颜色完善

**优先级**: P2 | **工作量**: 0.5天 | **依赖**: 无

**颜色配置**:
```typescript
// web/src/modules/calendar/constants/colors.ts
export const ENTERPRISE_COLORS: Record<string, string> = {
  '国企': 'bg-gray-200 text-gray-800',
  '外企': 'bg-purple-200 text-purple-800',
  '民企': 'bg-yellow-200 text-yellow-800',
  '商业雇主': 'bg-blue-200 text-blue-800',
  '非营利组织': 'bg-green-200 text-green-800',
}
```

**验证标准**:
- [ ] 所有企业类型有对应颜色
- [ ] 日历事件显示正确颜色

**相关文件**:
- `web/src/modules/calendar/constants/colors.ts` (新建)
- `web/src/modules/calendar/components/EventCard.tsx`

---

## EPIC-7: 个人中心完善

**目标**: 完善个人中心功能

### TASK-7.1: 认知边界对比图入口

**优先级**: P1 | **工作量**: 0.5天 | **依赖**: TASK-3.4

**实现**:
```tsx
// web/src/modules/profile/components/ProfilePage.tsx
<div className="p-4 bg-white rounded-lg">
  <h3>摸索认知边界 - 知与不知</h3>
  <button onClick={() => navigate('/cognitive')}>
    {hasCognitiveMap ? '更新评估' : '填写报告'}
  </button>
  {hasMultipleVersions && (
    <button onClick={() => navigate('/cognitive?compare=true')}>
      查看认知边界对比图
    </button>
  )}
</div>
```

**相关文件**:
- `web/src/modules/profile/components/ProfilePage.tsx`

---

### TASK-7.2: 学生证上传功能

**优先级**: P2 | **工作量**: 2天 | **依赖**: 无

**功能描述**: 用户上传学生证照片，系统验证学生身份

**实现要点**:
- 图片上传组件
- 存储到云存储（可选）
- 学生身份标识

**相关文件**:
- `web/src/modules/profile/components/StudentIdUpload.tsx` (新建)
- `server/src/modules/user/user.service.ts`

---

### TASK-7.3: 帮助中心页面

**优先级**: P2 | **工作量**: 0.5天 | **依赖**: 无

**实现**:
- 静态页面展示
- 关于我们
- 使用帮助
- 意见反馈入口

**相关文件**:
- `web/src/pages/AboutPage.tsx` (新建)
- `web/src/pages/HelpPage.tsx` (新建)

---

## 实施时间线

```
Week 1:
├── Day 1-2: TASK-1.1, TASK-1.2, TASK-1.3 (问题修复 + 引导流程调整)
├── Day 3-4: TASK-2.1, TASK-2.2, TASK-2.3, TASK-2.4 (邀请码系统)
└── Day 5: TASK-3.1, TASK-3.2 (认知边界入口迁移 + 动态问题)

Week 2:
├── Day 1-2: TASK-3.3, TASK-3.4 (数据结构更新 + 多版本)
├── Day 3-4: TASK-4.1, TASK-4.2, TASK-4.3 (群组功能)
├── Day 5: TASK-4.4, TASK-4.5 (日历共享 + 发起会议)
└── Day 6-7: TASK-5.1, TASK-6.1, TASK-6.2, TASK-7.x (优化完善)
```

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 引导流程改动影响现有用户 | 高 | 灰度发布，添加数据迁移脚本 |
| 动态问题数据量大 | 中 | 懒加载，分页显示 |
| 日历共享权限复杂 | 中 | 清晰定义权限矩阵，充分测试 |
| 邀请码系统安全 | 中 | 添加频率限制，有效期控制 |

---

## 验收标准

### 功能验收

- [ ] 所有P0功能完成并测试通过
- [ ] 所有P1功能完成并测试通过
- [ ] P2功能按优先级完成

### 质量验收

- [ ] 无阻塞性Bug
- [ ] 性能满足要求（首屏<3s）
- [ ] 移动端适配正常

### 文档验收

- [ ] API文档更新
- [ ] 用户操作指南更新
- [ ] 部署文档更新

---

**计划结束**

*此计划可根据实际开发进度进行调整*