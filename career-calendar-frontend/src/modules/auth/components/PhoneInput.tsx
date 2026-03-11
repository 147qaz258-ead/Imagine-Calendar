/**
 * 手机号输入组件
 */
import React, { useState, useCallback } from 'react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/\D/g, '').slice(0, 11)
      onChange(inputValue)
    },
    [onChange]
  )

  const isValid = value.length === 11 && /^1[3-9]\d{9}$/.test(value)

  return (
    <div className="w-full">
      <label
        htmlFor="phone"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        手机号
      </label>
      <div
        className={`relative rounded-lg shadow-sm ${
          isFocused
            ? 'ring-2 ring-blue-500 border-blue-500'
            : error
            ? 'ring-2 ring-red-500 border-red-500'
            : 'border border-gray-300'
        }`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">+86</span>
        </div>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="请输入手机号"
          className={`block w-full pl-14 pr-10 py-3 text-lg border-0 rounded-lg focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
            error ? 'placeholder-red-300' : 'placeholder-gray-400'
          }`}
          autoComplete="tel"
          inputMode="numeric"
        />
        {isValid && !error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              className="h-5 w-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}