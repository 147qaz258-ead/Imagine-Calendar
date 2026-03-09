# 部署通才 (Deployment Expert)

专精于 Vercel + Render + PostgreSQL + NestJS 技术栈的部署问题诊断与修复。

## 触发条件

- 用户报告部署错误、API 调用失败、CORS 问题
- 前端路由 404、页面无法访问
- 后端服务连接问题、数据库错误
- 生产环境与本地环境行为不一致
- Entity 类型错误、Seed 数据缺失

---

## 一、前端部署检查

### 1.1 Vercel 项目链接

```bash
# 查看所有 Vercel 项目
npx vercel projects list

# 检查当前链接的项目
cat web/.vercel/project.json

# 如果项目名称错误，重新链接
rm -rf web/.vercel
npx vercel link --project <正确的项目名> --yes
```

**常见问题**：部署到错误的项目

- **原因**：`.vercel/project.json` 中 `projectName` 指向错误项目
- **解决**：删除 `.vercel` 目录，重新链接到正确项目

### 1.2 SPA 路由配置

```json
// vercel.json 必须包含 rewrites
{
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**症状**: 直接访问 `/login` 等路由返回 404

### 1.3 环境变量

- 检查 `VITE_API_URL` 是否正确指向后端
- 生产环境应使用完整 URL：`https://your-backend.onrender.com/api`
- 本地开发可使用代理或相对路径

---

## 二、后端部署检查

### 2.1 CORS 配置

**代码配置**:

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

**Render 环境变量**:

```
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000,http://localhost:5173
```

**诊断命令**:

```bash
curl -I -X OPTIONS https://your-backend.onrender.com/api/endpoint \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

检查响应头是否包含 `access-control-allow-origin: https://your-frontend.vercel.app`

### 2.2 数据库连接

**DataSource 配置**:

```typescript
// data-source.ts 或 app.module.ts
{
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: true,
}
```

**环境变量检查**:

```bash
# Render 需要设置
DATABASE_URL=postgresql://user:password@host:5432/dbname
NODE_ENV=production
```

**注意事项**:

- Render PostgreSQL 需要 SSL 连接
- 内部数据库连接不需要公网访问
- 免费数据库有连接数限制

### 2.3 端口配置

```typescript
// main.ts - 使用环境变量端口
const port = process.env.PORT || 3001;
await app.listen(port);
```

**注意**: Render 会动态分配端口，必须使用 `process.env.PORT`

---

## 三、数据库与 Entity 类型

### 3.1 PostgreSQL 数组类型映射

**错误写法**:

```typescript
// ❌ simple-array 在 PostgreSQL 中无法正确映射到 TEXT[]
@Column({ type: 'simple-array', nullable: true })
questions: string[]
```

**正确写法**:

```typescript
// ✅ 使用原生 PostgreSQL 数组类型
@Column({ type: 'text', array: true, nullable: true })
questions: string[]

// ✅ 或者使用 JSONB 存储复杂数组
@Column({ type: 'jsonb', default: {} })
preferences: Record<string, string[]>
```

**类型对照表**:
| TypeScript | PostgreSQL | TypeORM 写法 |
|------------|------------|--------------|
| `string[]` | `TEXT[]` | `type: 'text', array: true` |
| `number[]` | `INTEGER[]` | `type: 'int', array: true` |
| `object` | `JSONB` | `type: 'jsonb'` |
| `enum` | `ENUM` | `type: 'enum', enum: MyEnum` |

### 3.2 关联关系定义

**正确的一对一关系**:

```typescript
// user.entity.ts
@OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
profile: UserProfile

// user-profile.entity.ts
@OneToOne(() => User, (user) => user.profile)
@JoinColumn({ name: 'user_id' })
user: User
```

**正确的一对多关系**:

```typescript
// roundtable.entity.ts
@OneToMany(() => RoundTableParticipant, (p) => p.roundTable)
participants: RoundTableParticipant[]

// roundtable-participant.entity.ts
@ManyToOne(() => RoundTable, (rt) => rt.participants)
@JoinColumn({ name: 'roundtable_id' })
roundTable: RoundTable
```

### 3.3 索引优化

```typescript
@Index()  // 单列索引
@Column({ type: 'uuid', name: 'user_id' })
userId: string

@Index(['status', 'createdAt'])  // 复合索引
@Entity('roundtables')
class RoundTable { ... }
```

---

## 四、Monorepo (pnpm) 部署实战

针对 `pnpm-workspace.yaml` 管理的多包架构，部署需要特殊适配。

### 4.1 根目录配置文件同步 (关键)

