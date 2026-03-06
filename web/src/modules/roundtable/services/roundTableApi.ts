/**
 * 圆桌讨论 API 服务
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
   * 获取圆桌列表
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
   * 创建圆桌报名
   * POST /api/round-tables/apply
   */
  apply: async (data: ApplyRoundTableRequest): Promise<ApplyRoundTableResponse> => {
    const response = await apiClient.post<ApplyRoundTableResponse>(`${BASE_URL}/apply`, data)
    return response as unknown as ApplyRoundTableResponse
  },

  /**
   * 获取圆桌详情
   * GET /api/round-tables/:id
   */
  getDetail: async (id: string): Promise<RoundTableDetailResponse> => {
    const response = await apiClient.get<RoundTableDetailResponse>(`${BASE_URL}/${id}`)
    return response as unknown as RoundTableDetailResponse
  },

  /**
   * 加入圆桌
   * POST /api/round-tables/:id/join
   */
  join: async (id: string): Promise<JoinRoundTableResponse> => {
    const response = await apiClient.post<JoinRoundTableResponse>(`${BASE_URL}/${id}/join`)
    return response as unknown as JoinRoundTableResponse
  },

  /**
   * 离开圆桌
   * POST /api/round-tables/:id/leave
   */
  leave: async (id: string): Promise<LeaveRoundTableResponse> => {
    const response = await apiClient.post<LeaveRoundTableResponse>(`${BASE_URL}/${id}/leave`)
    return response as unknown as LeaveRoundTableResponse
  },

  /**
   * 获取圆桌问题清单
   * GET /api/round-tables/questions
   */
  getQuestions: async (): Promise<QuestionsResponse> => {
    const response = await apiClient.get<QuestionsResponse>(`${BASE_URL}/questions`)
    return response as unknown as QuestionsResponse
  },
}

export default roundTableApi