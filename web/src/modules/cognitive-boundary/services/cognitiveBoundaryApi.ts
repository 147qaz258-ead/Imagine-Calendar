/**
 * 摸索认知边界API服务
 */
import apiClient from '@/shared/services/api'
import type {
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
  GetAssessmentResponse,
  CognitiveBoundaryAssessment,
} from '../types'

const BASE_URL = '/cognitive-boundary'

export const cognitiveBoundaryApi = {
  /**
   * 获取当前用户的认知边界评估
   */
  async getAssessment(): Promise<GetAssessmentResponse> {
    // apiClient 拦截器已经返回 response.data，无需再次调用 .data
    return apiClient.get<GetAssessmentResponse>(`${BASE_URL}/assessment`)
  },

  /**
   * 获取指定用户的认知边界评估
   */
  async getUserAssessment(userId: string): Promise<GetAssessmentResponse> {
    return apiClient.get<GetAssessmentResponse>(`${BASE_URL}/assessment/${userId}`)
  },

  /**
   * 提交问题评估
   */
  async submitAssessment(data: SubmitAssessmentRequest): Promise<SubmitAssessmentResponse> {
    return apiClient.post<SubmitAssessmentResponse>(`${BASE_URL}/assessment`, data)
  },

  /**
   * 更新单个问题的评估
   */
  async updateQuestionAssessment(
    questionId: string,
    level: number
  ): Promise<SubmitAssessmentResponse> {
    return apiClient.put<SubmitAssessmentResponse>(
      `${BASE_URL}/assessment/${questionId}`,
      { level }
    )
  },

  /**
   * 获取评估历史
   */
  async getAssessmentHistory(): Promise<{
    success: boolean
    data: CognitiveBoundaryAssessment[]
    message?: string
  }> {
    return apiClient.get(`${BASE_URL}/assessment/history`)
  },

  /**
   * 删除评估记录
   */
  async deleteAssessment(assessmentId: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.delete(`${BASE_URL}/assessment/${assessmentId}`)
  },
}

export default cognitiveBoundaryApi