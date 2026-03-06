# MVP 核心页面端到端实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现畅选日历MVP所有核心页面的端到端功能，禁止占位符，禁止假API，每个页面必须通过真实API测试验证。

**Architecture:**
- 前端: React + TypeScript + Redux Toolkit + Tailwind CSS
- 后端: NestJS + TypeORM + PostgreSQL + Redis
- API契约: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md` 为唯一可信源
- 测试: 每个页面端到端测试，使用 Playwright 验证真实API响应

**Tech Stack:** React, NestJS, TypeScript, PostgreSQL, Redis, WebSocket, Playwright

---

## 核心原则

1. **禁止占位符**: 所有页面必须有真实UI和功能
2. **禁止假API**: 所有API必须连接真实后端服务
3. **端到端测试**: 每个页面完成后必须通过Playwright测试验证
4. **API契约优先**: 所有接口必须符合 `API-CONTRACT.md` 定义

---

## Task 1: 筛选选项API (FilterOptions)

**背景:** 前端调用 `/api/filters/options` 返回404，导致筛选功能无法使用

**Files:**
- Create: `server/src/modules/filter/filter.module.ts`
- Create: `server/src/modules/filter/filter.controller.ts`
- Create: `server/src/modules/filter/filter.service.ts`
- Create: `server/src/modules/filter/dto/filter-options.dto.ts`
- Modify: `server/src/app.module.ts`
- Test: 使用curl验证API返回正确的13维度选项

**Step 1: 创建FilterModule**

```typescript
// server/src/modules/filter/filter.module.ts
import { Module } from '@nestjs/common';
import { FilterController } from './filter.controller';
import { FilterService } from './filter.service';

@Module({
  controllers: [FilterController],
  providers: [FilterService],
  exports: [FilterService],
})
export class FilterModule {}
```

**Step 2: 创建FilterService**

```typescript
// server/src/modules/filter/filter.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class FilterService {
  getFilterOptions() {
    return {
      locations: [
        { value: 'beijing', label: '北京' },
        { value: 'shanghai', label: '上海' },
        { value: 'shenzhen', label: '深圳' },
        { value: 'hangzhou', label: '杭州' },
        { value: 'chengdu', label: '成都' },
        { value: 'other', label: '其他' },
      ],
      selfPositioning: [
        { value: 'tech', label: '技术' },
        { value: 'product', label: '产品' },
        { value: 'operation', label: '运营' },
        { value: 'sales', label: '销售' },
        { value: 'function', label: '职能' },
      ],
      developmentDirection: [
        { value: 'specialist', label: '深耕专业' },
        { value: 'management', label: '管理路线' },
        { value: 'startup', label: '创业' },
        { value: 'freelance', label: '自由职业' },
      ],
      industries: [
        { value: 'internet', label: '互联网' },
        { value: 'finance', label: '金融' },
        { value: 'manufacture', label: '制造业' },
        { value: 'education', label: '教育' },
        { value: 'medical', label: '医疗' },
        { value: 'other', label: '其他' },
      ],
      platformTypes: [
        { value: 'soe', label: '国企' },
        { value: 'foreign', label: '外企' },
        { value: 'private', label: '民企' },
        { value: 'government', label: '事业单位' },
      ],
      companyScales: [
        { value: 'small', label: '50人以下' },
        { value: 'medium', label: '50-200人' },
        { value: 'large', label: '200-1000人' },
        { value: 'enterprise', label: '1000人以上' },
      ],
      companyCulture: [
        { value: 'flat', label: '扁平化' },
        { value: 'hierarchical', label: '层级分明' },
        { value: 'innovation', label: '创新导向' },
        { value: 'stable', label: '稳定导向' },
      ],
      leadershipStyle: [
        { value: 'mentor', label: '导师型' },
        { value: 'delegating', label: '放权型' },
        { value: 'directive', label: '指令型' },
        { value: 'collaborative', label: '协作型' },
      ],
      trainingPrograms: [
        { value: 'systematic', label: '有系统培训' },
        { value: 'mentorship', label: '导师带教' },
        { value: 'self', label: '自学为主' },
      ],
      overtimePreference: [
        { value: '965', label: '965' },
        { value: '996', label: '996接受' },
        { value: 'flexible', label: '弹性工作' },
      ],
      holidayPolicy: [
        { value: 'double', label: '双休' },
        { value: 'single', label: '单休' },
        { value: 'alternating', label: '大小周' },
      ],
      medicalBenefits: [
        { value: 'basic', label: '基础五险' },
        { value: 'supplementary', label: '补充医疗' },
        { value: 'premium', label: '高端医疗' },
      ],
      maternityBenefits: [
        { value: 'none', label: '无' },
        { value: 'basic', label: '基础' },
        { value: 'comprehensive', label: '完善' },
      ],
    };
  }
}
```

**Step 3: 创建FilterController**

```typescript
// server/src/modules/filter/filter.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FilterService } from './filter.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('filters')
@Controller('filters')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Public()
  @Get('options')
  @ApiOperation({ summary: '获取筛选选项' })
  getFilterOptions() {
    const options = this.filterService.getFilterOptions();
    return {
      success: true,
      data: options,
    };
  }
}
```

**Step 4: 注册FilterModule到AppModule**

在 `server/src/app.module.ts` 的 imports 中添加 `FilterModule`

**Step 5: 验证测试**

```bash
# 启动后端
cd D:/C_Projects/日历/server && pnpm run start:dev

