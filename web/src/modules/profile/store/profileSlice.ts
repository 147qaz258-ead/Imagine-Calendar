/**
 * 用户画像状态管理
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { ProfileState, User, UpdateProfileRequest, UpdatePreferencesRequest } from '../types'
import { profileApi } from '../services/profileApi'

// 初始状态
const initialState: ProfileState = {
  user: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null,
}

// 获取用户画像
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await profileApi.getProfile(userId)
      if (!response.success) {
        return rejectWithValue(response.message || '获取用户画像失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取用户画像失败')
    }
  }
)

// 更新用户画像
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ userId, data }: { userId: string; data: UpdateProfileRequest }, { rejectWithValue }) => {
    try {
      const response = await profileApi.updateProfile(userId, data)
      if (!response.success) {
        return rejectWithValue(response.message || '更新用户画像失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '更新用户画像失败')
    }
  }
)

// 更新用户偏好
export const updatePreferences = createAsyncThunk(
  'profile/updatePreferences',
  async ({ userId, data }: { userId: string; data: UpdatePreferencesRequest }, { rejectWithValue }) => {
    try {
      const response = await profileApi.updatePreferences(userId, data)
      if (!response.success) {
        return rejectWithValue(response.message || '更新偏好失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '更新偏好失败')
    }
  }
)

// Slice
const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    clearUpdateError: (state) => {
      state.updateError = null
    },
    // 设置用户
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    // 获取用户画像
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 更新用户画像
    builder
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true
        state.updateError = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false
        state.user = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false
        state.updateError = action.payload as string
      })

    // 更新用户偏好
    builder
      .addCase(updatePreferences.pending, (state) => {
        state.updateLoading = true
        state.updateError = null
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.updateLoading = false
        if (state.user) {
          state.user.preferences = action.payload.preferences
        }
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.updateLoading = false
        state.updateError = action.payload as string
      })
  },
})

export const { clearError, clearUpdateError, setUser } = profileSlice.actions
export default profileSlice.reducer