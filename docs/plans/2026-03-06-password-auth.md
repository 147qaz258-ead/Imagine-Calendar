# 密码注册登录 & CORS修复 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现手机号+密码注册登录功能，修复CORS跨域配置问题

**Architecture:**
- 后端新增注册接口和密码登录接口，User实体添加password字段
- 前端登录页面支持"验证码登录"和"密码登录"两种模式切换
- CORS配置支持生产环境前端域名

**Tech Stack:** NestJS, TypeORM, bcrypt, React, Redux Toolkit, TypeScript

---

## 问题分析

### 当前状态
1. **登录逻辑**：验证码登录 + 新用户自动注册（一体化）
2. **User实体**：无password字段
3. **CORS配置**：仅允许 `localhost:3000`，生产环境跨域失败
4. **前端**：仅有验证码登录页面

### 目标
1. 支持手机号+密码注册（需验证码验证手机号）
2. 支持密码登录
3. 保留验证码登录（备用）
4. CORS支持生产环境域名

---

## Task 1: 后端 - User实体添加password字段

**Files:**
- Modify: `server/src/modules/user/entities/user.entity.ts:39-41`

**Step 1: 添加password字段到User实体**

在 `avatar` 字段后添加 `password` 字段：

```typescript
@Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
avatar: string;

@Column({ type: 'varchar', length: 255, nullable: true, select: false })
password: string;
```

**Step 2: 验证编译通过**

Run: `cd server && pnpm build`
Expected: 编译成功，无错误

**Step 3: 提交**

```bash
git add server/src/modules/user/entities/user.entity.ts
git commit -m "feat(user): add password field to User entity"
```

---

## Task 2: 后端 - 创建注册相关DTO

**Files:**
- Modify: `server/src/modules/auth/dto/index.ts`
- Create: `server/src/modules/auth/dto/register.dto.ts`
- Create: `server/src/modules/auth/dto/password-login.dto.ts`

**Step 1: 创建注册DTO**

Create `server/src/modules/auth/dto/register.dto.ts`:

```typescript
import { IsString, Matches, Length, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: '验证码必须是6位' })
  code: string;

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  @MaxLength(20, { message: '密码最多20位' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, { message: '密码必须包含字母和数字' })
  password: string;
}
```

**Step 2: 创建密码登录DTO**

Create `server/src/modules/auth/dto/password-login.dto.ts`:

```typescript
import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class PasswordLoginDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  phone: string;

  @IsString()
  @MinLength(6, { message: '密码长度错误' })
  @MaxLength(20, { message: '密码长度错误' })
  password: string;
}
```

**Step 3: 更新DTO导出**

Modify `server/src/modules/auth/dto/index.ts`:

```typescript
export * from './send-code.dto';
export * from './login.dto';
export * from './refresh-token.dto';
export * from './register.dto';
export * from './password-login.dto';
```

**Step 4: 验证编译**

Run: `cd server && pnpm build`
Expected: 编译成功

**Step 5: 提交**

```bash
git add server/src/modules/auth/dto/
git commit -m "feat(auth): add register and password login DTOs"
```

---

## Task 3: 后端 - 实现注册和密码登录服务

**Files:**
- Modify: `server/src/modules/auth/auth.service.ts`

**Step 1: 添加bcrypt依赖**

Run: `cd server && pnpm add bcrypt && pnpm add -D @types/bcrypt`

**Step 2: 添加注册方法到AuthService**

在 `auth.service.ts` 顶部添加 bcrypt 导入：

```typescript
import * as bcrypt from 'bcrypt';
```

在 `login` 方法后添加 `register` 方法：

