/**
 * 验证码输入组件
 */
import React, { useState, useCallback, useRef, useEffect } from 'react'

interface VerifyCodeInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  length?: number
}

export const VerifyCodeInput: React.FC<VerifyCodeInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  length = 6,
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 初始化refs数组
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  const handleChange = useCallback(
    (index: number, inputValue: string) => {
      const digit = inputValue.replace(/\D/g, '').slice(-1)
      const newValue = value.split('')
      newValue[index] = digit
      const result = newValue.join('').slice(0, length)
      onChange(result)

      // 自动跳转到下一个输入框
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [value, onChange, length]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      // 处理退格键
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
      // 处理左右方向键
      if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
      if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [value, length]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      onChange(pastedData)
      // 聚焦到最后一个输入框或最后一个有内容的输入框
      const focusIndex = Math.min(pastedData.length, length - 1)
      inputRefs.current[focusIndex]?.focus()
    },
    [onChange, length]
  )

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        验证码
      </label>
      <div
        className={`flex gap-2 ${
          error ? 'animate-shake' : ''
        }`}
      >
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`w-12 h-12 text-center text-xl font-semibold border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
              error
                ? 'border-red-500 ring-2 ring-red-500'
                : isFocused
                ? 'border-blue-500 ring-2 ring-blue-500'
                : value[index]
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-300'
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}