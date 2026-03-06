/**
 * 认证 API 服务
 * 基于 API-CONTRACT.md
 */
import apiClient from '@/shared/services/api'
import type {
  SendCodeRequest,
  SendCodeResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MeResponse,
} from '../types'

export const authApi = {
  /**
   * 发送验证码
   */
  sendCode: async (data: SendCodeRequest): Promise<SendCodeResponse> => {
    return apiClient.post('/auth/send-code', data)
  },

  /**
   * 手机号验证码登录
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post('/auth/login', data)
  },

  /**
   * 刷新 Token
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return apiClient.post('/auth/refresh-token', data)
  },

  /**
   * 获取当前用户信息
   */
  getMe: async (): Promise<MeResponse> => {
    return apiClient.get('/auth/me')
  },

  /**
   * 登出
   */
  logout: async (): Promise<void> => {
    return apiClient.post('/auth/logout')
  },
}