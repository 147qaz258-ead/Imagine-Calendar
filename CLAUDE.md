# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

畅选日历 - 帮助大学生规划职业发展路径的智能日历平台。

## 架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            用户界面层 (Web)                               │
│                     React 18 + Vite + TypeScript                         │
├─────────────────────────────────────────────────────────────────────────┤
│  模块: auth | calendar | profile | roundtable | cognitive | filter      │
│  状态管理: Redux Toolkit (auth, calendar, filter, roundTable, chat...)  │
│  路由: React Router v6                                                   │
│  样式: Tailwind CSS                                                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Axios / Socket.io Client
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API 网关层 (Server)                            │
│                      NestJS + TypeScript + JWT                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Guards: JwtAuthGuard (全局认证)                                         │
│  中间件: CORS | ValidationPipe | Swagger                                 │
│  端点: /api/*                                                            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│    Auth       │          │   Business    │          │   Cognitive   │
│    Module     │          │   Modules     │          │    Modules    │
├───────────────┤          ├───────────────┤          ├───────────────┤
│ • JWT 认证    │          │ • User        │          │ • Cognitive   │
│ • 登录/注册   │          │ • Event       │          │ • Cognitive-  │
│ • 短信验证    │          │ • RoundTable  │          │   Boundary    │
│               │          │ • Filter      │          │               │
│               │          │ • Notification│          │               │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           数据访问层                                      │
│                       TypeORM + PostgreSQL                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Entities: User | UserProfile | Event | RoundTable | Message            │
│  关系: User 1:1 UserProfile, User 1:N RoundTableParticipant             │
│  索引: userId, status, createdAt 复合索引                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           缓存层                                         │
│                           Redis                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  用途: Session | 速率限制 | 实时匹配队列                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          部署架构                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  前端: Vercel (自动部署 main 分支)                                        │
│  后端: Render Web Service (连接 Render PostgreSQL)                       │
│  数据库: Render PostgreSQL (SSL 连接)                                    │
│  缓存: Render Redis                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## 关键目录结构

```
.
├── web/                          # 前端项目
│   ├── src/
│   │   ├── modules/              # 功能模块 (按领域划分)
│   │   │   ├── auth/             # 认证模块
│   │   │   ├── calendar/         # 日历模块
│   │   │   ├── profile/          # 用户画像
│   │   │   ├── roundtable/       # 圆桌讨论
│   │   │   ├── cognitive/        # 认知图谱
│   │   │   └── filter/           # 筛选过滤
│   │   ├── store/                # Redux store 配置
│   │   └── shared/               # 共享组件
│   └── vercel.json               # Vercel 部署配置
│
├── server/                       # 后端项目
│   ├── src/
│   │   ├── modules/              # NestJS 模块
│   │   │   ├── auth/             # 认证 (JWT, 短信)
│   │   │   ├── user/             # 用户管理
│   │   │   ├── event/            # 日历事件
│   │   │   ├── roundtable/       # 圆桌讨论
│   │   │   ├── cognitive/        # 认知图谱
│   │   │   ├── cognitive-boundary/ # 认知边界
│   │   │   └── filter/           # 筛选服务
│   │   ├── database/             # 数据库配置和 Seed
│   │   ├── common/               # 公共模块 (Guards, Decorators)
│   │   └── config/               # 配置文件
│   └── test/                     # 测试文件
│
└── docs/                         # 项目文档
```

## 模块对应关系

| 前端模块 (web/src/modules/) | 后端模块 (server/src/modules/) | 功能描述 |
|---------------------------|-------------------------------|---------|
| auth | auth | 登录、注册、JWT 认证 |
| profile | user | 用户画像、偏好设置 |
| calendar | event | 日历事件管理 |
| roundtable | roundtable | 圆桌讨论、实时聊天 |
| cognitive | cognitive | 认知图谱探索 |
| cognitive-boundary | cognitive-boundary | 认知边界测试 |
| filter | filter | 筛选过滤功能 |

## 环境变量

### 后端必需变量
```
DATABASE_URL=postgresql://...   # Render PostgreSQL 连接串
REDIS_URL=redis://...           # Redis 连接串
JWT_SECRET=your-secret          # JWT 密钥
CORS_ORIGINS=https://...        # 允许的前端域名(逗号分隔)
NODE_ENV=production             # 生产环境标识
```

### 前端必需变量
```
VITE_API_URL=https://your-backend.onrender.com/api
```

## PostgreSQL 类型映射注意事项

TypeORM 与 PostgreSQL 类型对应关系：
- `string[]` → `@Column({ type: 'text', array: true })`
- `number[]` → `@Column({ type: 'int', array: true })`
- `object` → `@Column({ type: 'jsonb' })`

**错误示例**: `type: 'simple-array'` 在 PostgreSQL 中无法正确映射到数组类型。

## 部署指南

**重要**: 部署相关问题时，请使用 `deployment-expert` skill 获取详细的诊断和修复指导。

常见部署问题：
- 前端路由 404 → 检查 `vercel.json` 中的 `rewrites` 配置
- CORS 错误 → 检查后端 `CORS_ORIGINS` 环境变量
- 数据库连接失败 → 检查 SSL 配置和 `DATABASE_URL`
- Entity 类型错误 → 检查 TypeORM 列类型定义

## Git 提交规范

遵循 Conventional Commits:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关