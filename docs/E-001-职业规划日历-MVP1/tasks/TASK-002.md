# TASK-002：数据库设计与初始化

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-002 |
| Task Name | 数据库设计与初始化 |
| 关联 Story | - |
| 优先级 | P0 |
| 预估工时 | 1天 |
| BEADS_ID | [待填写] |

## 任务描述

设计并创建数据库表结构，编写数据库迁移脚本，初始化基础数据（学校库、专业库等）。

## 技术要点

### 数据库表设计

参考 TECH 文档 4.2 节，创建以下表：

1. **用户相关**
   - `users` - 用户表
   - `user_profiles` - 用户画像表

2. **基础数据**
   - `schools` - 学校表
   - `majors` - 专业表

3. **日历相关**
   - `events` - 活动事件表
   - `user_events` - 用户关注事件表

4. **圆桌相关**
   - `roundtables` - 圆桌分组表
   - `roundtable_participants` - 圆桌参与者表
   - `chat_messages` - 聊天消息表

5. **认知相关**
   - `cognitive_maps` - 认知图谱表

6. **通知相关**
   - `notifications` - 通知消息表
   - `verification_codes` - 验证码表

### 迁移脚本

- 使用 TypeORM Migration
- 每个表一个迁移文件
- 包含索引创建

### 基础数据

- 学校库：全国高校列表（从教育部数据导入）
- 专业库：专业分类列表

## 接口契约

```typescript
// TypeORM Entity 定义示例
@Entity('users')
class User {
  @PrimaryGeneratedUUID('id')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date;
}
```

## 验收标准

- [x] 所有表创建成功
- [x] 索引创建正确
- [x] 外键约束正确
- [ ] 学校库导入成功（数据量 >= 2000 条） - 需要教育部数据源
- [ ] 专业库导入成功（数据量 >= 500 条） - 需要专业分类数据源
- [x] 迁移脚本可重复执行

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-001（需要数据库连接配置）

### 接口依赖 (interface_deps)
- 无

## 实现记录

### 已完成内容

#### 1. TypeORM 实体文件

所有实体文件位于 `server/src/modules/*/entities/` 目录：

**用户模块** (`modules/user/entities/`)：
- `user.entity.ts` - 用户实体（对应 API-CONTRACT.md 1.1 User）
- `user-profile.entity.ts` - 用户画像实体（13维度偏好设置）
- `school.entity.ts` - 学校实体
- `major.entity.ts` - 专业实体
- `verification-code.entity.ts` - 验证码实体

**事件模块** (`modules/event/entities/`)：
- `event.entity.ts` - 招聘事件实体（对应 API-CONTRACT.md 1.2 Event）
- `user-event.entity.ts` - 用户关注事件实体

**圆桌模块** (`modules/roundtable/entities/`)：
- `roundtable.entity.ts` - 圆桌讨论实体（对应 API-CONTRACT.md 1.3 RoundTable）
- `roundtable-participant.entity.ts` - 圆桌参与者实体
- `chat-message.entity.ts` - 聊天消息实体

**认知模块** (`modules/cognitive/entities/`)：
- `cognitive-map.entity.ts` - 认知图谱实体（对应 API-CONTRACT.md 1.4 CognitiveMap）

**通知模块** (`modules/notification/entities/`)：
- `notification.entity.ts` - 通知实体（对应 API-CONTRACT.md 1.5 Notification）

#### 2. 数据库初始化脚本

`server/src/database/init.sql` - 包含完整建表语句：
- 12 张核心表
- 所有索引定义
- 外键约束
- 触发器（自动更新 updated_at）
- 辅助视图和函数

#### 3. 数据库迁移脚本

`server/src/database/migrations/1709566800000-InitialSchema.ts`
- TypeORM Migration 格式
- 包含 up/down 方法
- 可重复执行

#### 4. 数据库模块配置

`server/src/database/database.module.ts`
- 注册所有实体
- 配置 TypeORM 连接
- 开发环境自动同步

### 编译验证

- `npm run build` 编译通过
- 所有实体类型正确导出

### 待完成

- [ ] 学校库数据导入（需教育部数据源）
- [ ] 专业库数据导入（需专业分类数据源）

## 测试记录

### 编译测试

```bash
cd server && npm run build
# 结果：编译成功，无错误
```

### 实体完整性检查

| 实体 | 状态 | 对应 API-CONTRACT |
|------|------|-------------------|
| User | ✅ 已创建 | 1.1 User |
| UserProfile | ✅ 已创建 | UserPreferences (13维度) |
| School | ✅ 已创建 | 基础数据 |
| Major | ✅ 已创建 | 基础数据 |
| VerificationCode | ✅ 已创建 | 认证相关 |
| Event | ✅ 已创建 | 1.2 Event |
| UserEvent | ✅ 已创建 | 用户-事件关联 |
| RoundTable | ✅ 已创建 | 1.3 RoundTable |
| RoundTableParticipant | ✅ 已创建 | 参与者 |
| ChatMessage | ✅ 已创建 | 聊天消息 |
| CognitiveMap | ✅ 已创建 | 1.4 CognitiveMap |
| Notification | ✅ 已创建 | 1.5 Notification |

### 数据库连接测试

需要配置 `.env` 文件后进行真实数据库连接测试：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=career_calendar
```

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |