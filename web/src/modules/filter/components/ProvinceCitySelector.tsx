/**
 * 省市两级联动选择器
 */
import React, { useState, useEffect } from 'react'
import type { ProvinceOption, ProvinceCityValue } from '../types'

interface ProvinceCitySelectorProps {
  value: ProvinceCityValue[]
  onChange: (value: ProvinceCityValue[]) => void
  max?: number
  disabled?: boolean
}

export const ProvinceCitySelector: React.FC<ProvinceCitySelectorProps> = ({
  value,
  onChange,
  max = 5,
  disabled = false,
}) => {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  // 加载省市数据
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await fetch(
          'https://career-calendar-server.onrender.com/api/filters/locations'
        )
        const result = await response.json()
        if (result.success) {
          setProvinces(result.data)
        }
      } catch (error) {
        console.error('加载省市数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProvinces()
  }, [])

  // 获取选中省份的城市列表
  const getCitiesForProvince = (provinceName: string): { name: string }[] => {
    const province = provinces.find((p) => p.name === provinceName)
    return province?.cities || []
  }

  // 添加城市
  const handleAdd = () => {
    if (!selectedProvince || !selectedCity) return
    if (value.length >= max) return
    if (value.some((v) => v.province === selectedProvince && v.city === selectedCity)) return

    onChange([
      ...value,
      {
        province: selectedProvince,
        city: selectedCity,
      },
    ])

    setShowAddModal(false)
    setSelectedProvince('')
    setSelectedCity('')
  }

  // 移除城市
  const handleRemove = (province: string, city: string) => {
    onChange(value.filter((v) => !(v.province === province && v.city === city)))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        加载省市数据...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 已选择的城市标签 */}
      <div className="flex flex-wrap gap-2">
        {value.map((v, index) => (
          <span
            key={`${v.province}-${v.city}-${index}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
          >
            <span className="text-blue-500">{v.province}</span>
            <span>·</span>
            <span>{v.city}</span>
            {!disabled && (
              <button
                onClick={() => handleRemove(v.province, v.city)}
                className="ml-1 text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {/* 添加按钮 */}
      {!disabled && value.length < max && (
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-full hover:bg-blue-50"
        >
          + 添加城市
        </button>
      )}

      {/* 选择弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-medium mb-4">选择城市</h3>

            {/* 省份选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                省份
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value)
                  setSelectedCity('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择省份</option>
                {provinces.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 城市选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                城市
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedProvince}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">请选择城市</option>
                {selectedProvince &&
                  getCitiesForProvince(selectedProvince).map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedProvince('')
                  setSelectedCity('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedProvince || !selectedCity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProvinceCitySelector