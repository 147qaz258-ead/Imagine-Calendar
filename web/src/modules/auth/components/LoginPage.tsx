/**
 * 登录页面主组件
 */
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, sendVerifyCode, clearError } from '../store/authSlice'
import { PhoneInput } from './PhoneInput'
import { VerifyCodeInput } from './VerifyCodeInput'

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

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth)

  // 表单状态
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)

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

    try {
      const result = await dispatch(
        sendVerifyCode({ phone, scene: 'login' })
      ).unwrap()

      if (result.success) {
        setCountdown(60)
        setCodeSent(true)
      }
    } catch {
      // 错误已经在slice中处理
    }
  }, [phone, dispatch])

  // 登录
  const handleLogin = useCallback(async () => {
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

  // 手机号变化时清除错误
  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value)
    if (phoneError) setPhoneError(null)
  }, [phoneError])

  // 验证码变化时清除错误
  const handleCodeChange = useCallback((value: string) => {
    setCode(value)
    if (codeError) setCodeError(null)
  }, [codeError])

  const canSendCode = countdown === 0 && phone.length === 11 && /^1[3-9]\d{9}$/.test(phone)
  const canLogin = code.length === 6

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">畅选日历</h1>
          <p className="mt-2 text-sm text-gray-600">帮助大学生规划职业发展路径</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
            手机号登录
          </h2>

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
              error={phoneError || undefined}
              disabled={loading}
            />
          </div>

          {/* 验证码输入 */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <VerifyCodeInput
                  value={code}
                  onChange={handleCodeChange}
                  error={codeError || undefined}
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={!canSendCode || loading}
                className={`mt-6 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  canSendCode && !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送验证码'}
              </button>
            </div>
          </div>

          {/* 登录按钮 */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={!canLogin || loading}
            className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
              canLogin && !loading
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {loading ? (
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
                登录中...
              </span>
            ) : (
              '登 录'
            )}
          </button>

          {/* 协议提示 */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            登录即表示同意
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
  )
}