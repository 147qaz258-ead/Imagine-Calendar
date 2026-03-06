# TASK-003：认证服务后端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-003 |
| Task Name | 认证服务后端 |
| 关联 Story | STORY-001 (用户身份认证) |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现用户认证服务后端，包括验证码发送、验证登录、JWT Token 管理等功能。

## 技术要点

### 核心功能

1. **验证码服务**
   - 生成 6 位数字验证码
   - Redis 存储（5 分钟 TTL）
   - 发送限流（同一手机号 60 秒 1 次）
   - 错误次数限制（3 次锁定 5 分钟）

2. **短信发送**
   - 集成短信服务商（阿里云/腾讯云）
   - 发送失败重试
   - 发送日志记录

3. **登录验证**
   - 验证码校验
   - 新用户自动注册
   - JWT Token 生成（7 天有效期）
   - 登录时间更新

4. **Token 管理**
   - JWT 签发与验证
   - Token 刷新机制
   - 黑名单机制（登出）

### 接口定义

```typescript
// POST /api/auth/send-code
interface SendCodeRequest {
  phone: string;  // 11位手机号
}

interface SendCodeResponse {
  success: boolean;
  message: string;
}

// POST /api/auth/verify
interface VerifyRequest {
  phone: string;
  code: string;  // 6位验证码
}

interface VerifyResponse {
  success: boolean;
  data: {
    userId: string;
    isNewUser: boolean;
    token: string;
    expiresIn: number;  // 7天，单位秒
  };
}

// POST /api/auth/refresh
interface RefreshResponse {
  success: boolean;
  data: {
    token: string;
    expiresIn: number;
  };
}

// POST /api/auth/logout
interface LogoutResponse {
  success: boolean;
}
```

### 错误码定义

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| INVALID_PHONE | 400 | 手机号格式错误 |
| RATE_LIMIT | 429 | 发送过于频繁 |
| SMS_SERVICE_ERROR | 500 | 短信服务异常 |
| INVALID_CODE | 400 | 验证码错误 |
| CODE_EXPIRED | 400 | 验证码已过期 |
| TOO_MANY_ATTEMPTS | 429 | 尝试次数过多 |

## 验收标准

- [x] 发送验证码接口正常（单元测试通过）
- [x] 验证登录接口正常（单元测试通过）
- [x] 验证码 60 秒限流正常
- [x] 验证码 5 分钟过期正常
- [x] 错误 3 次锁定正常
- [x] JWT Token 生成/验证正常
- [x] 新用户自动创建
- [x] 老用户登录时间更新
- [x] Swagger 文档完整

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-001（基础框架）
- TASK-002（数据库 users 表、verification_codes 表）

### 接口依赖 (interface_deps)
- 无

## 实现记录

### 文件结构

```
server/src/modules/auth/
├── auth.module.ts          # 认证模块定义
├── auth.service.ts         # 认证服务（核心逻辑）
├── auth.controller.ts      # 认证控制器（接口）
├── index.ts                # 模块导出
├── dto/
│   ├── send-code.dto.ts    # 发送验证码 DTO
│   ├── login.dto.ts        # 登录 DTO
│   ├── refresh-token.dto.ts # 刷新 Token DTO
│   └── index.ts
└── strategies/
    ├── jwt.strategy.ts     # JWT 策略
    └── index.ts
```

### 接口实现

| 接口 | 路径 | 状态 |
|------|------|------|
| 发送验证码 | POST /api/auth/send-code | 已实现 |
| 验证码登录 | POST /api/auth/login | 已实现 |
| 刷新 Token | POST /api/auth/refresh | 已实现 |
| 获取当前用户 | GET /api/auth/me | 已实现 |
| 登出 | POST /api/auth/logout | 已实现 |

### 核心实现说明

1. **验证码服务** (`auth.service.ts`)
   - 生成 6 位随机数字验证码
   - Redis 存储，键格式：`auth:code:{phone}`
   - TTL 5 分钟（300 秒）
   - 发送限流：`auth:rate:{phone}`，60 秒内不可重复发送
   - 尝试限制：`auth:attempt:{phone}`，3 次错误后锁定 5 分钟

2. **JWT 认证**
   - 使用 `@nestjs/jwt` + `@nestjs/passport`
   - Token 有效期：7 天
   - 支持刷新和黑名单机制
   - 全局 JWT 守卫：`JwtAuthGuard`
   - 公开接口装饰器：`@Public()`

3. **短信发送**
   - 当前为 Mock 实现，日志输出验证码
   - 预留短信服务商集成接口

4. **错误码遵循 API-CONTRACT.md**
   - AUTH_PHONE_INVALID
   - AUTH_CODE_INVALID
   - AUTH_CODE_EXPIRED
   - AUTH_CODE_TOO_FREQUENT
   - AUTH_TOKEN_INVALID
   - AUTH_TOKEN_EXPIRED
   - AUTH_UNAUTHORIZED

## 测试记录

### 单元测试结果

```
PASS src/modules/auth/auth.service.spec.ts
PASS src/modules/auth/auth.controller.spec.ts

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
```

### 测试覆盖场景

**AuthService 测试**：
- 发送验证码成功
- 发送频率限制（60 秒内重复发送）
- 用户登录成功（已存在用户）
- 新用户注册登录
- 验证码过期
- 验证码错误
- 尝试次数过多锁定
- 获取当前用户成功/失败
- 登出 Token 黑名单

**AuthController 测试**：
- 发送验证码接口
- 登录接口
- 刷新 Token 接口
- 获取当前用户接口
- 登出接口

### 编译验证

```
npm run build  -> 成功
npm test       -> 全部通过
```

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |
| v1.1 | 2026-03-04 | 实现完成 | dev agent |