/**
 * 认证模块导出
 */
// 组件
export { LoginPage } from './components/LoginPage'
export { PhoneInput } from './components/PhoneInput'
export { VerifyCodeInput } from './components/VerifyCodeInput'

// 服务
export { authApi } from './services/authApi'

// Store
export { default as authReducer } from './store/authSlice'
export {
  login,
  sendVerifyCode,
  fetchCurrentUser,
  refreshAuth,
  clearError,
  setUser,
  logout,
} from './store/authSlice'

// 类型
export type {
  User,
  UserPreferences,
  SendCodeRequest,
  SendCodeResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MeResponse,
  AuthState,
} from './types'
export { UserStatus } from './types'