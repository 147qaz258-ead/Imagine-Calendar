import { test as setup, expect } from '@playwright/test'

/**
 * 认证设置测试
 * 用于保存登录状态，供其他测试使用
 */

const authFile = '.auth/user.json'

setup('登录并保存状态', async ({ page, request }) => {
  // 生产环境需要手动登录
  // 这里我们通过 API 登录并保存 token

  const API_BASE = 'https://career-calendar-server.onrender.com/api'

  // 方法1: 使用 API 直接登录（需要已有账号）
  // 方法2: 手动在浏览器中登录，然后保存状态

  // 这里我们跳过自动登录，因为生产环境不返回验证码
  // 用户需要手动运行: npx playwright codegen --save-storage=.auth/user.json https://career-calendar.vercel.app/login

  setup.skip(true, '生产环境需要手动登录保存状态')
})