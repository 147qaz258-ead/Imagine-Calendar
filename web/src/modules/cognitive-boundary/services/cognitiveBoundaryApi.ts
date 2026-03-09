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
    const response = await apiClient.get<GetAssessmentResponse>(`${BASE_URL}/assessment`)
    return response.data
  },

  /**
   * 获取指定用户的认知边界评估
   */
  async getUserAssessment(userId: string): Promise<GetAssessmentResponse> {
    const response = await apiClient.get<GetAssessmentResponse>(`${BASE_URL}/assessment/${userId}`)
    return response.data
  },

  /**
   * 提交问题评估
   */
  async submitAssessment(data: SubmitAssessmentRequest): Promise<SubmitAssessmentResponse> {
    const response = await apiClient.post<SubmitAssessmentResponse>(`${BASE_URL}/assessment`, data)
    return response.data
  },

  /**
   * 更新单个问题的评估
   */
  async updateQuestionAssessment(
    questionId: string,
    level: number
  ): Promise<SubmitAssessmentResponse> {
    const response = await apiClient.put<SubmitAssessmentResponse>(
      `${BASE_URL}/assessment/${questionId}`,
      { level }
    )
    return response.data
  },

  /**
   * 获取评估历史
   */
  async getAssessmentHistory(): Promise<{
    success: boolean
    data: CognitiveBoundaryAssessment[]
    message?: string
  }> {
    const response = await apiClient.get(`${BASE_URL}/assessment/history`)
    return response.data
  },

  /**
   * 删除评估记录
   */
  async deleteAssessment(assessmentId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`${BASE_URL}/assessment/${assessmentId}`)
    return response.data
  },
}

export default cognitiveBoundaryApi