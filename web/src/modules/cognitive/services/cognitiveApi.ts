/**
 * 认知图谱 API 服务
 * 基于 API-CONTRACT.md
 */
import apiClient from '@/shared/services/api'
import type {
  CognitiveMapResponse,
  UpdateDimensionRequest,
  CognitiveHistoryQuery,
  CognitiveHistoryResponse,
  CompareCognitiveMapRequest,
  CompareCognitiveMapResponse,
  CognitiveVersionsResponse,
  CognitiveVersionResponse,
  CreateCognitiveVersionRequest,
  CompareVersionsResponse,
} from '../types'

export const cognitiveApi = {
  /**
   * 获取认知图谱
   * GET /api/users/:id/cognitive-map
   */
  getCognitiveMap: async (userId: string): Promise<CognitiveMapResponse> => {
    return apiClient.get(`/users/${userId}/cognitive-map`)
  },

  /**
   * 更新认知维度
   * PUT /api/users/:id/cognitive-map/dimensions
   */
  updateDimension: async (
    userId: string,
    data: UpdateDimensionRequest
  ): Promise<CognitiveMapResponse> => {
    return apiClient.put(`/users/${userId}/cognitive-map/dimensions`, data)
  },

  /**
   * 获取认知历史
   * GET /api/users/:id/cognitive-map/history
   */
  getCognitiveHistory: async (
    userId: string,
    query?: CognitiveHistoryQuery
  ): Promise<CognitiveHistoryResponse> => {
    const params = new URLSearchParams()
    if (query?.startDate) params.append('startDate', query.startDate)
    if (query?.endDate) params.append('endDate', query.endDate)
    const queryString = params.toString()
    const url = queryString
      ? `/users/${userId}/cognitive-map/history?${queryString}`
      : `/users/${userId}/cognitive-map/history`
    return apiClient.get(url)
  },

  /**
   * 对比认知图谱
   * POST /api/cognitive-map/compare
   */
  compareCognitiveMaps: async (
    data: CompareCognitiveMapRequest
  ): Promise<CompareCognitiveMapResponse> => {
    return apiClient.post('/cognitive-map/compare', data)
  },

  // ============ 版本管理接口 ============

  /**
   * 获取所有认知版本
   * GET /api/cognitive/versions
   */
  getCognitiveVersions: async (): Promise<CognitiveVersionsResponse> => {
    return apiClient.get('/cognitive/versions')
  },

  /**
   * 创建认知版本
   * POST /api/cognitive/version
   */
  createCognitiveVersion: async (
    data: CreateCognitiveVersionRequest
  ): Promise<CognitiveVersionResponse> => {
    return apiClient.post('/cognitive/version', data)
  },

  /**
   * 获取单个版本详情
   * GET /api/cognitive/versions/:id
   */
  getCognitiveVersionById: async (versionId: string): Promise<CognitiveVersionResponse> => {
    return apiClient.get(`/cognitive/versions/${versionId}`)
  },

  /**
   * 对比两个版本
   * GET /api/cognitive/compare?v1=xxx&v2=xxx
   */
  compareVersions: async (v1: string, v2: string): Promise<CompareVersionsResponse> => {
    return apiClient.get(`/cognitive/compare?v1=${v1}&v2=${v2}`)
  },
}