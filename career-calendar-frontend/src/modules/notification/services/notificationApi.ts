/**
 * 通知 API 服务
 * 基于 API-CONTRACT.md
 */
import apiClient from '@/shared/services/api'
import type {
  GetNotificationsQuery,
  GetNotificationsResponse,
  GetUnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
} from '../types'

export const notificationApi = {
  /**
   * 获取通知列表
   * GET /api/notifications
   */
  getNotifications: async (query?: GetNotificationsQuery): Promise<GetNotificationsResponse> => {
    const params = new URLSearchParams()
    if (query?.type) params.append('type', query.type)
    if (query?.read !== undefined) params.append('read', String(query.read))
    if (query?.page) params.append('page', String(query.page))
    if (query?.pageSize) params.append('pageSize', String(query.pageSize))

    const queryString = params.toString()
    return apiClient.get(`/notifications${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 获取未读数量
   * GET /api/notifications/unread-count
   */
  getUnreadCount: async (): Promise<GetUnreadCountResponse> => {
    return apiClient.get('/notifications/unread-count')
  },

  /**
   * 标记单条通知为已读
   * PUT /api/notifications/:id/read
   */
  markAsRead: async (id: string): Promise<MarkAsReadResponse> => {
    return apiClient.put(`/notifications/${id}/read`)
  },

  /**
   * 标记全部通知为已读
   * PUT /api/notifications/read-all
   */
  markAllAsRead: async (): Promise<MarkAllAsReadResponse> => {
    return apiClient.put('/notifications/read-all')
  },
}