/**
 * 认证状态管理
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, User, LoginRequest, SendCodeRequest, PasswordLoginRequest, RegisterRequest } from '../types'
import { authApi } from '../services/authApi'

// 初始状态
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isNewUser: false,
  loading: false,
  error: null,
}

// 发送验证码
export const sendVerifyCode = createAsyncThunk(
  'auth/sendVerifyCode',
  async (data: SendCodeRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.sendCode(data)
      if (!response.success) {
        return rejectWithValue(response.message)
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '发送验证码失败')
    }
  }
)

// 登录
export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(data)
      if (!response.success) {
        return rejectWithValue('登录失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '登录失败')
    }
  }
)

// 密码登录
export const loginWithPassword = createAsyncThunk(
  'auth/loginWithPassword',
  async (data: PasswordLoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.loginWithPassword(data)
      if (!response.success) {
        return rejectWithValue('登录失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '登录失败')
    }
  }
)

// 注册
export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data)
      if (!response.success) {
        return rejectWithValue('注册失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '注册失败')
    }
  }
)

// 获取当前用户
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getMe()
      if (!response.success) {
        return rejectWithValue('获取用户信息失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取用户信息失败')
    }
  }
)

// 刷新Token
export const refreshAuth = createAsyncThunk(
  'auth/refreshAuth',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authApi.refreshToken({ token })
      if (!response.success) {
        return rejectWithValue('刷新Token失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '刷新Token失败')
    }
  }
)

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    // 设置用户
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    // 登出
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isNewUser = false
      state.loading = false
      state.error = null
      localStorage.removeItem('token')
    },
  },
  extraReducers: (builder) => {
    // 发送验证码
    builder
      .addCase(sendVerifyCode.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sendVerifyCode.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(sendVerifyCode.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 登录
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.data.user
        state.token = action.payload.data.token
        state.isAuthenticated = true
        state.isNewUser = action.payload.data.isNewUser
        // 存储token到localStorage
        localStorage.setItem('token', action.payload.data.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 密码登录
    builder
      .addCase(loginWithPassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginWithPassword.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.data.user
        state.token = action.payload.data.token
        state.isAuthenticated = true
        state.isNewUser = false
        localStorage.setItem('token', action.payload.data.token)
      })
      .addCase(loginWithPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 注册
    builder
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.data.user
        state.token = action.payload.data.token
        state.isAuthenticated = true
        state.isNewUser = true
        localStorage.setItem('token', action.payload.data.token)
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取当前用户
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.data
        state.isAuthenticated = true
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
        state.token = null
        localStorage.removeItem('token')
      })

    // 刷新Token
    builder
      .addCase(refreshAuth.fulfilled, (state, action) => {
        state.token = action.payload.data.token
        localStorage.setItem('token', action.payload.data.token)
      })
  },
})

export const { clearError, setUser, logout } = authSlice.actions
export default authSlice.reducer