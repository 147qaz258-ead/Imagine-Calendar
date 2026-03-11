# 畅选日历端到端测试

## 环境要求

- Node.js 18+
- pnpm 或 npm

## 安装依赖

```bash
cd e2e-tests
pnpm install
npx playwright install chromium
```

## 运行测试

### 基础测试（API 健康检查）
```bash
pnpm test
```

### 针对生产环境测试
```bash
pnpm test:prod
```

### 可视化测试
```bash
pnpm test:ui
```

### 调试模式
```bash
pnpm test:debug
```

## 测试流程

### 1. 首次运行（需要手动登录）

生产环境不返回验证码，需要手动保存登录状态：

```bash
# 使用 Playwright Codegen 手动登录
npx playwright codegen --save-storage=.auth/user.json https://career-calendar.vercel.app/login
```

操作步骤：
1. 在打开的浏览器中输入手机号
2. 点击发送验证码
3. 从短信中获取验证码并输入
4. 完成登录
5. 关闭浏览器，状态自动保存

### 2. 运行完整测试

登录状态保存后，运行完整测试套件：

```bash
pnpm test
```

## 测试覆盖

### 测试套件 1: 用户首次使用流程
- 访问导入页
- 进入注册页面
- 验证邀请码有效性
- 完整注册流程

### 测试套件 2: 个性化设置流程（第二阶段）
- 登录后跳转到个性化设置页
- 设置地点偏好
- 设置行业偏好
- 保存偏好设置

### 测试套件 3: 圆桌讨论参与流程
- 查看圆桌群组
- 查看群组成员
- 分享日历功能

### 测试套件 4: API 健康检查
- 后端 API 可达
- 验证码发送 API
- 邀请码验证 API
- 群组列表 API

### 测试套件 5: 性能测试
- 首页加载时间
- 注册页面加载时间

## 测试数据

### 邀请码清单

| 群组 | 邀请码 | 说明 |
|------|--------|------|
| 自我探索组 | GROUP1-001 ~ GROUP1-006 | 每个邀请码只能使用1次 |
| 职业发展组 | GROUP2-001 ~ GROUP2-006 | 每个邀请码只能使用1次 |
| 行业交流组 | GROUP3-001 ~ GROUP3-006 | 每个邀请码只能使用1次 |

### 系统管理员账号

- 手机号: 10000000000
- 密码: Admin@123
- 昵称: 系统管理员

## 查看测试报告

```bash
pnpm report
```

## CI/CD 集成

可以在 GitHub Actions 中运行：

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd e2e-tests && npm ci
      - run: cd e2e-tests && npx playwright install chromium
      - run: cd e2e-tests && npm run test:prod
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: e2e-tests/playwright-report/
```

## 故障排除

### 验证码发送失败
- 检查后端日志: https://dashboard.render.com
- 确认 Redis 连接状态

### 邀请码无效
- 运行种子数据初始化: `curl -X POST https://career-calendar-server.onrender.com/api/admin/seed`

### 页面加载超时
- 检查 Vercel 部署状态
- 检查网络连接