```typescript
/**
 * 密码注册
 * 1. 验证验证码
 * 2. 检查用户是否已存在
 * 3. 创建新用户（带密码）
 */
async register(dto: RegisterDto): Promise<{
  success: boolean;
  data: {
    user: User;
    token: string;
    expiresIn: number;
  };
}> {
  const { phone, code, password } = dto;

  // 验证验证码
  const codeKey = this.CODE_PREFIX + phone;
  const storedCode = await this.redis.get(codeKey);

  if (!storedCode) {
    throw new BadRequestException({
      code: 'AUTH_CODE_EXPIRED',
      message: '验证码已过期',
    });
  }

  if (storedCode !== code) {
    throw new BadRequestException({
      code: 'AUTH_CODE_INVALID',
      message: '验证码错误',
    });
  }

  // 验证成功，删除验证码
  await this.redis.del(codeKey);

  // 检查用户是否已存在
  const existingUser = await this.userRepository.findOne({
    where: { phone },
  });

  if (existingUser) {
    throw new BadRequestException({
      code: 'AUTH_PHONE_EXISTS',
      message: '该手机号已注册',
    });
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);

  // 创建新用户
  const user = this.userRepository.create({
    phone,
    password: hashedPassword,
    status: UserStatus.ACTIVE,
  });
  await this.userRepository.save(user);

  this.logger.log(`New user registered with password: ${phone}`);

  // 生成 JWT Token
  const token = await this.generateToken(user);

  return {
    success: true,
    data: {
      user,
      token,
      expiresIn: this.TOKEN_EXPIRY,
    },
  };
}

/**
 * 密码登录
 */
async loginWithPassword(dto: PasswordLoginDto): Promise<{
  success: boolean;
  data: {
    user: User;
    token: string;
    expiresIn: number;
  };
}> {
  const { phone, password } = dto;

  // 检查尝试次数限制
  const attemptKey = this.ATTEMPT_PREFIX + phone + ':password';
  const attempts = await this.redis.get(attemptKey);
  if (attempts && parseInt(attempts) >= this.MAX_ATTEMPTS) {
    const ttl = await this.redis.ttl(attemptKey);
    throw new BadRequestException({
      code: 'TOO_MANY_ATTEMPTS',
      message: `尝试次数过多，请${ttl}秒后重试`,
    });
  }

  // 查找用户（需要select password）
  const user = await this.userRepository
    .createQueryBuilder('user')
    .where('user.phone = :phone', { phone })
    .addSelect('user.password')
    .getOne();

  if (!user) {
    throw new BadRequestException({
      code: 'AUTH_USER_NOT_FOUND',
      message: '用户不存在',
    });
  }

  if (!user.password) {
    throw new BadRequestException({
      code: 'AUTH_NO_PASSWORD',
      message: '该账号未设置密码，请使用验证码登录',
    });
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    // 增加尝试次数
    const newAttempts = await this.redis.incr(attemptKey);
    if (newAttempts === 1) {
      await this.redis.expire(attemptKey, this.ATTEMPT_LOCK_SECONDS);
    }
    throw new BadRequestException({
      code: 'AUTH_PASSWORD_INVALID',
      message: `密码错误，剩余${this.MAX_ATTEMPTS - newAttempts}次机会`,
    });
  }

  // 验证成功，删除尝试记录
  await this.redis.del(attemptKey);

  // 更新登录时间
  user.lastLoginAt = new Date();
  await this.userRepository.save(user);

  this.logger.log(`User logged in with password: ${phone}`);

  // 生成 JWT Token
  const token = await this.generateToken(user);

  return {
    success: true,
    data: {
      user,
      token,
      expiresIn: this.TOKEN_EXPIRY,
    },
  };
}
```

**Step 3: 更新导入**

在文件顶部添加 RegisterDto 和 PasswordLoginDto 导入：

```typescript
import { SendCodeDto, LoginDto, RefreshTokenDto, RegisterDto, PasswordLoginDto } from './dto';
```

**Step 4: 验证编译**

Run: `cd server && pnpm build`
Expected: 编译成功

**Step 5: 提交**

```bash
git add server/src/modules/auth/auth.service.ts server/package.json
git commit -m "feat(auth): implement register and password login methods"
```

---

## Task 4: 后端 - 添加注册和密码登录接口

**Files:**
- Modify: `server/src/modules/auth/auth.controller.ts`

**Step 1: 添加注册接口**

在 `login` 方法后添加：

```typescript
/**
 * 密码注册
 * POST /api/auth/register
 */
@Public()
@Post('register')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: '密码注册' })
@ApiResponse({
  status: 200,
  description: '注册成功',
  schema: {
    example: {
      success: true,
      data: {
        user: { id: 'uuid', phone: '13800138000', status: 'active' },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 604800,
      },
    },
  },
})
@ApiResponse({
  status: 400,
  description: '验证码错误或手机号已注册',
})
async register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}

/**
 * 密码登录
 * POST /api/auth/login-password
 */
@Public()
@Post('login-password')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: '密码登录' })
@ApiResponse({
  status: 200,
  description: '登录成功',
})
@ApiResponse({
  status: 400,
  description: '密码错误或用户不存在',
})
async loginWithPassword(@Body() dto: PasswordLoginDto) {
  return this.authService.loginWithPassword(dto);
}
```

**Step 2: 更新导入**

```typescript
import { SendCodeDto, LoginDto, RefreshTokenDto, RegisterDto, PasswordLoginDto } from './dto';
```

**Step 3: 验证编译**

Run: `cd server && pnpm build`
Expected: 编译成功

