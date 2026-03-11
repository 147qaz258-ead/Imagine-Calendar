# 畅选日历部署指南

## 目录

- [部署架构](#部署架构)
- [环境信息](#环境信息)
- [部署脚本使用](#部署脚本使用)
- [前端部署 (Vercel)](#前端部署-vercel)
- [后端部署 (Render)](#后端部署-render)
- [常见问题与解决方案](#常见问题与解决方案)
- [部署检查清单](#部署检查清单)

---

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户访问                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│    Vercel     │           │    Render     │
│   (前端 SPA)   │           │  (后端 API)   │
│               │           │               │
│ career-       │    API    │ career-       │
│ calendar.     │◄────────►│ calendar-      │
│ vercel.app    │           │ server.       │
│               │           │ onrender.com  │
└───────┬───────┘           └───────┬───────┘
        │                           │
        │                   ┌───────┴───────┐
        │                   │               │
        │           ┌───────▼───────┐ ┌─────▼─────┐
        │           │  PostgreSQL   │ │   Redis   │
        │           │  (Render DB)  │ │ (Render)  │
        │           └───────────────┘ └───────────┘
        │
        └──────► GitHub (自动触发部署)
```

---

## 环境信息

### 前端 (Vercel)

| 项目 | 值 |
|-----|-----|
| 项目名称 | `career-calendar` |
| 生产地址 | https://career-calendar.vercel.app |
| 框架 | Vite + React |
| Root Directory | `web` |
| 自动部署 | 推送到 main 分支自动触发 |

### 后端 (Render)

| 项目 | 值 |
|-----|-----|
| 服务名称 | `career-calendar-server` |
| 生产地址 | https://career-calendar-server.onrender.com |
| 运行时 | Node.js |
| 计划 | Free (免费套餐) |
| 自动部署 | 推送到 main 分支后检测 (可能延迟 5-10 分钟) |

### 数据库

| 项目 | 值 |
|-----|-----|
| PostgreSQL | Render PostgreSQL |
| Redis | Render Redis |

---

## 部署脚本使用

项目根目录下的 `deploy.sh` 脚本：

```bash
# 仅部署（代码已提交）
./deploy.sh

# 提交并部署
./deploy.sh "feat: 新功能描述"

# 仅提交
./deploy.sh --commit-only "fix: 修复描述"
```

### 重要提示

1. **必须从项目根目录运行**，因为 `.vercel` 配置在根目录
2. **前端部署是即时的**，Vercel 会在几秒内完成
3. **后端部署需要手动触发**（免费套餐不自动部署）

---

## 前端部署 (Vercel)

### 项目链接配置

**关键：** `.vercel/project.json` 必须正确配置：

```json
{
  "projectId": "prj_yxYI5c4ZqcqVQ8x67gKbwgBRAMju",
  "orgId": "team_sQj4Avwxv3X9IS8Xv2P6Dtp1",
  "projectName": "career-calendar"
}
```

### 首次链接项目

```bash
cd D:/C_Projects/日历
rm -rf .vercel
npx vercel link --project career-calendar --yes
```

### 部署命令

```bash
# 从项目根目录部署
npx vercel --prod --yes
```

### 常见问题

| 问题 | 原因 | 解决方案 |
|-----|------|---------|
| 部署到错误项目 | `.vercel` 配置指向错误项目 | 删除 `.vercel` 目录，重新链接 |
| 路径错误 `web/web` | 从 `web` 目录运行 | 必须从项目根目录运行 |
| 自动部署没触发 | Vercel 未关联 GitHub | 在 Vercel Dashboard 关联仓库 |

---

## 后端部署 (Render)

### 手动部署步骤

1. 访问 https://dashboard.render.com
2. 找到 `career-calendar-server` 服务
3. 点击右上角 **Manual Deploy** → **Deploy latest commit**

### Deploy Hook 配置

在 `deploy.sh` 中配置 Deploy Hook 可实现自动化：

```bash
# 在 Render Dashboard → Settings → Deploy Hook 获取
RENDER_DEPLOY_HOOK="https://api.render.com/deploy/srv-xxx?key=xxx"
```

配置后运行 `./deploy.sh` 会自动触发后端部署。

### 免费套餐限制

- 推送代码后 **不会自动部署**
- 服务 15 分钟无请求会休眠
- 冷启动需要 30-60 秒

---

## 常见问题与解决方案

### 1. 前端部署到错误项目

**症状：** 部署到 `web-oneday1.vercel.app` 而不是 `career-calendar.vercel.app`

**原因：** `.vercel` 配置指向了错误的项目

**解决方案：**
```bash
cd D:/C_Projects/日历
rm -rf .vercel
npx vercel link --project career-calendar --yes
npx vercel --prod --yes
```

### 2. 注册时密码验证失败

**症状：** 前端通过验证，后端返回 400 错误

**原因：** 前端密码验证规则与后端不一致

**验证规则：**
- 最少 6 位
- 最多 20 位
- **必须包含字母和数字**（前端之前缺失）

**相关文件：**
- 前端：`web/src/modules/auth/components/LoginPage.tsx`
- 后端：`server/src/modules/auth/dto/register.dto.ts`

### 3. 验证码不显示

**症状：** 点击发送验证码后，弹窗不显示验证码

**原因：** 后端生产环境不返回验证码

**解决方案：** 已修改为默认返回验证码（因未接入短信服务）

**相关文件：** `server/src/modules/auth/auth.service.ts`

### 4. 邀请码显示已过期

**症状：** 使用邀请码注册后显示"邀请码已过期"

**原因：**
1. 邀请码已被使用（每个邀请码只能用 1 次）
2. Seed 函数未重置已存在的邀请码状态

**解决方案：**
```bash
# 重置邀请码
curl -X POST https://career-calendar-server.onrender.com/api/admin/seed
```

**可用邀请码：**
| 群组 | 邀请码 |
|-----|--------|
| 自我探索组 | GROUP1-001 ~ GROUP1-006 |
| 职业发展组 | GROUP2-001 ~ GROUP2-006 |
| 行业交流组 | GROUP3-001 ~ GROUP3-006 |

### 5. 后端 API 无响应

**症状：** API 请求超时或返回 000 状态码

**原因：** Render 免费套餐服务休眠

**解决方案：**
- 等待 30-60 秒冷启动
- 或手动访问一次 API 唤醒服务

### 6. 用户注册后不在群组中

**症状：** 使用邀请码注册成功，但群组成员列表看不到自己

**排查步骤：**
1. 检查邀请码是否有效
2. 检查注册返回的 `groupId` 是否正确
3. 检查后端 `addUserToGroup` 日志

**相关代码：**
- `server/src/modules/auth/auth.service.ts` 第 500-509 行
- `server/src/modules/roundtable/roundtable.service.ts` 第 725-835 行

---

## 部署检查清单

### 部署前

- [ ] 代码已提交到 main 分支
- [ ] 前端构建成功 (`cd web && npm run build`)
- [ ] 后端构建成功 (`cd server && npm run build`)
- [ ] 本地测试通过

### 前端部署后

- [ ] 访问 https://career-calendar.vercel.app 正常
- [ ] 登录页面加载正常
- [ ] 检查浏览器控制台无错误

### 后端部署后

- [ ] API 健康检查：`curl https://career-calendar-server.onrender.com/api`
- [ ] 验证码发送测试
- [ ] 邀请码验证测试

### 完整验证

```bash
# 1. 检查前端
curl -s -o /dev/null -w "%{http_code}" https://career-calendar.vercel.app
# 预期: 200

# 2. 检查后端
curl -s https://career-calendar-server.onrender.com/api
# 预期: {"status":"ok",...}

# 3. 检查验证码
curl -s -X POST https://career-calendar-server.onrender.com/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900000001","scene":"register"}'
# 预期: 返回包含 code 字段

# 4. 检查邀请码
curl -s -X POST https://career-calendar-server.onrender.com/api/invite-codes/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"GROUP1-001"}'
# 预期: {"valid":true,...}
```

---

## 快速参考

### 重要文件

| 文件 | 用途 |
|-----|------|
| `deploy.sh` | 一键部署脚本 |
| `.vercel/project.json` | Vercel 项目配置 |
| `render.yaml` | Render 服务配置 |
| `vercel.json` | 前端路由配置 |

### 重要 URL

| 服务 | URL |
|-----|-----|
| 前端生产 | https://career-calendar.vercel.app |
| 后端 API | https://career-calendar-server.onrender.com/api |
| Vercel Dashboard | https://vercel.com/oneday1/career-calendar |
| Render Dashboard | https://dashboard.render.com |

### 重置命令

```bash
# 重置邀请码
curl -X POST https://career-calendar-server.onrender.com/api/admin/seed

# 重新链接 Vercel 项目
cd D:/C_Projects/日历 && rm -rf .vercel && npx vercel link --project career-calendar --yes
```

---

## 更新历史

| 日期 | 内容 |
|-----|------|
| 2026-03-11 | 创建部署指南，记录常见问题和解决方案 |