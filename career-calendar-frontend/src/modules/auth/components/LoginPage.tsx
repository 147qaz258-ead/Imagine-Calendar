/**
 * 登录页面主组件
 * 支持三种模式：验证码登录、密码登录、注册
 */
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  login,
  loginWithPassword,
  register,
  sendVerifyCode,
  clearError,
} from '../store/authSlice'
import { authApi } from '../services/authApi'
import { PhoneInput } from './PhoneInput'
import { VerifyCodeInput } from './VerifyCodeInput'
import { PasswordInput } from './PasswordInput'

// Tab 类型
type TabType = 'code' | 'password' | 'register'

// Tab 配置
const TABS: { key: TabType; label: string }[] = [
  { key: 'code', label: '验证码登录' },
  { key: 'password', label: '密码登录' },
  { key: 'register', label: '注册' },
]

// 验证手机号格式
const validatePhone = (phone: string): string | null => {
  if (!phone) return '请输入手机号'
  if (phone.length !== 11) return '手机号必须为11位'
  if (!/^1[3-9]\d{9}$/.test(phone)) return '请输入有效的手机号'
  return null
}

// 验证验证码格式
const validateCode = (code: string): string | null => {
  if (!code) return '请输入验证码'
  if (code.length !== 6) return '验证码必须为6位'
  return null
}

// 验证密码格式
const validatePassword = (password: string): string | null => {
  if (!password) return '请输入密码'
  if (password.length < 6) return '密码至少6位'
  if (password.length > 20) return '密码最多20位'
  if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(password)) return '密码必须包含字母和数字'
  return null
}

// 验证邀请码格式
const validateInviteCodeFormat = (inviteCode: string): string | null => {
  if (!inviteCode) return '请输入邀请码'
  if (inviteCode.length < 4) return '邀请码格式不正确'
  return null
}