**Step 4: 提交**

```bash
git add server/src/modules/auth/auth.controller.ts
git commit -m "feat(auth): add register and password login endpoints"
```

---

## Task 5: 后端 - 修复CORS配置

**Files:**
- Modify: `server/src/main.ts:26-30`

**Step 1: 更新CORS配置**

修改 `server/src/main.ts` 中的 CORS 配置：

```typescript
// CORS 配置
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Step 2: 验证编译**

Run: `cd server && pnpm build`
Expected: 编译成功

**Step 3: 提交**

```bash
git add server/src/main.ts
git commit -m "fix(cors): add Vite dev server and improve CORS config"
```

---

## Task 6: 前端 - 添加注册和密码登录类型

**Files:**
- Modify: `web/src/modules/auth/types/index.ts`

**Step 1: 添加新类型定义**

在文件末尾添加：

```typescript
// 密码登录请求
export interface PasswordLoginRequest {
  phone: string
  password: string
}

// 注册请求
export interface RegisterRequest {
  phone: string
  code: string
  password: string
}

// 注册响应
export interface RegisterResponse {
  success: boolean
  data: {
    user: User
    token: string
    expiresIn: number
  }
}
```

**Step 2: 提交**

```bash
git add web/src/modules/auth/types/index.ts
git commit -m "feat(auth): add register and password login types"
```

---

## Task 7: 前端 - 添加注册和密码登录API

**Files:**
- Modify: `web/src/modules/auth/services/authApi.ts`

**Step 1: 添加新API方法**

更新导入：

```typescript
import type {
  SendCodeRequest,
  SendCodeResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MeResponse,
  PasswordLoginRequest,
  RegisterRequest,
  RegisterResponse,
} from '../types'
```

添加新方法：

```typescript
/**
 * 密码登录
 */
loginWithPassword: async (data: PasswordLoginRequest): Promise<LoginResponse> => {
  return apiClient.post('/auth/login-password', data)
},

/**
 * 密码注册
 */
register: async (data: RegisterRequest): Promise<RegisterResponse> => {
  return apiClient.post('/auth/register', data)
},
```

**Step 2: 提交**

```bash
git add web/src/modules/auth/services/authApi.ts
git commit -m "feat(auth): add register and password login API methods"
```

---

## Task 8: 前端 - 更新authSlice支持密码登录和注册

**Files:**
- Modify: `web/src/modules/auth/store/authSlice.ts`

**Step 1: 添加密码登录thunk**

在 `login` thunk 后添加：

```typescript
// 密码登录
export const loginWithPassword = createAsyncThunk(
  'auth/loginWithPassword',
  async (data: PasswordLoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.loginWithPassword(data)
      if (!response.success) {
        return rejectWithValue('登录失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '登录失败')
    }
  }
)

// 注册
export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data)
      if (!response.success) {
        return rejectWithValue('注册失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '注册失败')
    }
  }
)
```

**Step 2: 更新导入**

```typescript
import type { AuthState, User, LoginRequest, SendCodeRequest, PasswordLoginRequest, RegisterRequest } from '../types'
```

**Step 3: 添加extraReducers**

在 `extraReducers` 中添加：

```typescript
// 密码登录
builder
  .addCase(loginWithPassword.pending, (state) => {
    state.loading = true
    state.error = null
  })
  .addCase(loginWithPassword.fulfilled, (state, action) => {
    state.loading = false
    state.user = action.payload.data.user
    state.token = action.payload.data.token
    state.isAuthenticated = true
    state.isNewUser = false
    localStorage.setItem('token', action.payload.data.token)
  })
  .addCase(loginWithPassword.rejected, (state, action) => {
    state.loading = false
    state.error = action.payload as string
  })

// 注册
builder
  .addCase(register.pending, (state) => {
    state.loading = true
    state.error = null
  })
  .addCase(register.fulfilled, (state, action) => {
    state.loading = false
    state.user = action.payload.data.user
    state.token = action.payload.data.token
    state.isAuthenticated = true
    state.isNewUser = true
    localStorage.setItem('token', action.payload.data.token)
  })
  .addCase(register.rejected, (state, action) => {
    state.loading = false
    state.error = action.payload as string
  })
```

**Step 4: 验证编译**

Run: `cd web && pnpm build`
Expected: 编译成功

**Step 5: 提交**

```bash
git add web/src/modules/auth/store/authSlice.ts
git commit -m "feat(auth): add password login and register thunks"
```

---

## Task 9: 前端 - 改造登录页面支持双模式

**Files:**
- Create: `web/src/modules/auth/components/PasswordInput.tsx`
- Modify: `web/src/modules/auth/components/LoginPage.tsx`

**Step 1: 创建密码输入组件**

Create `web/src/modules/auth/components/PasswordInput.tsx`:

```tsx
/**
 * 密码输入组件
 */
