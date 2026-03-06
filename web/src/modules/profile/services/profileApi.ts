/**
 * 用户画像 API 服务
 * 基于 API-CONTRACT.md
 */
import apiClient from '@/shared/services/api'
import type {
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
  UploadStudentCardResponse,
} from '../types'

export const profileApi = {
  /**
   * 获取用户画像
   * GET /api/users/:id/profile
   */
  getProfile: async (userId: string): Promise<ProfileResponse> => {
    return apiClient.get(`/users/${userId}/profile`)
  },

  /**
   * 更新用户画像
   * PUT /api/users/:id/profile
   */
  updateProfile: async (userId: string, data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    return apiClient.put(`/users/${userId}/profile`, data)
  },

  /**
   * 更新用户偏好（13维度）
   * PUT /api/users/:id/preferences
   */
  updatePreferences: async (userId: string, data: UpdatePreferencesRequest): Promise<UpdatePreferencesResponse> => {
    return apiClient.put(`/users/${userId}/preferences`, data)
  },

  /**
   * 上传学生证（OCR）
   * POST /api/users/:id/student-card
   */
  uploadStudentCard: async (userId: string, file: File): Promise<UploadStudentCardResponse> => {
    const formData = new FormData()
    formData.append('image', file)

    return apiClient.post(`/users/${userId}/student-card`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}