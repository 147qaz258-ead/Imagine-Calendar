/**
 * 日历 API 服务
 * 根据 API-CONTRACT.md 唯一可信源实现
 */
import apiClient from '@/shared/services/api'
import type {
  CalendarQuery,
  CalendarResponse,
  EventDetailResponse,
  FollowResponse,
  Event,
} from '../types'

const BASE_URL = '/events'

export const calendarApi = {
  /**
   * 获取日历事件
   * GET /api/events/calendar
   */
  getCalendarEvents: async (params: CalendarQuery): Promise<CalendarResponse> => {
    const response = await apiClient.get<CalendarResponse>(`${BASE_URL}/calendar`, {
      params: {
        year: params.year,
        month: params.month,
        companyType: params.companyType,
        industries: params.industries,
      },
    })
    return response as unknown as CalendarResponse
  },

  /**
   * 获取事件详情
   * GET /api/events/:id
   */
  getEventDetail: async (eventId: string): Promise<EventDetailResponse> => {
    const response = await apiClient.get<EventDetailResponse>(`${BASE_URL}/${eventId}`)
    return response as unknown as EventDetailResponse
  },

  /**
   * 关注事件
   * POST /api/events/:id/follow
   */
  followEvent: async (eventId: string): Promise<FollowResponse> => {
    const response = await apiClient.post<FollowResponse>(`${BASE_URL}/${eventId}/follow`)
    return response as unknown as FollowResponse
  },

  /**
   * 取消关注事件
   * DELETE /api/events/:id/follow
   */
  unfollowEvent: async (eventId: string): Promise<FollowResponse> => {
    const response = await apiClient.delete<FollowResponse>(`${BASE_URL}/${eventId}/follow`)
    return response as unknown as FollowResponse
  },

  /**
   * 获取已关注事件列表
   * GET /api/users/:id/followed-events
   */
  getFollowedEvents: async (userId: string): Promise<{ success: boolean; data: Event[] }> => {
    const response = await apiClient.get<{ success: boolean; data: Event[] }>(
      `/users/${userId}/followed-events`
    )
    return response as unknown as { success: boolean; data: Event[] }
  },
}

export default calendarApi