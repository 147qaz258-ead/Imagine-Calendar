/**
 * 日历模块类型定义
 * 根据 API-CONTRACT.md 唯一可信源定义
 */

// 企业类型枚举
export enum CompanyType {
  SOE = 'soe',           // 国企（灰色）
  FOREIGN = 'foreign',   // 外企（紫色）
  PRIVATE = 'private',   // 民企（黄色）
  STARTUP = 'startup',   // 创业公司（橙色）
  GOVERNMENT = 'government', // 事业单位（蓝色）
}

// 企业类型颜色映射
export const CompanyTypeColors: Record<CompanyType, { bg: string; text: string; border: string }> = {
  [CompanyType.SOE]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
  },
  [CompanyType.FOREIGN]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
  },
  [CompanyType.PRIVATE]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  [CompanyType.STARTUP]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
  },
  [CompanyType.GOVERNMENT]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
}

// 企业类型中文标签
export const CompanyTypeLabels: Record<CompanyType, string> = {
  [CompanyType.SOE]: '国企',
  [CompanyType.FOREIGN]: '外企',
  [CompanyType.PRIVATE]: '民企',
  [CompanyType.STARTUP]: '创业公司',
  [CompanyType.GOVERNMENT]: '事业单位',
}

// 日历事件（列表项）
export interface CalendarEvent {
  id: string
  date: string           // YYYY-MM-DD
  title: string
  company: string
  companyType: CompanyType
  position: string
}

// 完整事件详情
export interface Event {
  id: string
  title: string
  company: string
  companyType: CompanyType
  position: string
  description?: string
  location?: string
  eventDate: string      // YYYY-MM-DD
  startTime?: string     // HH:mm
  endTime?: string       // HH:mm
  deadline?: string      // ISO 8601
  requirements?: string[]
  benefits?: string[]
  applyUrl?: string
  tags: string[]
  source: string
  createdAt: string
  updatedAt: string
}

// 日历查询参数
export interface CalendarQuery {
  year: number
  month: number          // 1-12
  companyType?: CompanyType
  industries?: string[]
}

// 日历响应数据
export interface CalendarResponse {
  success: boolean
  data: {
    year: number
    month: number
    events: CalendarEvent[]
  }
}

// 事件详情响应
export interface EventDetailResponse {
  success: boolean
  data: Event
}

// 关注响应
export interface FollowResponse {
  success: boolean
  data: {
    followed: boolean
    followerCount: number
  }
}

// 按日期分组的事件映射
export type EventsByDate = Record<string, CalendarEvent[]>