# 测试API
curl -s http://localhost:3001/api/filters/options | head -50
# 预期: 返回包含所有13维度的JSON数据
```

**Step 6: 端到端测试**

```typescript
// 使用Playwright验证
await page.goto('http://localhost:3006/calendar');
// 验证筛选按钮可点击
// 验证筛选抽屉可打开
// 验证13维度选项正确显示
```

---

## Task 2: 登录页面 (LoginPage)

**背景:** 当前登录页面是占位符 `"登录页面 - 待实现"`

**Files:**
- Create: `web/src/modules/auth/components/LoginPage.tsx`
- Create: `web/src/modules/auth/components/PhoneInput.tsx`
- Create: `web/src/modules/auth/components/VerifyCodeInput.tsx`
- Create: `web/src/modules/auth/store/authSlice.ts`
- Create: `web/src/modules/auth/services/authApi.ts`
- Create: `web/src/modules/auth/index.ts`
- Modify: `web/src/App.tsx`
- Modify: `web/src/store/index.ts`
- Test: Playwright端到端测试

**Step 1: 创建authApi服务**

```typescript
// web/src/modules/auth/services/authApi.ts
import apiClient from '@/shared/services/api'

export const authApi = {
  sendCode: async (phone: string, scene: 'login' | 'register') => {
    const response = await apiClient.post('/auth/send-code', { phone, scene })
    return response
  },

  login: async (phone: string, code: string) => {
    const response = await apiClient.post('/auth/login', { phone, code })
    return response
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me')
    return response
  },
}
```

**Step 2: 创建authSlice**

```typescript
// web/src/modules/auth/store/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../services/authApi'