必须提交以下文件到远程仓库，否则部署环境将无法正确识别 Monorepo 结构：

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml` (核心：确保依赖一致性)
- `package.json` (含有 --filter 的构建指令)

### 4.2 前端 (Vercel) 配置

在根目录的 `vercel.json` 中配置：

```json
{
  "buildCommand": "pnpm --filter career-calendar-web build",
  "outputDirectory": "web/dist",
  "installCommand": "pnpm install",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**注意**: 如果子目录也有 `vercel.json`，建议将其 `buildCommand` 设为 `echo skipped` 以免冲突。

### 4.3 后端 (Render) 配置

在 `render.yaml` 中使用 pnpm 过滤：

```yaml
services:
  - type: web
    name: server
    buildCommand: pnpm install && pnpm --filter career-calendar-server build
    startCommand: node dist/main.js
```

---

## 五、Seed 数据完整性

### 4.1 问题：关联实体缺失

**症状**: 功能报错 `PREFERENCES_INVALID` 或 `Entity not found`

**原因**: Seed 只创建主实体，未创建关联实体

**解决**: Seed 必须创建所有必要的关联

```typescript
// seed.ts
for (const account of TEST_ACCOUNTS) {
  let user = await userRepository.findOne({ where: { phone: account.phone } });

  if (user) {
    // 检查关联实体是否存在
    let profile = await profileRepository.findOne({
      where: { userId: user.id },
    });
    if (!profile) {
      profile = profileRepository.create({
        userId: user.id,
        preferences: DEFAULT_PREFERENCES,
      });
      await profileRepository.save(profile);
    }
    continue;
  }

  // 创建用户
  user = userRepository.create({ ...account });
  await userRepository.save(user);

  // 同时创建关联实体
  const profile = profileRepository.create({
    userId: user.id,
    preferences: DEFAULT_PREFERENCES,
  });
  await profileRepository.save(profile);
}
```

### 4.2 默认偏好设置

```typescript
// 为功能准备合理的默认值
const DEFAULT_PREFERENCES: Record<string, string[]> = {
  locations: ["北京", "上海"],
  industries: ["互联网"],
  selfPositioning: ["技术型"],
  developmentDirection: ["技术专家"],
  // ... 所有必要字段
};
```

### 4.3 运行 Seed

```bash
# 本地
pnpm run seed

# Render 构建
# 在 package.json scripts 中添加
"postinstall": "pnpm run seed"
# 或在构建命令中包含
"build": "nest build && pnpm run seed"
```

---

## 五、常见错误速查

| 错误信息                         | 原因                      | 解决方案                             |
| -------------------------------- | ------------------------- | ------------------------------------ |
| `404 NOT_FOUND`                  | SPA 路由未配置            | 添加 rewrites 到 vercel.json         |
| `CORS error`                     | 后端未允许前端域名        | 设置 CORS_ORIGINS 环境变量           |
| `页面空白 (Blank Page)`          | 配置文件未提交/构建脚本错 | 检查 pnpm-lock.yaml 是否更新并推送   |
| `TypeError: r[...] is undefined` | API 返回数据结构变动      | 检查 apiClient 拦截器与 Slice 的配合 |
| `timeout of 30000ms exceeded`    | 后端冷启动慢              | 等待或升级付费计划                   |
| `Network Error`                  | 请求被 CORS 阻止          | 检查 CORS 配置                       |
| `PREFERENCES_INVALID`            | 用户无 profile            | 更新 seed 创建 profile               |
| `INTERNAL_ERROR`                 | 服务器异常                | 查看后端日志，检查 Entity 类型       |
| `column "xxx" does not exist`    | Entity 字段名不匹配       | 使用 `@Column({ name: 'xxx' })`      |
| `relation "xxx" does not exist`  | 表不存在                  | 运行迁移或 synchronize: true         |
| `duplicate key value`            | 唯一约束冲突              | 检查 seed 是否重复执行               |

---

## 六、部署后验证步骤

### 6.1 基础验证

```bash
# 1. 检查后端健康
curl https://your-backend.onrender.com/api/health

# 2. 测试 CORS
curl -I -X OPTIONS https://your-backend.onrender.com/api/auth/login \
  -H "Origin: https://your-frontend.vercel.app"

# 3. 测试登录 API
curl -X POST https://your-backend.onrender.com/api/auth/login-password \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","password":"Test123456"}'
```

### 6.2 功能验证

1. **登录测试**: 用测试账号验证认证流程
2. **API 测试**: 确认前后端通信正常
3. **路由测试**: 访问各个页面确认无 404
4. **控制台检查**: 查看是否有 CORS 或其他错误

---

## 七、冷知识

- **Render 免费计划**: 冷启动需要 10-15 秒，15 分钟无请求会休眠
- **Vercel 函数**: 默认超时 10 秒，Hobby 计划最大 60 秒
- **PostgreSQL SSL**: Render 生产环境必须 SSL 连接
- **环境变量**: 更改后需要重新部署才能生效
- **TypeORM synchronize**: 生产环境应为 false，使用迁移
- **pnpm-lock.yaml**: 单仓库模式下，一定要在根目录生成一份完整的 lock 文件并提交
- **多包构建**: 永远使用 `--filter <package_name>` 而不是 `cd <dir> && npm install`
- **bcrypt vs bcryptjs**: 某些环境 bcrypt 编译失败，用 bcryptjs 替代

---

## 八、调试命令汇总

```bash
# 查看 Vercel 项目
npx vercel projects list
npx vercel list

# 本地模拟生产构建
pnpm build && pnpm preview

# 查看后端日志
# Render Dashboard -> Logs

# 数据库连接测试
psql $DATABASE_URL

# 查看 Entity 对应的表结构
psql $DATABASE_URL -c "\d table_name"

# 重新部署（不推送代码）
npx vercel --prod
```
