/**
 * 群组 API 服务
 * 根据 API-CONTRACT.md 唯一可信源实现
 */
import apiClient from '@/shared/services/api'
import type {
  RoundTableQuery,
  RoundTableListResponse,
  RoundTableDetailResponse,
  ApplyRoundTableRequest,
  ApplyRoundTableResponse,
  JoinRoundTableResponse,
  LeaveRoundTableResponse,
  QuestionsResponse,
} from '../types'

const BASE_URL = '/round-tables'

export const roundTableApi = {
  /**
   * 获取群组列表
   * GET /api/round-tables
   */
  getRoundTables: async (params?: RoundTableQuery): Promise<RoundTableListResponse> => {
    const response = await apiClient.get<RoundTableListResponse>(BASE_URL, {
      params: {
        status: params?.status,
        page: params?.page,
        pageSize: params?.pageSize,
      },
    })
    return response as unknown as RoundTableListResponse
  },

  /**
   * 创建群组报名
   * POST /api/round-tables/apply
   */
  apply: async (data: ApplyRoundTableRequest): Promise<ApplyRoundTableResponse> => {
    const response = await apiClient.post<ApplyRoundTableResponse>(`${BASE_URL}/apply`, data)
    return response as unknown as ApplyRoundTableResponse
  },

  /**
   * 自动匹配群组
   * POST /api/round-tables/auto-match
   * 用户完成个性化选择后自动触发
   */
  autoMatch: async (): Promise<{
    success: boolean
    data: {
      matched: boolean
      roundTableId: string
      status: string
      participantCount: number
    }
  }> => {
    const response = await apiClient.post(`${BASE_URL}/auto-match`)
    return response as unknown as {
      success: boolean
      data: {
        matched: boolean
        roundTableId: string
        status: string
        participantCount: number
      }
    }
  },

  /**
   * 获取群组详情
   * GET /api/round-tables/:id
   */
  getDetail: async (id: string): Promise<RoundTableDetailResponse> => {
    const response = await apiClient.get<RoundTableDetailResponse>(`${BASE_URL}/${id}`)
    return response as unknown as RoundTableDetailResponse
  },

  /**
   * 加入群组
   * POST /api/round-tables/:id/join
   */
  join: async (id: string): Promise<JoinRoundTableResponse> => {
    const response = await apiClient.post<JoinRoundTableResponse>(`${BASE_URL}/${id}/join`)
    return response as unknown as JoinRoundTableResponse
  },

  /**
   * 离开群组
   * POST /api/round-tables/:id/leave
   */
  leave: async (id: string): Promise<LeaveRoundTableResponse> => {
    const response = await apiClient.post<LeaveRoundTableResponse>(`${BASE_URL}/${id}/leave`)
    return response as unknown as LeaveRoundTableResponse
  },

  /**
   * 获取群组问题清单
   * GET /api/round-tables/questions
   */
  getQuestions: async (): Promise<QuestionsResponse> => {
    const response = await apiClient.get<QuestionsResponse>(`${BASE_URL}/questions`)
    return response as unknown as QuestionsResponse
  },

  /**
   * 确认成为组长
   * POST /api/round-tables/:id/confirm-leader
   * TASK-4.2: 组长确认机制完善
   */
  confirmAsLeader: async (id: string): Promise<{ success: boolean; data: { roundTable: unknown } }> => {
    const response = await apiClient.post<{ success: boolean; data: { roundTable: unknown } }>(
      `${BASE_URL}/${id}/confirm-leader`,
    )
    return response as unknown as { success: boolean; data: { roundTable: unknown } }
  },

  /**
   * 获取组长确认状态
   * GET /api/round-tables/:id/leader-status
   * TASK-4.2: 组长确认机制完善
   */
  getLeaderConfirmStatus: async (id: string): Promise<LeaderConfirmStatusResponse> => {
    const response = await apiClient.get<LeaderConfirmStatusResponse>(`${BASE_URL}/${id}/leader-status`)
    return response as unknown as LeaderConfirmStatusResponse
  },

  /**
   * 获取问题清单完成状态
   * GET /api/round-tables/:id/questionnaire-status
   * TASK-4.3: 问题清单完成状态
   */
  getQuestionnaireStatus: async (id: string): Promise<QuestionnaireStatusResponse> => {
    const response = await apiClient.get<QuestionnaireStatusResponse>(`${BASE_URL}/${id}/questionnaire-status`)
    return response as unknown as QuestionnaireStatusResponse
  },

  // ============ TASK-4.4: 日历共享功能 ============

  /**
   * 发起日历共享邀请
   * POST /api/round-tables/:id/share-calendar
   */
  requestCalendarShare: async (id: string): Promise<CalendarShareResponse> => {
    const response = await apiClient.post<CalendarShareResponse>(`${BASE_URL}/${id}/share-calendar`)
    return response as unknown as CalendarShareResponse
  },

  /**
   * 接受日历共享
   * PUT /api/round-tables/:id/share-calendar/:shareId/accept
   */
  acceptCalendarShare: async (groupId: string, shareId: string): Promise<{ success: boolean; data: { status: string; sharedAt: string } }> => {
    const response = await apiClient.put<{ success: boolean; data: { status: string; sharedAt: string } }>(
      `${BASE_URL}/${groupId}/share-calendar/${shareId}/accept`,
    )
    return response as unknown as { success: boolean; data: { status: string; sharedAt: string } }
  },

  /**
   * 拒绝日历共享
   * PUT /api/round-tables/:id/share-calendar/:shareId/decline
   */
  declineCalendarShare: async (groupId: string, shareId: string): Promise<{ success: boolean; data: { status: string } }> => {
    const response = await apiClient.put<{ success: boolean; data: { status: string } }>(
      `${BASE_URL}/${groupId}/share-calendar/${shareId}/decline`,
    )
    return response as unknown as { success: boolean; data: { status: string } }
  },

  /**
   * 获取日历共享状态
   * GET /api/round-tables/:id/share-calendar/status
   */
  getCalendarShareStatus: async (id: string): Promise<CalendarShareStatusResponse> => {
    const response = await apiClient.get<CalendarShareStatusResponse>(`${BASE_URL}/${id}/share-calendar/status`)
    return response as unknown as CalendarShareStatusResponse
  },

  /**
   * 查看成员空闲时间
   * GET /api/round-tables/:id/members-availability
   */
  getMembersAvailability: async (
    id: string,
    startDate: string,
    endDate: string,
  ): Promise<MembersAvailabilityResponse> => {
    const response = await apiClient.get<MembersAvailabilityResponse>(
      `${BASE_URL}/${id}/members-availability`,
      { params: { startDate, endDate } },
    )
    return response as unknown as MembersAvailabilityResponse
  },

  // ============ TASK-4.5: 发起会议功能 ============

  /**
   * 创建会议
   * POST /api/groups/:id/meetings
   */
  createMeeting: async (
    groupId: string,
    data: CreateMeetingRequest,
  ): Promise<{ success: boolean; data: GroupMeeting }> => {
    const response = await apiClient.post<{ success: boolean; data: GroupMeeting }>(
      `/groups/${groupId}/meetings`,
      data,
    )
    return response as unknown as { success: boolean; data: GroupMeeting }
  },

  /**
   * 获取会议列表
   * GET /api/groups/:id/meetings
   */
  getMeetings: async (
    groupId: string,
  ): Promise<{ success: boolean; data: { meetings: GroupMeeting[] } }> => {
    const response = await apiClient.get<{ success: boolean; data: { meetings: GroupMeeting[] } }>(
      `/groups/${groupId}/meetings`,
    )
    return response as unknown as { success: boolean; data: { meetings: GroupMeeting[] } }
  },

  /**
   * 获取会议详情
   * GET /api/groups/:id/meetings/:meetingId
   */
  getMeetingDetail: async (
    groupId: string,
    meetingId: string,
  ): Promise<{ success: boolean; data: GroupMeeting }> => {
    const response = await apiClient.get<{ success: boolean; data: GroupMeeting }>(
      `/groups/${groupId}/meetings/${meetingId}`,
    )
    return response as unknown as { success: boolean; data: GroupMeeting }
  },

  /**
   * 更新会议
   * PUT /api/groups/:id/meetings/:meetingId
   */
  updateMeeting: async (
    groupId: string,
    meetingId: string,
    data: UpdateMeetingRequest,
  ): Promise<{ success: boolean; data: GroupMeeting }> => {
    const response = await apiClient.put<{ success: boolean; data: GroupMeeting }>(
      `/groups/${groupId}/meetings/${meetingId}`,
      data,
    )
    return response as unknown as { success: boolean; data: GroupMeeting }
  },

  /**
   * 取消会议
   * DELETE /api/groups/:id/meetings/:meetingId
   */
  cancelMeeting: async (
    groupId: string,
    meetingId: string,
  ): Promise<{ success: boolean; data: { cancelled: boolean } }> => {
    const response = await apiClient.delete<{ success: boolean; data: { cancelled: boolean } }>(
      `/groups/${groupId}/meetings/${meetingId}`,
    )
    return response as unknown as { success: boolean; data: { cancelled: boolean } }
  },
}

