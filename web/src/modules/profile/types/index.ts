/**
 * 用户画像类型定义
 * 基于 API-CONTRACT.md
 */

/** 用户状态 */
export type UserStatus = 'active' | 'inactive' | 'banned'

/** 用户偏好（13维度） */
export interface UserPreferences {
  locations: string[]
  selfPositioning: string[]
  developmentDirection: string[]
  industries: string[]
  platformTypes: string[]
  companyScales: string[]
  companyCulture: string[]
  leadershipStyle: string[]
  trainingPrograms: string[]
  overtimePreference: string[]
  holidayPolicy: string[]
  medicalBenefits: string[]
  maternityBenefits: string[]
}

/** 用户 */
export interface User {
  id: string
  phone: string
  nickname?: string
  avatar?: string
  school?: string
  major?: string
  grade?: string
  studentId?: string
  graduationYear?: number
  studentIdImageUrl?: string
  isStudentVerified?: boolean
  preferences?: UserPreferences
  status: UserStatus
  createdAt: string
  updatedAt: string
}

/** 获取用户画像响应 */
export interface ProfileResponse {
  success: boolean
  data: User
  message?: string
}

/** 更新用户画像请求 */
export interface UpdateProfileRequest {
  nickname?: string
  avatar?: string
  school?: string
  major?: string
  grade?: string
  studentId?: string
  graduationYear?: number
}

/** 更新用户画像响应 */
export interface UpdateProfileResponse {
  success: boolean
  data: User
  message?: string
}

/** 更新用户偏好请求 */
export interface UpdatePreferencesRequest {
  preferences: Partial<UserPreferences>
}

/** 更新用户偏好响应 */
export interface UpdatePreferencesResponse {
  success: boolean
  data: {
    preferences: UserPreferences
    matchingScore: number
  }
  message?: string
}

/** 上传学生证响应 */
export interface UploadStudentCardResponse {
  success: boolean
  data: {
    school?: string
    major?: string
    grade?: string
    studentId?: string
    confidence: number
  }
  message?: string
}

/** 上传学生证图片响应 */
export interface UploadStudentIdImageResponse {
  success: boolean
  data: {
    studentIdImageUrl: string
    isStudentVerified: boolean
  }
  message?: string
}

/** Profile 状态 */
export interface ProfileState {
  user: User | null
  loading: boolean
  error: string | null
  updateLoading: boolean
  updateError: string | null
}