/**
 * 企业类型颜色配置
 * 为不同企业类型设置不同的显示颜色 - 单一数据源
 */

import { CompanyType } from './company-type'

// 企业类型颜色映射（单一数据源）
export const CompanyTypeColors: Record<CompanyType, { bg: string; text: string; border: string }> = {
  [CompanyType.SOE]: {
    bg: 'bg-gray-200',
    text: 'text-gray-800',
    border: 'border-gray-400',
  },
  [CompanyType.FOREIGN]: {
    bg: 'bg-purple-200',
    text: 'text-purple-800',
    border: 'border-purple-400',
  },
  [CompanyType.PRIVATE]: {
    bg: 'bg-yellow-200',
    text: 'text-yellow-800',
    border: 'border-yellow-400',
  },
  [CompanyType.STARTUP]: {
    bg: 'bg-orange-200',
    text: 'text-orange-800',
    border: 'border-orange-400',
  },
  [CompanyType.GOVERNMENT]: {
    bg: 'bg-sky-200',
    text: 'text-sky-800',
    border: 'border-sky-400',
  },
}

// 默认颜色（未知企业类型）
export const DEFAULT_COMPANY_COLOR = CompanyTypeColors[CompanyType.PRIVATE]

/**
 * 获取企业类型对应的颜色
 * @param companyType 企业类型枚举值
 * @returns 颜色配置对象
 */
export function getCompanyTypeColor(companyType: CompanyType): { bg: string; text: string; border: string } {
  return CompanyTypeColors[companyType] || DEFAULT_COMPANY_COLOR
}