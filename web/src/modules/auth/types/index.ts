/**
 * 认证模块类型定义
 * 基于 API-CONTRACT.md
 */

// 用户状态
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

// 用户偏好
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

// 用户信息
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
  preferences?: UserPreferences
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// 发送验证码请求
export interface SendCodeRequest {
  phone: string
  scene: 'login' | 'register'
}

// 发送验证码响应
export interface SendCodeResponse {
  success: boolean
  message: string
  data?: {
    expiresIn: number
    code?: string // 非生产环境返回验证码用于测试
  }
}

// 登录请求
export interface LoginRequest {
  phone: string
  code: string
}

// 登录响应
export interface LoginResponse {
  success: boolean
  data: {
    user: User
    token: string
    expiresIn: number
    isNewUser: boolean
  }
}

// 刷新 Token 请求
export interface RefreshTokenRequest {
  token: string
}

// 刷新 Token 响应
export interface RefreshTokenResponse {
  success: boolean
  data: {
    token: string
    expiresIn: number
  }
}

// 获取当前用户响应
export interface MeResponse {
  success: boolean
  data: User
}

// 引导步骤类型
export type OnboardingStep = 'welcome' | 'preferences' | 'completed'

// 认证状态
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isNewUser: boolean
  onboardingStep: OnboardingStep
  loading: boolean
  error: string | null
}

// 密码登录请求
export interface PasswordLoginRequest {
  phone: string
  password: string
}

// 验证邀请码请求
export interface ValidateInviteCodeRequest {
  code: string
}

// 验证邀请码响应
export interface ValidateInviteCodeResponse {
  valid: boolean
  groupId?: string
  message: string
}

// 注册请求
export interface RegisterRequest {
  phone: string
  code: string
  password: string
  inviteCode: string
}

// 注册响应
export interface RegisterResponse {
  success: boolean
  data: {
    user: User
    token: string
    expiresIn: number
  }
}