/**
 * 组长确认状态响应
 * TASK-4.2: 组长确认机制完善
 */
export interface LeaderConfirmStatusResponse {
  success: boolean
  data: {
    hasLeader: boolean
    leader: {
      userId: string
      nickname: string
    } | null
    needsConfirm: boolean
    deadline: string | null
    canConfirm: boolean
    remainingTime: number // 剩余时间（秒）
  }
}

/**
 * 问题清单完成状态响应
 * TASK-4.3: 问题清单完成状态
 */
export interface QuestionnaireStatusResponse {
  success: boolean
  data: {
    total: number
    completed: number
    statusList: Array<{
      userId: string
      nickname: string
      avatar: string | null
      completed: boolean
      progress: number
      total: number
    }>
  }
}

// ============ TASK-4.4: 日历共享功能类型 ============

/**
 * 日历共享状态
 */
export type CalendarShareStatus = 'pending' | 'accepted' | 'declined'

/**
 * 日历共享邀请
 */
export interface CalendarShareItem {
  id: string
  userId?: string
  viewerId?: string
  nickname: string
  avatar: string | null
  status: CalendarShareStatus
  createdAt: string
  sharedAt?: string | null
}

/**
 * 发起共享邀请响应
 */
export interface CalendarShareResponse {
  success: boolean
  data: {
    shares: CalendarShareItem[]
  }
}