export function LoginPage(): JSX.Element {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  )

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('code')

  // 表单状态
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  // 错误状态
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null)

  // 验证码发送状态
  const [codeSent, setCodeSent] = useState(false)

  // 测试环境显示的验证码
  const [displayCode, setDisplayCode] = useState<string | null>(null)

  // 邀请码验证状态
  const [validatingInviteCode, setValidatingInviteCode] = useState(false)
  const [inviteCodeValid, setInviteCodeValid] = useState(false)

  // 已登录则跳转
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/calendar', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 清除错误
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  // Tab 切换时清除表单错误
  useEffect(() => {
    setPhoneError(null)
    setCodeError(null)
    setPasswordError(null)
    setInviteCodeError(null)
    setInviteCodeValid(false)
  }, [activeTab])

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    // 验证手机号
    const phoneValidation = validatePhone(phone)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }

    setPhoneError(null)
    setCodeError(null)
    setDisplayCode(null)

    try {
      const scene = activeTab === 'register' ? 'register' : 'login'
      const result = await dispatch(
        sendVerifyCode({ phone, scene })
      ).unwrap()

      if (result.success) {
        setCountdown(60)
        setCodeSent(true)
        // 开发环境显示验证码
        if (result.data?.code) {
          setDisplayCode(result.data.code)
        }
      }
    } catch {
      // 错误已经在slice中处理
    }
  }, [phone, activeTab, dispatch])

  // 验证邀请码
  const handleValidateInviteCode = useCallback(async (code: string): Promise<boolean> => {
    const formatError = validateInviteCodeFormat(code)
    if (formatError) {
      setInviteCodeError(formatError)
      setInviteCodeValid(false)
      return false
    }

    setValidatingInviteCode(true)
    setInviteCodeError(null)

    try {
      const result = await authApi.validateInviteCode({ code })

      if (result.valid) {
        setInviteCodeValid(true)
        setInviteCodeError(null)
        return true
      } else {
        setInviteCodeValid(false)
        setInviteCodeError(result.message || '邀请码无效')
        return false
      }
    } catch {
      setInviteCodeValid(false)
      setInviteCodeError('邀请码验证失败，请稍后重试')
      return false
    } finally {
      setValidatingInviteCode(false)
    }
  }, [])

  // 验证码登录
  const handleCodeLogin = useCallback(async () => {
    // 验证手机号
    const phoneValidation = validatePhone(phone)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }

    // 验证验证码
    const codeValidation = validateCode(code)
    if (codeValidation) {
      setCodeError(codeValidation)
      return
    }

    setPhoneError(null)
    setCodeError(null)

    try {
      const result = await dispatch(login({ phone, code })).unwrap()
      if (result.success) {
        navigate('/calendar', { replace: true })
      }
    } catch {
      // 错误已经在slice中处理
    }
  }, [phone, code, dispatch, navigate])

  // 密码登录
  const handlePasswordLogin = useCallback(async () => {
    // 验证手机号
    const phoneValidation = validatePhone(phone)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }

    // 验证密码
    const passwordValidation = validatePassword(password)
    if (passwordValidation) {
      setPasswordError(passwordValidation)
      return
    }

    setPhoneError(null)
    setPasswordError(null)

    try {
      const result = await dispatch(
        loginWithPassword({ phone, password })
      ).unwrap()
      if (result.success) {
        navigate('/calendar', { replace: true })
      }
    } catch {
      // 错误已经在slice中处理
    }
  }, [phone, password, dispatch, navigate])

  // 注册
  const handleRegister = useCallback(async () => {
    // 验证手机号
    const phoneValidation = validatePhone(phone)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }

    // 验证验证码
    const codeValidation = validateCode(code)
    if (codeValidation) {
      setCodeError(codeValidation)
      return
    }

    // 验证密码
    const passwordValidation = validatePassword(password)
    if (passwordValidation) {
      setPasswordError(passwordValidation)
      return
    }

    // 验证邀请码格式
    const inviteCodeFormatError = validateInviteCodeFormat(inviteCode)
    if (inviteCodeFormatError) {
      setInviteCodeError(inviteCodeFormatError)
      return
    }

    setPhoneError(null)
    setCodeError(null)
    setPasswordError(null)

    // 先验证邀请码
    if (!inviteCodeValid) {
      const isValid = await handleValidateInviteCode(inviteCode)
      if (!isValid) {
        return
      }
    }

    try {
      const result = await dispatch(
        register({ phone, code, password, inviteCode })
      ).unwrap()
      if (result.success) {
        navigate('/calendar', { replace: true })
      }
    } catch {
      // 错误已经在slice中处理
    }
  }, [phone, code, password, inviteCode, inviteCodeValid, dispatch, navigate, handleValidateInviteCode])

  // 表单提交
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      switch (activeTab) {
        case 'code':
          handleCodeLogin()
          break
        case 'password':
          handlePasswordLogin()
          break
        case 'register':
          handleRegister()
          break
      }
    },
    [activeTab, handleCodeLogin, handlePasswordLogin, handleRegister]
  )

  // 手机号变化时清除错误
  const handlePhoneChange = useCallback(
    (value: string) => {
      setPhone(value)
      if (phoneError) setPhoneError(null)
    },
    [phoneError]
  )

  // 验证码变化时清除错误
  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value)
      if (codeError) setCodeError(null)
    },
    [codeError]
  )

  // 密码变化时清除错误
  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value)
      if (passwordError) setPasswordError(null)
    },
    [passwordError]
  )

  // 邀请码变化时清除错误和验证状态
  const handleInviteCodeChange = useCallback(
    (value: string) => {
      setInviteCode(value)
      if (inviteCodeError) setInviteCodeError(null)
      if (inviteCodeValid) setInviteCodeValid(false)
    },
    [inviteCodeError, inviteCodeValid]
  )

  // 按钮是否可用
  const isPhoneValid = phone.length === 11 && /^1[3-9]\d{9}$/.test(phone)
  const canSendCode = countdown === 0 && isPhoneValid

  const canSubmit = (() => {
    if (loading || validatingInviteCode) return false
    switch (activeTab) {
      case 'code':
        return code.length === 6
      case 'password':
        return password.length >= 6
      case 'register':
        return code.length === 6 && password.length >= 6 && inviteCode.length >= 4
      default:
        return false
    }
  })()

  // 获取按钮文字
  const getButtonText = (): string => {
    if (loading) {
      switch (activeTab) {
        case 'code':
        case 'password':
          return '登录中...'
        case 'register':
          return '注册中...'
        default:
          return '处理中...'
      }
    }
    if (validatingInviteCode) {
      return '验证邀请码...'
    }
    switch (activeTab) {
      case 'code':
      case 'password':
        return '登 录'
      case 'register':
        return '注 册'
      default:
        return '提 交'
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 左侧产品定位宣传区域 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between">
        {/* Logo 和标题 */}
        <div>
          <h1 className="text-4xl font-bold text-white">畅选日历</h1>
          <p className="mt-2 text-blue-200 text-lg">
            帮助大学生规划职业发展路径
          </p>
        </div>

        {/* 产品定位内容 */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-white leading-tight">
            我能帮你：
          </h2>
          <div className="space-y-6">
            {[
              {
                icon: '🎯',
                title: '正确使用AI工具',
                desc: '帮助你学习如何正确使用AI工具，提升学习效率'
              },
              {
                icon: '⏰',
                title: '每天2小时自主学习',
                desc: '提供每天2小时以内的自主学习和深入思考机会'
              },
              {
                icon: '🔍',
                title: '摸索认知边界',
                desc: '提供摸索认知边界的问题清单，发现你的潜力'
              },
              {
                icon: '👥',
                title: '职业兴趣社群',
                desc: '推荐与你职业兴趣相近的学生社群'
              },
              {
                icon: '💼',
                title: '模拟真实工作场景',
                desc: '通过圆桌讨论模拟真实工作场景'
              },
              {
                icon: '🌟',
                title: '由你决定你是谁',
                desc: '探索自我定位，发现职业发展方向'
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-blue-200 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="flex items-center gap-4 text-blue-200 text-sm">
          <span>已服务 1000+ 大学生</span>
          <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
          <span>98% 用户满意度</span>
        </div>
      </div>

      {/* 右侧登录表单区域 */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">畅选日历</h1>
            <p className="mt-2 text-sm text-gray-600">
              帮助大学生规划职业发展路径
            </p>
          </div>

          {/* 登录卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Tab 切换 */}
          <div className="flex border-b border-gray-200 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit}>
            {/* 全局错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* 手机号输入 */}
            <div className="mb-4">
              <PhoneInput
                value={phone}
                onChange={handlePhoneChange}
                error={phoneError ?? undefined}
                disabled={loading}
              />
            </div>

            {/* 验证码登录模式 */}
            {activeTab === 'code' && (
              <>
                {/* 验证码输入 */}
                <div className="mb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <VerifyCodeInput
                        value={code}
                        onChange={handleCodeChange}
                        error={codeError ?? undefined}
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={!canSendCode || loading}
                      className={`flex-shrink-0 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        canSendCode && !loading
                          ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {countdown > 0
                        ? `${countdown}s`
                        : codeSent
                        ? '重新发送'
                        : '发送验证码'}
                    </button>
                  </div>
                  {/* 测试环境显示验证码 */}
                  {displayCode && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">
                        <span className="font-medium">测试验证码：</span>
                        <span className="font-mono font-bold text-lg ml-2">{displayCode}</span>
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        （因成本原因暂未接入短信服务，验证码已直接显示）
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 密码登录模式 */}
            {activeTab === 'password' && (
              <>
                {/* 密码输入 */}
                <div className="mb-6">
                  <PasswordInput
                    value={password}
                    onChange={handlePasswordChange}
                    error={passwordError ?? undefined}
                    disabled={loading}
                    placeholder="请输入密码"
                  />
                </div>
              </>
            )}

            {/* 注册模式 */}
            {activeTab === 'register' && (
              <>
                {/* 验证码输入 */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <VerifyCodeInput
                        value={code}
                        onChange={handleCodeChange}
                        error={codeError ?? undefined}
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={!canSendCode || loading}
                      className={`flex-shrink-0 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        canSendCode && !loading
                          ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {countdown > 0
                        ? `${countdown}s`
                        : codeSent
                        ? '重新发送'
                        : '发送验证码'}
                    </button>
                  </div>
                  {/* 测试环境显示验证码 */}
                  {displayCode && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">
                        <span className="font-medium">测试验证码：</span>
                        <span className="font-mono font-bold text-lg ml-2">{displayCode}</span>
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        （因成本原因暂未接入短信服务，验证码已直接显示）
                      </p>
                    </div>
                  )}
                </div>

                {/* 密码输入 */}
                <div className="mb-4">
                  <PasswordInput
                    value={password}
                    onChange={handlePasswordChange}
                    error={passwordError ?? undefined}
                    disabled={loading}
                    placeholder="设置密码（6-20位，需含字母和数字）"
                    autoComplete="new-password"
                  />
                </div>

                {/* 邀请码输入 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邀请码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => handleInviteCodeChange(e.target.value.trim())}
                      placeholder="请输入邀请码"
                      disabled={loading || validatingInviteCode}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        inviteCodeError
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : inviteCodeValid
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {inviteCodeValid && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {inviteCodeError && (
                    <p className="mt-1 text-sm text-red-500">{inviteCodeError}</p>
                  )}
                  {inviteCodeValid && (
                    <p className="mt-1 text-sm text-green-500">邀请码有效</p>
                  )}
                </div>
              </>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading || validatingInviteCode ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {getButtonText()}
                </span>
              ) : (
                getButtonText()
              )}
            </button>
          </form>

          {/* 协议提示 */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            {activeTab === 'register' ? '注册' : '登录'}即表示同意
            <a href="/terms" className="text-blue-600 hover:underline">
              用户协议
            </a>
            和
            <a href="/privacy" className="text-blue-600 hover:underline">
              隐私政策
            </a>
          </p>
        </div>

        {/* 底部链接 */}
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-blue-600">
              返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}