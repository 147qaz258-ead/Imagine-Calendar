# 引导流程集成实现记录

## 概述

本文档记录了畅选日历项目的用户引导流程（Onboarding Flow）集成实现。引导流程是新用户首次登录后的必经流程，包括产品定位展示、认知边界评估和个性化偏好设置。

## 实现日期

2026-03-08

## 引导流程完整路径

```
用户登录成功
    ↓
显示产品定位弹窗 (welcome)
    ↓ 用户点击确认
跳转到认知边界评估页面 (exploration)
    ↓ 用户完成65道问题评估
跳转到个性化偏好设置页面 (preferences)
    ↓ 用户保存偏好
完成引导 → 触发圆桌自动匹配 → 跳转到日历页面 (completed)
```

## 前端修改

### 1. 认证状态管理 (`web/src/modules/auth/store/authSlice.ts`)

**新增内容：**
- `OnboardingStep` 类型定义：`'welcome' | 'exploration' | 'preferences' | 'completed'`
- `onboardingStep` 状态字段，存储在 localStorage
- `setOnboardingStep` action 用于更新引导步骤

```typescript
// 从localStorage读取引导步骤
const getStoredOnboardingStep = (): OnboardingStep => {
  const stored = localStorage.getItem('onboardingStep')
  if (stored === 'welcome' || stored === 'exploration' || stored === 'preferences' || stored === 'completed') {
    return stored
  }
  return 'welcome'
}

// 设置引导步骤
setOnboardingStep: (state, action: PayloadAction<OnboardingStep>) => {
  state.onboardingStep = action.payload
  localStorage.setItem('onboardingStep', action.payload)
},
```

### 2. 布局组件 (`web/src/shared/components/Layout.tsx`)

**修改内容：**
- 添加产品定位弹窗显示逻辑
- 根据引导步骤自动导航用户

```typescript
// 检查是否需要显示产品定位弹窗
useEffect(() => {
  const token = localStorage.getItem('token')
  const hasShown = localStorage.getItem('productPositioningShown')

  if (token && !hasShown && onboardingStep === 'welcome') {
    setShowPositioningModal(true)
  }
}, [onboardingStep])

// 新用户引导流程导航
useEffect(() => {
  if (!isAuthenticated) return

  const isAuthPage = location.pathname === '/login'
  const isOnboardingPage = ['/cognitive-boundary', '/profile/preferences'].includes(location.pathname)

  if (isAuthPage || isOnboardingPage) return

  switch (onboardingStep) {
    case 'exploration':
      navigate('/cognitive-boundary', { replace: true })
      break
    case 'preferences':
      navigate('/profile/preferences', { replace: true })
      break
    // ...
  }
}, [isAuthenticated, onboardingStep, location.pathname, navigate])
```

### 3. 认知边界评估页面 (`web/src/modules/cognitive-boundary/components/CognitiveBoundaryPage.tsx`)

**修改内容：**
- 完成评估后设置引导步骤为 `preferences`
- 自动跳转到偏好设置页面

```typescript
import { fetchCurrentUser, setOnboardingStep } from '@/modules/auth/store/authSlice'

const handleSubmit = async () => {
  // ... 提交评估逻辑

  if (submitAssessments.fulfilled.match(result)) {
    dispatch(setOnboardingStep('preferences'))
    navigate('/profile/preferences')
  }
}
```

### 4. 偏好设置表单 (`web/src/modules/profile/components/PreferencesForm.tsx`)

**修改内容：**
- 保存偏好后判断是否在引导流程中
- 完成引导时设置步骤为 `completed`
- 触发圆桌自动匹配
- 导航到日历页面

```typescript
import { setOnboardingStep } from '@/modules/auth/store/authSlice'
import { autoMatchRoundTable } from '@/modules/roundtable/store/roundTableSlice'

const handleSave = async () => {
  // ... 保存偏好逻辑

  if (result) {
    const isInOnboarding = onboardingStep === 'preferences'

    if (isInOnboarding) {
      dispatch(setOnboardingStep('completed'))
      dispatch(autoMatchRoundTable())
      navigate('/calendar', { replace: true })
    } else {
      alert(`保存成功！匹配度评分: ${result.matchingScore}%`)
    }
  }
}
```

### 5. 路由配置 (`web/src/App.tsx`)

**修改内容：**
- 导入 `PreferencesForm` 组件
- 更新 `PreferencesPage` 使用真实表单

```typescript
import { ProfilePage as ProfilePageComponent, PreferencesForm } from '@/modules/profile'

function PreferencesPage() {
  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">个性化选择</h1>
      <p className="text-gray-600 mb-6">请选择您的职业偏好，我们将为您匹配合适的圆桌小组。</p>
      <PreferencesForm />
    </div>
  )
}
```

## 后端修改

### 1. 认知边界控制器 (`server/src/modules/cognitive-boundary/cognitive-boundary.controller.ts`)

**修复内容：**
- 修正 JwtAuthGuard 导入路径

```typescript
// 修改前
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

// 修改后
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
```

### 2. DTO 验证 (`server/src/modules/cognitive-boundary/dto/cognitive-boundary.dto.ts`)

**修复内容：**
- 修正 class-transformer 导入名称

```typescript
// 修改前
import { Type } from 'class-transform'

// 修改后
import { Type } from 'class-transformer'
```

### 3. 评估实体 (`server/src/modules/cognitive-boundary/entities/cognitive-boundary-assessment.entity.ts`)

**修复内容：**
- `completedAt` 字段类型改为 `Date | null`

```typescript
// 修改前
@Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
completedAt: Date

// 修改后
@Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
completedAt: Date | null
```

## 相关文件清单

### 前端文件
- `web/src/modules/auth/types/index.ts` - OnboardingStep 类型定义
- `web/src/modules/auth/store/authSlice.ts` - 引导步骤状态管理
- `web/src/shared/components/Layout.tsx` - 引导流程导航逻辑
- `web/src/modules/auth/components/ProductPositioningModal.tsx` - 产品定位弹窗
- `web/src/modules/cognitive-boundary/components/CognitiveBoundaryPage.tsx` - 认知边界评估页面
- `web/src/modules/profile/components/PreferencesForm.tsx` - 偏好设置表单
- `web/src/App.tsx` - 路由配置

### 后端文件
- `server/src/modules/cognitive-boundary/cognitive-boundary.controller.ts` - 认知边界控制器
- `server/src/modules/cognitive-boundary/cognitive-boundary.service.ts` - 认知边界服务
- `server/src/modules/cognitive-boundary/entities/cognitive-boundary-assessment.entity.ts` - 评估实体
- `server/src/modules/cognitive-boundary/dto/cognitive-boundary.dto.ts` - DTO 验证

## localStorage 键值

| 键名 | 说明 | 可能值 |
|------|------|--------|
| `token` | 用户认证令牌 | JWT token string |
| `onboardingStep` | 当前引导步骤 | `welcome`, `exploration`, `preferences`, `completed` |
| `productPositioningShown` | 是否已显示产品定位弹窗 | `true` |

## 注意事项

1. 引导步骤存储在 localStorage，用户清除浏览器数据后会重置
2. 产品定位弹窗只在首次登录时显示一次
3. 认知边界评估包含 13 个维度 × 5 个问题 = 65 道问题
4. 完成引导后会自动触发圆桌匹配，用户无需手动报名