/**
 * 获取共享状态响应
 */
export interface CalendarShareStatusResponse {
  success: boolean
  data: {
    isLeader: boolean
    shares: CalendarShareItem[]
  }
}

/**
 * 空闲时间段
 */
export interface AvailabilitySlot {
  date: string
  startTime: string
  endTime: string
  status: 'available' | 'busy'
}

/**
 * 成员空闲时间
 */
export interface MemberAvailability {
  userId: string
  nickname: string
  avatar: string | null
  slots: AvailabilitySlot[]
}

/**
 * 查看成员空闲时间响应
 */
export interface MembersAvailabilityResponse {
  success: boolean
  data: {
    startDate: string
    endDate: string
    availability: MemberAvailability[]
    message?: string
  }
}

// ============ TASK-4.5: 发起会议功能类型 ============

/**
 * 会议状态
 */
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled'

/**
 * 会议信息
 */
export interface GroupMeeting {
  id: string
  groupId: string
  title: string
  scheduledAt: string
  duration: number
  meetingUrl: string | null
  location: string | null
  notes: string | null
  status: MeetingStatus
  createdBy: string
  creatorNickname: string
  createdAt: string
}

/**
 * 时间冲突信息
 */
export interface TimeConflictEvent {
  id: string
  title: string
  eventDate: string
  startTime: string
  endTime: string
}

export interface TimeConflict {
  userId: string
  nickname: string
  events: TimeConflictEvent[]
}

/**
 * 创建会议请求
 */
export interface CreateMeetingRequest {
  title: string
  scheduledAt: string
  duration?: number
  meetingUrl?: string
  location?: string
  notes?: string
}

/**
 * 更新会议请求
 */
export interface UpdateMeetingRequest {
  title?: string
  scheduledAt?: string
  duration?: number
  meetingUrl?: string
  location?: string
  notes?: string
}

export default roundTableApi