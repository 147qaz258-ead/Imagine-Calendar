/**
 * 筛选工具函数
 */

import type { UserPreferences, FilterOption } from '../types'

/**
 * 计算筛选条件数量
 */
export function countFilters(filters: Partial<UserPreferences>): number {
  return Object.values(filters).reduce((count, values) => {
    return count + (Array.isArray(values) ? values.length : 0)
  }, 0)
}

/**
 * 检查筛选条件是否为空
 */
export function isFiltersEmpty(filters: Partial<UserPreferences>): boolean {
  return countFilters(filters) === 0
}

/**
 * 比较两个筛选条件是否相同
 */
export function isFiltersEqual(
  filters1: Partial<UserPreferences>,
  filters2: Partial<UserPreferences>
): boolean {
  const keys1 = Object.keys(filters1) as (keyof UserPreferences)[]
  const keys2 = Object.keys(filters2) as (keyof UserPreferences)[]

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    const values1 = filters1[key] || []
    const values2 = filters2[key] || []

    if (values1.length !== values2.length) return false

    const sorted1 = [...values1].sort()
    const sorted2 = [...values2].sort()

    for (let i = 0; i < sorted1.length; i++) {
      if (sorted1[i] !== sorted2[i]) return false
    }
  }

  return true
}

/**
 * 序列化筛选条件为 URL 参数
 */
export function serializeFiltersToUrl(filters: Partial<UserPreferences>): string {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      params.set(key, values.join(','))
    }
  })

  return params.toString()
}

/**
 * 从 URL 参数解析筛选条件
 */
export function parseFiltersFromUrl(search: string): Partial<UserPreferences> {
  const params = new URLSearchParams(search)
  const filters: Partial<UserPreferences> = {}

  const validKeys: (keyof UserPreferences)[] = [
    'locations',
    'selfPositioning',
    'developmentDirection',
    'industries',
    'platformTypes',
    'companyScales',
    'companyCulture',
    'leadershipStyle',
    'trainingPrograms',
    'overtimePreference',
    'holidayPolicy',
    'medicalBenefits',
    'maternityBenefits',
  ]

  params.forEach((value, key) => {
    if (validKeys.includes(key as keyof UserPreferences)) {
      filters[key as keyof UserPreferences] = value.split(',')
    }
  })

  return filters
}

/**
 * 保存筛选条件到 localStorage
 */
export function saveFiltersToStorage(filters: Partial<UserPreferences>): void {
  try {
    localStorage.setItem('calendar_filters', JSON.stringify(filters))
  } catch (e) {
    console.error('保存筛选条件失败:', e)
  }
}

/**
 * 从 localStorage 加载筛选条件
 */
export function loadFiltersFromStorage(): Partial<UserPreferences> | null {
  try {
    const stored = localStorage.getItem('calendar_filters')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('加载筛选条件失败:', e)
  }
  return null
}

/**
 * 清除 localStorage 中的筛选条件
 */
export function clearFiltersFromStorage(): void {
  try {
    localStorage.removeItem('calendar_filters')
  } catch (e) {
    console.error('清除筛选条件失败:', e)
  }
}

/**
 * 获取选项标签
 */
export function getOptionLabel(
  options: FilterOption[],
  value: string
): string {
  const option = options.find((opt) => opt.value === value)
  return option?.label || value
}

/**
 * 获取选中的选项标签列表
 */
export function getSelectedLabels(
  options: FilterOption[],
  values: string[]
): string[] {
  return values.map((value) => getOptionLabel(options, value))
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

/**
 * 匹配度等级
 */
export function getMatchScoreLevel(score: number): {
  level: 'high' | 'medium' | 'low'
  label: string
  color: string
} {
  if (score >= 80) {
    return { level: 'high', label: '高度匹配', color: 'text-green-600' }
  }
  if (score >= 50) {
    return { level: 'medium', label: '中度匹配', color: 'text-yellow-600' }
  }
  return { level: 'low', label: '低度匹配', color: 'text-red-600' }
}