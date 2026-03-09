/**
 * 求职偏好表单（13维度）
 */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { updatePreferences } from '../store/profileSlice'
import { setOnboardingStep } from '@/modules/auth/store/authSlice'
import { autoMatchRoundTable } from '@/modules/roundtable/store/roundTableSlice'
import { filterApi } from '@/modules/filter/services/filterApi'
import type { UserPreferences } from '../types'

// 偏好维度配置
const PREFERENCE_DIMENSIONS = [
  { key: 'locations', label: '地点偏好' },
  { key: 'selfPositioning', label: '自我定位' },
  { key: 'developmentDirection', label: '发展方向' },
  { key: 'industries', label: '行业偏好' },
  { key: 'platformTypes', label: '平台性质' },
  { key: 'companyScales', label: '企业规模' },
  { key: 'companyCulture', label: '企业文化' },
  { key: 'leadershipStyle', label: '领导风格' },
  { key: 'trainingPrograms', label: '培训项目' },
  { key: 'overtimePreference', label: '加班偏好' },
  { key: 'holidayPolicy', label: '假期偏好' },
  { key: 'medicalBenefits', label: '医疗保障' },
  { key: 'maternityBenefits', label: '生育福利' },
] as const

type PreferenceKey = typeof PREFERENCE_DIMENSIONS[number]['key']

interface FilterOption {
  value: string
  label: string
  description?: string
}

export const PreferencesForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, updateLoading, updateError } = useAppSelector((state) => state.profile)
  const { user: authUser, isAuthenticated } = useAppSelector((state) => state.auth)
  const { onboardingStep } = useAppSelector((state) => state.auth)

  // 优先使用 profile.user.id，回退到 authUser.id
  const userId = user?.id || authUser?.id

  // 筛选选项
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOption[]>>({})
  // 偏好选择
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({})
  // 加载状态
  const [loadingOptions, setLoadingOptions] = useState(true)

  // 加载筛选选项
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await filterApi.getFilterOptions()
        if (response.success) {
          setFilterOptions(response.data)
        }
      } catch (err) {
        console.error('加载筛选选项失败:', err)
      } finally {
        setLoadingOptions(false)
      }
    }
    loadFilterOptions()
  }, [])

  // 同步用户偏好
  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences)
    }
  }, [user?.preferences])

  // 切换选项
  const toggleOption = (dimension: PreferenceKey, value: string) => {
    setPreferences((prev) => {
      const currentValues = prev[dimension] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, [dimension]: newValues }
    })
  }

  // 检查是否选中
  const isSelected = (dimension: PreferenceKey, value: string) => {
    return preferences[dimension]?.includes(value) || false
  }

  // 保存偏好
  const handleSave = async () => {
    if (!userId) {
      console.error('PreferencesForm: 用户 ID 不存在')
      return
    }

    try {
      const result = await dispatch(
        updatePreferences({
          userId,
          data: { preferences },
        })
      ).unwrap()

      if (result) {
        // 判断是否在引导流程中
        const isInOnboarding = onboardingStep === 'preferences'

        if (isInOnboarding) {
          // 完成引导流程
          dispatch(setOnboardingStep('completed'))
          // 触发自动匹配群组
          dispatch(autoMatchRoundTable())
          // 导航到日历页面
          navigate('/calendar', { replace: true })
        } else {
          alert(`保存成功！匹配度评分: ${result.matchingScore}%`)
        }
      }
    } catch (err) {
      console.error('PreferencesForm: 保存偏好失败', err)
      // 错误已经通过 updateError 状态显示
    }
  }

  // 未登录或无用户数据时显示加载
  if (!isAuthenticated || !userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">加载用户信息...</span>
      </div>
    )
  }

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">加载选项中...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 mb-6">
        选择符合你期望的选项，系统会根据你的偏好推荐匹配的招聘事件。
      </p>

      {/* 维度列表 */}
      <div className="space-y-6">
        {PREFERENCE_DIMENSIONS.map((dimension) => (
          <div key={dimension.key}>
            <h3 className="text-sm font-medium text-gray-900 mb-2">{dimension.label}</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions[dimension.key]?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(dimension.key, option.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    isSelected(dimension.key, option.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 更新错误 */}
      {updateError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {updateError}
        </div>
      )}

      {/* 保存按钮 */}
      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={updateLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {updateLoading ? '保存中...' : '保存求职偏好'}
        </button>
      </div>
    </div>
  )
}

export default PreferencesForm