import React from 'react'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  error,
  disabled,
  placeholder = '请输入密码',
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        密码
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={20}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-red-300 focus:ring-red-200'
            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
```

**Step 2: 重构登录页面**

完全替换 `web/src/modules/auth/components/LoginPage.tsx`:

```tsx
/**
 * 登录/注册页面
 * 支持验证码登录和密码登录两种模式
 */
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, loginWithPassword, register, sendVerifyCode, clearError } from '../store/authSlice'
import { PhoneInput } from './PhoneInput'
import { VerifyCodeInput } from './VerifyCodeInput'
import { PasswordInput } from './PasswordInput'

type LoginMode = 'code' | 'password' | 'register'

// 验证手机号格式
const validatePhone = (phone: string): string | null => {
  if (!phone) return '请输入手机号'
  if (phone.length !== 11) return '手机号必须为11位'
  if (!/^1[3-9]\d{9}$/.test(phone)) return '请输入有效的手机号'
  return null
}

// 验证验证码格式
const validateCode = (code: string): string | null => {
  if (!code) return '请输入验证码'
  if (code.length !== 6) return '验证码必须为6位'
  return null
}

// 验证密码格式
const validatePassword = (password: string): string | null => {
  if (!password) return '请输入密码'
  if (password.length < 6) return '密码至少6位'
  if (password.length > 20) return '密码最多20位'
  if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(password)) return '密码必须包含字母和数字'
  return null
}

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth)

  // 模式切换
  const [mode, setMode] = useState<LoginMode>('code')

  // 表单状态
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [countdown, setCountdown] = useState(0)

  // 错误状态
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // 已登录则跳转
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/calendar', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 清除错误
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    const phoneValidation = validatePhone(phone)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }

    setPhoneError(null)
    setCodeError(null)

    try {
      const result = await dispatch(
        sendVerifyCode({ phone, scene: mode === 'register' ? 'register' : 'login' })
      ).unwrap()

      if (result.success) {
        setCountdown(60)
      }
    } catch {
      // 错误已在slice中处理
    }
  }, [phone, mode, dispatch])

  // 验证码登录
  const handleCodeLogin = useCallback(async () => {
    const phoneValidation = validatePhone(phone)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }

    const codeValidation = validateCode(code)
    if (codeValidation) {
      setCodeError(codeValidation)
      return
    }

    setPhoneError(null)
    setCodeError(null)

    try {
      const result = await dispatch(login({ phone, code })).unwrap()
      if (result.success) {
        navigate('/calendar', { replace: true })
      }
    } catch {
      // 错误已在slice中处理
    }
  }, [phone, code, dispatch, navigate])

  // 密码登录
  const handlePasswordLogin = useCallback(async () => {
    const phoneValidation = validatePhone(phone)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }

    const passwordValidation = validatePassword(password)
    if (passwordValidation) {
      setPasswordError(passwordValidation)
      return
    }

    setPhoneError(null)
    setPasswordError(null)

    try {
      const result = await dispatch(loginWithPassword({ phone, password })).unwrap()
      if (result.success) {
        navigate('/calendar', { replace: true })
      }
    } catch {
      // 错误已在slice中处理
    }
  }, [phone, password, dispatch, navigate])

  // 注册
  const handleRegister = useCallback(async () => {
    const phoneValidation = validatePhone(phone)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }

    const codeValidation = validateCode(code)
    if (codeValidation) {
      setCodeError(codeValidation)
      return
    }

    const passwordValidation = validatePassword(password)
    if (passwordValidation) {
      setPasswordError(passwordValidation)
      return
    }

    setPhoneError(null)
    setCodeError(null)
    setPasswordError(null)

    try {
      const result = await dispatch(register({ phone, code, password })).unwrap()
      if (result.success) {
        navigate('/calendar', { replace: true })
      }
    } catch {
      // 错误已在slice中处理
    }
  }, [phone, code, password, dispatch, navigate])

  // 清除字段错误
  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value)
    if (phoneError) setPhoneError(null)
  }, [phoneError])

  const handleCodeChange = useCallback((value: string) => {
    setCode(value)
    if (codeError) setCodeError(null)
  }, [codeError])

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value)
    if (passwordError) setPasswordError(null)
  }, [passwordError])

  const canSendCode = countdown === 0 && phone.length === 11 && /^1[3-9]\d{9}$/.test(phone)

  const getModeTitle = () => {
    switch (mode) {
      case 'code': return '验证码登录'
      case 'password': return '密码登录'
      case 'register': return '注册账号'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">畅选日历</h1>
          <p className="mt-2 text-sm text-gray-600">帮助大学生规划职业发展路径</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 模式切换 Tab */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setMode('code')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'code'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              验证码登录
            </button>
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'password'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              密码登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              注册
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
            {getModeTitle()}
          </h2>

          {/* 全局错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* 手机号输入 */}
          <div className="mb-4">
            <PhoneInput
              value={phone}
              onChange={handlePhoneChange}
              error={phoneError || undefined}
              disabled={loading}
            />
          </div>

          {/* 验证码模式 */}
          {mode === 'code' && (
            <>
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <VerifyCodeInput
                      value={code}
                      onChange={handleCodeChange}
                      error={codeError || undefined}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={!canSendCode || loading}
                    className={`mt-6 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      canSendCode && !loading
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCodeLogin}
                disabled={code.length !== 6 || loading}
                className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
                  code.length === 6 && !loading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? '登录中...' : '登 录'}
              </button>
            </>
          )}

          {/* 密码登录模式 */}
          {mode === 'password' && (
            <>
              <div className="mb-6">
                <PasswordInput
                  value={password}
                  onChange={handlePasswordChange}
                  error={passwordError || undefined}
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={handlePasswordLogin}
                disabled={password.length < 6 || loading}
                className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
                  password.length >= 6 && !loading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? '登录中...' : '登 录'}
              </button>
            </>
          )}

          {/* 注册模式 */}
          {mode === 'register' && (
            <>
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <VerifyCodeInput
                      value={code}
                      onChange={handleCodeChange}
                      error={codeError || undefined}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={!canSendCode || loading}
                    className={`mt-6 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      canSendCode && !loading
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <PasswordInput
                  value={password}
                  onChange={handlePasswordChange}
                  error={passwordError || undefined}
                  disabled={loading}
                  placeholder="密码(6-20位，含字母和数字)"
                />
              </div>
              <button
                type="button"
                onClick={handleRegister}
                disabled={code.length !== 6 || password.length < 6 || loading}
                className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
                  code.length === 6 && password.length >= 6 && !loading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? '注册中...' : '注 册'}
              </button>
            </>
          )}

          {/* 协议提示 */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            登录/注册即表示同意
            <a href="/terms" className="text-blue-600 hover:underline">用户协议</a>
            和
            <a href="/privacy" className="text-blue-600 hover:underline">隐私政策</a>
          </p>
        </div>

        {/* 底部链接 */}
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-600 hover:text-blue-600">
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: 验证编译**

Run: `cd web && pnpm build`
Expected: 编译成功

**Step 4: 提交**

```bash
git add web/src/modules/auth/components/
git commit -m "feat(auth): redesign login page with code/password/register modes"
```

---

## Task 10: 测试验证

**Step 1: 启动后端**

Run: `cd server && pnpm dev`

**Step 2: 启动前端**

Run: `cd web && pnpm dev`

**Step 3: 测试注册流程**

1. 打开 http://localhost:5173
2. 点击"注册" Tab
3. 输入手机号
4. 点击"发送验证码"
5. 查看后端日志获取验证码（Mock实现）
6. 输入验证码和密码
7. 点击"注册"
8. 验证：注册成功后跳转到日历页面

**Step 4: 测试密码登录**

1. 点击"密码登录" Tab
2. 输入刚注册的手机号和密码
3. 点击"登录"
4. 验证：登录成功后跳转到日历页面

**Step 5: 测试验证码登录**

1. 点击"验证码登录" Tab
2. 输入手机号，发送验证码
3. 输入验证码
4. 验证：登录成功

---

## Task 11: 部署配置更新

**Step 1: 更新Render环境变量**

在 Render Dashboard 中添加：
- `CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173`

**Step 2: 重新部署后端**

Render 会自动检测到代码变更并重新部署

**Step 3: 验证生产环境**

1. 访问 Vercel 部署的前端
2. 测试注册、密码登录、验证码登录流程

---

## 完成检查清单

- [ ] User实体有password字段
- [ ] 后端有 `/api/auth/register` 接口
- [ ] 后端有 `/api/auth/login-password` 接口
- [ ] 后端CORS配置正确
- [ ] 前端登录页有三个Tab：验证码登录、密码登录、注册
- [ ] 注册流程：手机号 → 验证码 → 密码 → 注册成功
- [ ] 密码登录流程：手机号 → 密码 → 登录成功
- [ ] 生产环境测试通过