/**
 * 通知模块类型定义
 * 基于 API-CONTRACT.md
 */

/** 通知类型 */
export type NotificationType = 'event_reminder' | 'roundtable_invite' | 'application_update' | 'system'

/** 通知 */
export interface Notification {
  id: string
  type: NotificationType
  title: string
  content: string
  read: boolean
  readAt?: string
  createdAt: string
  data?: Record<string, unknown>
}

/** 获取通知列表查询参数 */
export interface GetNotificationsQuery {
  type?: NotificationType
  read?: boolean
  page?: number
  pageSize?: number
}

/** 获取通知列表响应 */
export interface GetNotificationsResponse {
  success: boolean
  data: {
    notifications: Notification[]
    total: number
    unreadCount: number
  }
  message?: string
}

/** 获取未读数量响应 */
export interface GetUnreadCountResponse {
  success: boolean
  data: {
    count: number
  }
  message?: string
}

/** 标记已读响应 */
export interface MarkAsReadResponse {
  success: boolean
  data: {
    read: boolean
    readAt: string
  }
  message?: string
}

/** 全部标记已读响应 */
export interface MarkAllAsReadResponse {
  success: boolean
  data: {
    updatedCount: number
  }
  message?: string
}

/** Notification 状态 */
export interface NotificationState {
  notifications: Notification[]
  total: number
  unreadCount: number
  loading: boolean
  error: string | null
  markAsReadLoading: string | null // 正在标记已读的通知ID
  markAllAsReadLoading: boolean
}