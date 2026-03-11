# E2E 测试报告：注册流程与群组成员关系验证

**测试日期:** 2026-03-10
**测试环境:**
- 前端: https://career-calendar.vercel.app
- 后端 API: https://career-calendar-server.onrender.com/api

---

## 测试结果摘要

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 邀请码 GROUP1-001 验证 | 失败 | 邀请码已过期 |
| 用户注册流程 | 跳过 | 因邀请码无效而跳过 |
| 群组成员关系验证 | 未执行 | 因前置条件失败 |

---

## 问题诊断

### 根本原因

**邀请码 `GROUP1-001` 已过期**，这是导致用户注册后无法被添加到群组的根本原因。

测试输出：
```
验证 API 状态: 201
验证结果: {
  "valid": false,
  "groupId": null,
  "message": "邀请码已过期"
}
```

### 可能的原因

根据代码分析，邀请码显示"已过期"可能有以下几种情况：

1. **使用次数已达上限** (`usedCount >= maxUses`)
   - 从 `seed.ts` 可以看到，每个邀请码 `maxUses = 1`
   - 这意味着每个邀请码只能使用一次
   - 如果 GROUP1-001 已经被使用过，就会显示"已过期"

2. **过期时间已到** (`expiresAt < now`)
   - 如果邀请了 `expiresAt` 字段被设置且已过期

3. **状态被手动设置为 EXPIRED**
   - 邀请码的 `status` 字段被设置为 `expired`

### 代码逻辑分析

从 `invite-code.service.ts` 中的验证逻辑：

```typescript
// 检查状态
if (inviteCode.status === InviteCodeStatus.EXPIRED) {
  return {
    valid: false,
    groupId: null,
    message: '邀请码已过期',
  };
}

// 检查使用次数
if (inviteCode.usedCount >= inviteCode.maxUses) {
  return {
    valid: false,
    groupId: null,
    message: '邀请码已达到最大使用次数',
  };
}
```

注意：验证逻辑返回"邀请码已过期"消息有两种情况：
1. `status === EXPIRED`
2. `usedCount >= maxUses` (但这个返回的消息是"邀请码已达到最大使用次数")

所以最可能的情况是：**邀请码 GROUP1-001 的 status 被设置为 EXPIRED**。

---

## 解决方案

### 方案1：更新邀请码状态（推荐）

在数据库中将邀请码状态重置为 ACTIVE：

```sql
UPDATE invite_codes
SET status = 'active', used_count = 0
WHERE code = 'GROUP1-001';
```

### 方案2：创建新的邀请码

运行 seed 脚本或通过 API 创建新的邀请码：

```bash
cd server
npm run seed
```

### 方案3：增加邀请码使用次数

如果希望邀请码可以多次使用：

```sql
UPDATE invite_codes
SET max_uses = 100, status = 'active'
WHERE code = 'GROUP1-001';
```

---

## 测试文件位置

- 测试文件: `D:\C_Projects\日历\e2e-tests\tests\register-with-invite-code.spec.ts`
- 测试截图: `D:\C_Projects\日历\e2e-tests\test-artifacts\`

---

## 重新运行测试

在修复邀请码状态后，可以重新运行测试：

```bash
cd D:\C_Projects\日历\e2e-tests
npx playwright test tests/register-with-invite-code.spec.ts --headed
```

---

## 代码流程说明

### 注册流程中邀请码处理

从 `auth.service.ts` 第 460-509 行：

```typescript
// 验证邀请码（如果提供）
let validatedGroupId: string | null = null
if (inviteCode) {
  const validation = await this.inviteCodeService.validate({ code: inviteCode })
  if (!validation.valid) {
    throw new BadRequestException({
      code: 'AUTH_INVITE_CODE_INVALID',
      message: validation.message,
    })
  }
  validatedGroupId = validation.groupId
  this.logger.log(`Invite code ${inviteCode} validated, groupId: ${validatedGroupId}`)
}

// ... 创建用户 ...

// 根据邀请码分配群组
if (validatedGroupId) {
  try {
    await this.roundTableService.addUserToGroup(user.id, validatedGroupId)
    this.logger.log(`User ${user.id} added to group ${validatedGroupId} via invite code`)
  } catch (error) {
    // 群组分配失败不影响注册，记录日志即可
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    this.logger.warn(`Failed to add user to group: ${errorMessage}`)
  }
}
```

**关键点**：如果邀请码验证失败，用户仍然可以注册成功，但不会被添加到群组中。

---

## 建议的后续操作

1. **检查数据库中邀请码状态**
   ```sql
   SELECT code, status, used_count, max_uses, expires_at, group_id
   FROM invite_codes
   WHERE code = 'GROUP1-001';
   ```

2. **重置邀请码状态**
   ```sql
   UPDATE invite_codes
   SET status = 'active', used_count = 0
   WHERE code LIKE 'GROUP%';
   ```

3. **重新运行 E2E 测试验证修复效果**