interface AuthState {
  user: any | null
  token: string | null
  loading: boolean
  error: string | null
  isLoggedIn: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  isLoggedIn: !!localStorage.getItem('token'),
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ phone, code }: { phone: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(phone, code)
      if (!response.success) throw new Error(response.message || '登录失败')
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.message || '登录失败')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isLoggedIn = false
      localStorage.removeItem('token')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isLoggedIn = true
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
```

**Step 3: 创建LoginPage组件**

完整实现手机号输入、验证码发送、登录按钮、错误提示、跳转注册等功能。

**Step 4: 更新App.tsx**

将 `LoginPage` 从占位符替换为真实组件。

**Step 5: 更新store/index.ts**

添加 `auth: authReducer`

**Step 6: 端到端测试**

```typescript
// 使用Playwright验证
await page.goto('http://localhost:3006/login')
// 验证手机号输入框存在
// 验证验证码输入框存在
// 验证登录按钮可点击
// 测试错误提示显示
```

---

## Task 3: 用户画像页面 (ProfilePage)

**背景:** 当前是占位符 `"用户画像页面 - 待实现"`

**Files:**
- Create: `web/src/modules/profile/components/ProfilePage.tsx`
- Create: `web/src/modules/profile/components/SchoolSelector.tsx`
- Create: `web/src/modules/profile/components/MajorSelector.tsx`
- Create: `web/src/modules/profile/components/PreferencesForm.tsx`
- Create: `web/src/modules/profile/store/profileSlice.ts`
- Create: `web/src/modules/profile/services/profileApi.ts`
- Modify: `web/src/App.tsx`
- Test: Playwright端到端测试

**验证点:**
- 学校选择器从真实API获取学校列表
- 专业选择器从真实API获取专业列表
- 13维度偏好表单提交到真实API
- 页面数据从真实API加载

---

## Task 4: 认知图谱页面 (CognitivePage)

**背景:** 当前是占位符 `"认知图谱页面 - 待实现"`

**Files:**
- Create: `web/src/modules/cognitive/components/CognitivePage.tsx`
- Create: `web/src/modules/cognitive/components/RadarChart.tsx`
- Create: `web/src/modules/cognitive/components/DimensionCard.tsx`
- Create: `web/src/modules/cognitive/components/HistoryList.tsx`
- Create: `web/src/modules/cognitive/store/cognitiveSlice.ts`
- Create: `web/src/modules/cognitive/services/cognitiveApi.ts`
- Modify: `web/src/App.tsx`
- Test: Playwright端到端测试

**验证点:**
- 雷达图使用真实数据渲染
- 维度分数从API获取
- 历史记录从API加载

---

## Task 5: 通知中心页面 (NotificationPage)

**背景:** 当前未实现

**Files:**
- Create: `web/src/modules/notification/components/NotificationPage.tsx`
- Create: `web/src/modules/notification/components/NotificationList.tsx`
- Create: `web/src/modules/notification/components/NotificationItem.tsx`
- Create: `web/src/modules/notification/store/notificationSlice.ts`
- Create: `web/src/modules/notification/services/notificationApi.ts`
- Modify: `web/src/App.tsx` (添加路由)
- Test: Playwright端到端测试

---

## Task 6: 首页导航完善

**背景:** 首页需要导航到各功能模块

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/modules/home/components/NavigationCards.tsx` (新建)

**验证点:**
- 首页显示各功能入口卡片
- 点击卡片跳转到对应页面
- 未登录用户引导登录

---

## Task 7: 全局布局与导航

**Files:**
- Create: `web/src/shared/components/Layout.tsx`
- Create: `web/src/shared/components/Header.tsx`
- Create: `web/src/shared/components/BottomNav.tsx`
- Modify: `web/src/App.tsx`

**验证点:**
- 顶部导航栏正确显示
- 底部导航栏(移动端)
- 用户头像/登录状态显示

---

## Task 8: 圆桌聊天室实时通信

**背景:** WebSocket后端已实现，前端需要连接

**Files:**
- Create: `web/src/modules/roundtable/components/ChatRoom.tsx`
- Create: `web/src/modules/roundtable/components/MessageInput.tsx`
- Create: `web/src/modules/roundtable/components/MessageList.tsx`
- Create: `web/src/modules/roundtable/hooks/useSocket.ts`
- Modify: `web/src/modules/roundtable/components/RoundTableDetail.tsx`

**验证点:**
- WebSocket连接成功
- 消息实时收发
- 历史消息加载

---

## 执行顺序

| 任务 | 依赖 | 预计时间 |
|------|------|----------|
| Task 1: 筛选选项API | 无 | 30分钟 |
| Task 2: 登录页面 | Task 1 | 60分钟 |
| Task 3: 用户画像页面 | Task 2 | 60分钟 |
| Task 4: 认知图谱页面 | Task 2 | 45分钟 |
| Task 5: 通知中心 | Task 2 | 30分钟 |
| Task 6: 首页导航 | Task 2-5 | 30分钟 |
| Task 7: 全局布局 | Task 6 | 45分钟 |
| Task 8: 圆桌聊天室 | Task 7 | 60分钟 |

---

## 验收标准

每个Task完成后必须满足:

1. ✅ 无占位符文本（如"待实现"）
2. ✅ API返回真实数据（符合API-CONTRACT.md）
3. ✅ Playwright端到端测试通过
4. ✅ 前后端数据流完整
5. ✅ 错误处理正确显示

---

## 测试命令汇总

```bash
# 启动后端
cd D:/C_Projects/日历/server && pnpm run start:dev

# 启动前端
cd D:/C_Projects/日历/web && pnpm run dev

# 测试API
curl -s http://localhost:3001/api/filters/options
curl -s http://localhost:3001/api/auth/send-code -X POST -H "Content-Type: application/json" -d '{"phone":"13800138000","scene":"login"}'
curl -s http://localhost:3001/api/users/1/profile

# Playwright测试
npx playwright test
```