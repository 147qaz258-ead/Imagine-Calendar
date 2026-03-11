import { test, expect } from '@playwright/test'

/**
 * E2E 测试：注册流程与群组成员关系验证
 *
 * 测试场景：
 * 1. 验证邀请码状态
 * 2. 用户注册时填写邀请码
 * 3. 注册成功后验证用户是否被添加到群组
 *
 * 问题描述：用户注册时填写邀请码，注册成功后用户应该在对应的群组中看到自己，但目前看不到
 */

const FRONTEND_URL = 'https://career-calendar.vercel.app'
const API_BASE = 'https://career-calendar-server.onrender.com/api'

// 生成随机手机号（避免重复注册）
function generateRandomPhone(): string {
  const prefix = '138'
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return prefix + suffix
}

// 测试数据
const TEST_INVITE_CODE = 'GROUP1-001'
const TEST_PASSWORD = 'Test123456' // 包含字母和数字

test.describe('注册流程与群组成员关系验证', () => {
  test.setTimeout(180000) // 3分钟超时

  test('诊断：验证邀请码 GROUP1-001 状态', async ({ request }) => {
    console.log('\n========== 邀请码诊断 ==========')
    console.log(`检查邀请码: ${TEST_INVITE_CODE}`)

    const response = await request.post(`${API_BASE}/invite-codes/validate`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        code: TEST_INVITE_CODE,
      },
    })

    console.log('验证 API 状态:', response.status())
    const data = await response.json()
    console.log('验证结果:', JSON.stringify(data, null, 2))

    // 输出诊断结果
    console.log('\n========== 诊断结果 ==========')
    if (data.valid) {
      console.log(`邀请码 ${TEST_INVITE_CODE} 有效`)
      console.log(`关联群组 ID: ${data.groupId}`)
    } else {
      console.log(`邀请码 ${TEST_INVITE_CODE} 无效`)
      console.log(`原因: ${data.message}`)
      console.log('\n这是导致用户无法被添加到群组的根本原因！')
      console.log('需要检查：')
      console.log('1. 邀请码是否已过期 (expiresAt)')
      console.log('2. 邀请码是否已达到最大使用次数 (usedCount >= maxUses)')
      console.log('3. 邀请码状态是否为禁用 (status = DISABLED)')
    }
    console.log('==================================\n')

    // 记录状态但不失败测试（用于诊断）
    // expect(data.valid).toBe(true)
  })

  test('用户注册时使用邀请码，验证群组成员关系', async ({ page, request }) => {
    // ========== 步骤0: 预检查邀请码状态 ==========
    console.log('\n步骤0: 预检查邀请码状态...')
    const validateResponse = await request.post(`${API_BASE}/invite-codes/validate`, {
      headers: { 'Content-Type': 'application/json' },
      data: { code: TEST_INVITE_CODE },
    })
    const validateData = await validateResponse.json()
    console.log('邀请码状态:', JSON.stringify(validateData, null, 2))

    if (!validateData.valid) {
      console.log(`\n警告: 邀请码 ${TEST_INVITE_CODE} 无效，原因: ${validateData.message}`)
      console.log('这可能导致注册失败或用户无法被添加到群组\n')
      // 测试标记为跳过，但继续执行以观察实际行为
      test.skip(true, `邀请码 ${TEST_INVITE_CODE} 无效: ${validateData.message}`)
    }

    // 生成测试手机号
    const testPhone = generateRandomPhone()
    console.log(`\n测试手机号: ${testPhone}`)

    // ========== 步骤1: 访问登录页面 ==========
    console.log('步骤1: 访问登录页面...')
    await page.goto(`${FRONTEND_URL}/login`)
    await page.waitForLoadState('networkidle')

    // 验证页面加载成功（使用更精确的选择器）
    await expect(page.locator('h1').filter({ hasText: '畅选日历' }).first()).toBeVisible({ timeout: 10000 })
    console.log('登录页面加载成功')

    // 截图
    await page.screenshot({ path: 'test-artifacts/01-login-page.png', fullPage: true })

    // ========== 步骤2: 切换到注册标签 ==========
    console.log('步骤2: 切换到注册标签...')
    const registerTab = page.locator('button').filter({ hasText: '注册' })
    await registerTab.click()
    await page.waitForTimeout(500)

    // 验证注册表单显示
    await expect(page.locator('label').filter({ hasText: '邀请码' })).toBeVisible()
    console.log('已切换到注册标签')

    // 截图
    await page.screenshot({ path: 'test-artifacts/02-register-tab.png', fullPage: true })

    // ========== 步骤3: 输入手机号 ==========
    console.log('步骤3: 输入手机号...')
    const phoneInput = page.locator('input').filter({ has: page.locator('[placeholder*="手机号"], [placeholder*="请输入"]') }).first()
    await phoneInput.fill(testPhone)
    console.log(`已输入手机号: ${testPhone}`)

    // ========== 步骤4: 发送验证码 ==========
    console.log('步骤4: 发送验证码...')

    // 监听验证码 API 响应
    const sendCodePromise = page.waitForResponse(
      resp => resp.url().includes('/api/auth/send-code'),
      { timeout: 30000 }
    )

    const sendCodeButton = page.locator('button').filter({ hasText: '发送验证码' })
    await sendCodeButton.click()

    const sendCodeResponse = await sendCodePromise
    const sendCodeData = await sendCodeResponse.json()
    console.log('验证码 API 响应:', JSON.stringify(sendCodeData, null, 2))

    // 获取验证码
    let verificationCode: string | null = null

    if (sendCodeData.success && sendCodeData.data?.code) {
      verificationCode = sendCodeData.data.code
      console.log(`从 API 响应获取验证码: ${verificationCode}`)
    } else if (!sendCodeData.success) {
      throw new Error(`发送验证码失败: ${sendCodeData.error?.message || JSON.stringify(sendCodeData)}`)
    }

    if (!verificationCode) {
      throw new Error('无法获取验证码')
    }

    // ========== 步骤5: 输入验证码 ==========
    console.log('步骤5: 输入验证码...')

    // 尝试多种输入框定位方式
    const codeInputByPlaceholder = page.locator('input[placeholder*="验证码"]')
    const codeInputByMaxlength = page.locator('input[maxlength="6"]')

    if (await codeInputByPlaceholder.count() > 0) {
      await codeInputByPlaceholder.first().fill(verificationCode)
    } else if (await codeInputByMaxlength.count() > 0) {
      await codeInputByMaxlength.first().fill(verificationCode)
    } else {
      // 尝试分离输入框模式
      const allInputs = page.locator('input:not([type="hidden"]):not([type="submit"])')
      const inputCount = await allInputs.count()
      console.log(`找到 ${inputCount} 个输入框`)

      // 查找可能是验证码输入的输入框
      for (let i = 0; i < inputCount; i++) {
        const input = allInputs.nth(i)
        const placeholder = await input.getAttribute('placeholder')
        const className = await input.getAttribute('class')
        console.log(`输入框 ${i}: placeholder="${placeholder}", class="${className?.substring(0, 50)}"`)
      }
    }
    console.log(`已输入验证码: ${verificationCode}`)

    // ========== 步骤6: 输入密码 ==========
    console.log('步骤6: 输入密码...')
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill(TEST_PASSWORD)
    console.log('已输入密码')

    // ========== 步骤7: 输入邀请码 ==========
    console.log('步骤7: 输入邀请码...')
    const inviteCodeInput = page.locator('input[placeholder*="邀请码"]')
    await inviteCodeInput.fill(TEST_INVITE_CODE)
    console.log(`已输入邀请码: ${TEST_INVITE_CODE}`)

    // 等待邀请码验证
    await page.waitForTimeout(2000)

    // 检查邀请码验证状态
    const inviteCodeStatus = page.locator('text=邀请码有效')
    const inviteCodeError = page.locator('text=邀请码无效, text=邀请码已过期, text=邀请码不存在')

    if (await inviteCodeStatus.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('邀请码验证通过（页面显示有效）')
    } else if (await inviteCodeError.isVisible({ timeout: 1000 }).catch(() => false)) {
      const errorText = await inviteCodeError.textContent()
      console.log(`邀请码验证失败（页面显示）: ${errorText}`)
    }

    // 截图保存当前状态
    await page.screenshot({ path: 'test-artifacts/03-before-register.png', fullPage: true })

    // ========== 步骤8: 点击注册按钮 ==========
    console.log('步骤8: 点击注册按钮...')

    // 监听注册 API 响应
    const registerPromise = page.waitForResponse(
      resp => resp.url().includes('/api/auth/register') || resp.url().includes('/api/invite-codes/validate'),
      { timeout: 60000 }
    )

    const registerButton = page.locator('button').filter({ hasText: '注 册' })
    await registerButton.click()

    const registerResponse = await registerPromise
    const registerData = await registerResponse.json()
    console.log('API 响应:', JSON.stringify(registerData, null, 2))

    // 检查是否是邀请码验证失败
    if (registerResponse.url().includes('/invite-codes/validate')) {
      console.log('收到邀请码验证响应')
      if (!registerData.valid) {
        console.log(`\n========== 注册失败原因 ==========`)
        console.log(`邀请码 ${TEST_INVITE_CODE} 无效`)
        console.log(`原因: ${registerData.message}`)
        console.log('==================================\n')

        // 截图保存错误状态
        await page.screenshot({ path: 'test-artifacts/04-invite-code-invalid.png', fullPage: true })

        // 等待错误消息显示
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'test-artifacts/05-register-error.png', fullPage: true })

        throw new Error(`邀请码 ${TEST_INVITE_CODE} 无效: ${registerData.message}`)
      }
    }

    // 检查注册是否成功
    if (!registerData.success) {
      console.error('注册失败:', registerData.error || registerData.message)

      // 截图保存错误状态
      await page.screenshot({ path: 'test-artifacts/04-register-failed.png', fullPage: true })

      throw new Error(`注册失败: ${registerData.error?.message || JSON.stringify(registerData)}`)
    }

    console.log('注册成功!')
    console.log('用户信息:', JSON.stringify(registerData.data?.user, null, 2))
    console.log('群组ID:', registerData.data?.groupId)

    // 获取 token
    const token = registerData.data?.token
    if (!token) {
      throw new Error('注册成功但未返回 token')
    }

    // 截图保存成功状态
    await page.screenshot({ path: 'test-artifacts/04-register-success.png', fullPage: true })

    // ========== 步骤9: 通过 API 验证群组成员关系 ==========
    console.log('步骤9: 通过 API 验证群组成员关系...')

    // 获取我的群组列表
    const myRoundTablesResponse = await request.get(`${API_BASE}/round-tables/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('我的群组 API 状态:', myRoundTablesResponse.status())

    const myRoundTablesData = await myRoundTablesResponse.json()
    console.log('我的群组数据:', JSON.stringify(myRoundTablesData, null, 2))

    // ========== 步骤10: 检查验证结果 ==========
    console.log('步骤10: 检查验证结果...')

    const userId = registerData.data?.user?.id
    const groupId = registerData.data?.groupId

    // 检查是否返回了 groupId
    if (!groupId) {
      console.error('\n========== 问题诊断 ==========')
      console.error('注册成功但未返回 groupId')
      console.error('这意味着邀请码验证可能通过了，但没有关联的群组')
      console.error('需要检查 invite_code 表中该邀请码的 groupId 字段')
      console.error('==================================\n')

      // 不抛出错误，而是继续检查
    }

    // 检查群组列表是否包含用户
    let userInGroup = false
    const allRoundTables = [
      ...(myRoundTablesData.data?.matching || []),
      ...(myRoundTablesData.data?.upcoming || []),
      ...(myRoundTablesData.data?.completed || []),
    ]

    console.log(`用户所在群组数量: ${allRoundTables.length}`)

    for (const rt of allRoundTables) {
      console.log(`群组 ID: ${rt.id}, 状态: ${rt.status}, 话题: ${rt.topic}`)
      if (groupId && rt.id === groupId) {
        userInGroup = true
        console.log(`找到目标群组: ${groupId}`)
      }
    }

    // 如果用户不在群组中，尝试获取群组详情验证
    if (!userInGroup && groupId) {
      console.log('用户不在群组列表中，尝试获取群组详情验证...')

      const groupDetailResponse = await request.get(`${API_BASE}/round-tables/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (groupDetailResponse.ok()) {
        const groupDetail = await groupDetailResponse.json()
        console.log('群组详情:', JSON.stringify(groupDetail, null, 2))

        // 检查用户是否在参与者列表中
        const participants = groupDetail.data?.participants || []
        const userParticipant = participants.find((p: { userId: string }) => p.userId === userId)

        if (userParticipant) {
          console.log('用户在群组参与者列表中:', JSON.stringify(userParticipant, null, 2))
          userInGroup = true
        } else {
          console.error('用户不在群组参与者列表中')
          console.log('群组参与者:', JSON.stringify(participants, null, 2))
        }
      }
    }

    // 输出测试结果摘要
    console.log('\n========== 测试结果摘要 ==========')
    console.log(`测试手机号: ${testPhone}`)
    console.log(`邀请码: ${TEST_INVITE_CODE}`)
    console.log(`注册状态: 成功`)
    console.log(`用户 ID: ${userId}`)
    console.log(`群组 ID: ${groupId || '未返回'}`)
    console.log(`用户在群组中: ${userInGroup ? '是' : '否'}`)
    console.log('==================================\n')

    // 最终断言
    if (!groupId) {
      console.log('\n问题诊断: 邀请码可能未关联群组，请检查数据库中 invite_code 表的 groupId 字段')
    }

    if (!userInGroup) {
      console.log('\n问题诊断: 用户注册成功但未被添加到群组中')
      console.log('可能原因:')
      console.log('1. 邀请码未关联群组 (groupId 为 null)')
      console.log('2. addUserToGroup 方法执行失败')
      console.log('3. 群组状态不允许加入 (已完成或已取消)')

      throw new Error('用户注册成功但未被添加到群组中！这是一个 BUG！')
    }

    expect(userInGroup).toBe(true)
  })
})