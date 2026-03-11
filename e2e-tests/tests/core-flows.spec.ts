import { test, expect, Page } from '@playwright/test'

/**
 * 端到端测试 - 畅选日历核心流程
 *
 * 测试环境: 生产环境 (https://career-calendar.vercel.app)
 * 后端 API: https://career-calendar-server.onrender.com
 *
 * 测试流程:
 * 1. 用户首次使用流程（注册 → 个性化设置 → 进入首页）
 * 2. 圆桌讨论参与流程（查看群组 → 分享日历 → 发起会议）
 */

// 测试账号配置
const TEST_USER = {
  phone: '13900000001',
  password: 'Test@123456',
  inviteCode: 'GROUP1-001', // 使用种子数据中的邀请码
}

// API 配置
const API_BASE = 'https://career-calendar-server.onrender.com/api'

/**
 * 辅助函数：通过 API 发送验证码并获取
 */
async function getVerificationCode(phone: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, scene: 'register' }),
  })

  const data = await response.json()

  // 生产环境不返回验证码，需要手动输入或使用测试账号
  if (data.data?.code) {
    return data.data.code
  }

  // 如果是生产环境，返回空字符串，测试将跳过验证码验证
  return ''
}

/**
 * 辅助函数：等待 API 响应
 */
async function waitForAPIResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse((response) =>
    typeof urlPattern === 'string'
      ? response.url().includes(urlPattern)
      : urlPattern.test(response.url())
  )
}

// ============================================
// 测试套件 1: 用户首次使用流程
// ============================================
test.describe('用户首次使用流程', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', '仅在 Chromium 上运行')

  test('1.1 访问导入页，检查页面加载', async ({ page }) => {
    await page.goto('/')

    // 检查页面标题或关键元素
    await expect(page).toHaveTitle(/畅选日历|Career Calendar/)

    // 检查导入页内容 - 使用更精确的选择器
    await expect(page.locator('button:has-text("登录")').first()).toBeVisible({ timeout: 10000 })
  })

  test('1.2 点击注册按钮，进入注册页面', async ({ page }) => {
    await page.goto('/login')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 检查是否有注册表单
    const registerTab = page.locator('text=注册').first()
    if (await registerTab.isVisible()) {
      await registerTab.click()
    }

    // 检查手机号输入框
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="手机"], input[placeholder*="phone"]')
    await expect(phoneInput).toBeVisible({ timeout: 5000 })
  })

  test('1.3 验证邀请码有效性', async ({ request }) => {
    // 通过 API 验证邀请码
    const response = await request.post('https://career-calendar-server.onrender.com/api/invite-codes/validate', {
      data: { code: TEST_USER.inviteCode },
      timeout: 30000,
    })

    const data = await response.json()

    expect(data.valid).toBe(true)
    expect(data.groupId).toBeTruthy()
  })

  test('1.4 完整注册流程（需要手动验证码）', async ({ page }) => {
    test.skip(true, '需要手动输入验证码，跳过自动测试')

    await page.goto('/login')

    // 切换到注册标签
    const registerTab = page.locator('text=注册').first()
    if (await registerTab.isVisible()) {
      await registerTab.click()
    }

    // 填写手机号
    await page.locator('input[placeholder*="手机"]').fill(TEST_USER.phone)

    // 点击发送验证码
    await page.locator('button:has-text("发送验证码")').click()

    // 等待验证码发送成功
    await expect(page.locator('text=验证码已发送')).toBeVisible({ timeout: 10000 })

    // 注意：生产环境需要手动输入验证码
    // 这里可以集成短信服务 API 来获取验证码
  })
})

