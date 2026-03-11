/**
 * 筛选 API 服务
 * 根据 API-CONTRACT.md 唯一可信源实现
 */
import apiClient from '@/shared/services/api'
import type {
  FilterOptionsResponse,
  FilterEventsRequest,
  FilterEventsResponse,
  MatchingAnalyzeRequest,
  MatchingAnalyzeResponse,
} from '../types'

const BASE_URL = '/filters'
const EVENTS_URL = '/events'
const MATCHING_URL = '/matching'

export const filterApi = {
  /**
   * 获取筛选选项
   * GET /api/filters/options
   */
  getFilterOptions: async (): Promise<FilterOptionsResponse> => {
    const response = await apiClient.get<FilterOptionsResponse>(`${BASE_URL}/options`)
    return response as unknown as FilterOptionsResponse
  },

  /**
   * 筛选事件
   * POST /api/events/filter
   */
  filterEvents: async (params: FilterEventsRequest): Promise<FilterEventsResponse> => {
    const response = await apiClient.post<FilterEventsResponse>(`${EVENTS_URL}/filter`, params)
    return response as unknown as FilterEventsResponse
  },

  /**
   * 获取匹配度分析
   * POST /api/matching/analyze
   */
  getMatchingAnalyze: async (params: MatchingAnalyzeRequest): Promise<MatchingAnalyzeResponse> => {
    const response = await apiClient.post<MatchingAnalyzeResponse>(`${MATCHING_URL}/analyze`, params)
    return response as unknown as MatchingAnalyzeResponse
  },
}

export default filterApi