// ============================================
// 测试套件 2: 个性化设置流程
// ============================================
test.describe('个性化设置流程（第二阶段）', () => {
  test.use({ storageState: '.auth/user.json' }) // 使用已登录状态

  test.beforeAll(async ({ request }) => {
    // 确保测试用户已登录
    // 如果没有 .auth/user.json，需要先运行登录测试
  })

  test('2.1 登录后检查是否跳转到个性化设置页', async ({ page }) => {
    test.skip(true, '需要先完成登录状态保存')

    await page.goto('/')

    // 检查是否在个性化设置页
    const currentUrl = page.url()

    // 如果用户未设置偏好，应该跳转到个性化设置页
    if (currentUrl.includes('/preferences') || currentUrl.includes('/onboarding')) {
      await expect(page.locator('text=个性化').or(page.locator('text=设置'))).toBeVisible()
    }
  })

  test('2.2 设置地点偏好', async ({ page }) => {
    test.skip(true, '需要登录状态')

    await page.goto('/preferences')

    // 选择地点
    const locationOption = page.locator('text=北京').or(page.locator('text=上海')).first()
    if (await locationOption.isVisible()) {
      await locationOption.click()
    }
  })

  test('2.3 设置行业偏好', async ({ page }) => {
    test.skip(true, '需要登录状态')

    await page.goto('/preferences')

    // 选择行业
    const industryOption = page.locator('text=互联网').or(page.locator('text=科技')).first()
    if (await industryOption.isVisible()) {
      await industryOption.click()
    }
  })

  test('2.4 保存偏好设置', async ({ page }) => {
    test.skip(true, '需要登录状态')

    await page.goto('/preferences')

    // 点击保存按钮
    const saveButton = page.locator('button:has-text("保存")').or(page.locator('button:has-text("完成")'))

    if (await saveButton.isVisible()) {
      await saveButton.click()

      // 等待跳转到首页
      await expect(page).toHaveURL(/\/calendar|\/home/, { timeout: 10000 })
    }
  })
})

// ============================================
// 测试套件 3: 圆桌讨论参与流程
// ============================================
test.describe('圆桌讨论参与流程', () => {
  test.use({ storageState: '.auth/user.json' })

  test('3.1 查看圆桌群组', async ({ page }) => {
    test.skip(true, '需要登录状态')

    await page.goto('/roundtable')

    // 检查群组列表
    const groupCard = page.locator('[data-testid="group-card"]').or(page.locator('text=自我探索组'))
    await expect(groupCard.first()).toBeVisible({ timeout: 10000 })
  })

  test('3.2 查看群组成员', async ({ page }) => {
    test.skip(true, '需要登录状态且已加入群组')

    await page.goto('/roundtable')

    // 点击第一个群组
    await page.locator('[data-testid="group-card"]').first().click()

    // 检查成员列表
    await expect(page.locator('text=成员')).toBeVisible()
  })

  test('3.3 分享日历功能', async ({ page }) => {
    test.skip(true, '需要登录状态且已加入群组')

    await page.goto('/roundtable')

    // 检查是否有分享日历按钮
    const shareButton = page.locator('button:has-text("分享日历")').or(page.locator('button:has-text("共享日历")'))

    if (await shareButton.isVisible()) {
      await shareButton.click()

      // 检查分享弹窗
      await expect(page.locator('text=确认分享')).toBeVisible()
    }
  })
})

// ============================================
// 测试套件 4: API 健康检查
// ============================================
test.describe('API 健康检查', () => {
  test('4.1 后端 API 可达', async ({ request }) => {
    // 直接访问 API 根路径
    const response = await request.get('https://career-calendar-server.onrender.com/api', {
      timeout: 30000,
    })

    // 检查 API 是否响应
    expect(response.status()).toBeLessThan(500)

    const data = await response.json()
    expect(data.status).toBe('ok')
  })

  test('4.2 验证码发送 API', async ({ request }) => {
    const response = await request.post('https://career-calendar-server.onrender.com/api/auth/send-code', {
      data: { phone: '13800138000', scene: 'register' },
      timeout: 30000,
    })

    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data?.expiresIn).toBe(300)
  })

  test('4.3 邀请码验证 API', async ({ request }) => {
    const response = await request.post('https://career-calendar-server.onrender.com/api/invite-codes/validate', {
      data: { code: 'GROUP1-001' },
      timeout: 30000,
    })

    const data = await response.json()

    expect(data.valid).toBe(true)
  })

  test('4.4 群组列表 API（需要认证）', async ({ request }) => {
    const response = await request.get('https://career-calendar-server.onrender.com/api/round-tables', {
      timeout: 30000,
    })

    // 未认证应该返回 401
    expect(response.status()).toBe(401)
  })
})

// ============================================
// 测试套件 5: 性能测试
// ============================================
test.describe('性能测试', () => {
  test('5.1 首页加载时间', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // 首页加载应该在 30 秒内完成（考虑到服务器冷启动）
    expect(loadTime).toBeLessThan(30000)

    console.log(`首页加载时间: ${loadTime}ms`)
  })

  test('5.2 注册页面加载时间', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // 注册页面加载应该在 30 秒内完成
    expect(loadTime).toBeLessThan(30000)

    console.log(`注册页面加载时间: ${loadTime}ms`)
  })
})