/**
 * 认知图谱状态管理
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type {
  CognitiveState,
  CognitiveMap,
  UpdateDimensionRequest,
  CognitiveHistoryQuery,
} from '../types'
import { cognitiveApi } from '../services/cognitiveApi'

// 初始状态
const initialState: CognitiveState = {
  cognitiveMap: null,
  history: [],
  trends: [],
  loading: false,
  error: null,
}

// 获取认知图谱
export const fetchCognitiveMap = createAsyncThunk(
  'cognitive/fetchCognitiveMap',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await cognitiveApi.getCognitiveMap(userId)
      if (!response.success) {
        return rejectWithValue(response.message || '获取认知图谱失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取认知图谱失败')
    }
  }
)

// 更新认知维度
export const updateCognitiveDimension = createAsyncThunk(
  'cognitive/updateDimension',
  async (
    { userId, data }: { userId: string; data: UpdateDimensionRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await cognitiveApi.updateDimension(userId, data)
      if (!response.success) {
        return rejectWithValue(response.message || '更新维度失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '更新维度失败')
    }
  }
)

// 获取认知历史
export const fetchCognitiveHistory = createAsyncThunk(
  'cognitive/fetchCognitiveHistory',
  async (
    { userId, query }: { userId: string; query?: CognitiveHistoryQuery },
    { rejectWithValue }
  ) => {
    try {
      const response = await cognitiveApi.getCognitiveHistory(userId, query)
      if (!response.success) {
        return rejectWithValue(response.message || '获取认知历史失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取认知历史失败')
    }
  }
)

// Slice
const cognitiveSlice = createSlice({
  name: 'cognitive',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    // 设置认知图谱
    setCognitiveMap: (state, action: PayloadAction<CognitiveMap | null>) => {
      state.cognitiveMap = action.payload
    },
  },
  extraReducers: (builder) => {
    // 获取认知图谱
    builder
      .addCase(fetchCognitiveMap.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCognitiveMap.fulfilled, (state, action) => {
        state.loading = false
        state.cognitiveMap = action.payload
      })
      .addCase(fetchCognitiveMap.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 更新认知维度
    builder
      .addCase(updateCognitiveDimension.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCognitiveDimension.fulfilled, (state, action) => {
        state.loading = false
        state.cognitiveMap = action.payload
      })
      .addCase(updateCognitiveDimension.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取认知历史
    builder
      .addCase(fetchCognitiveHistory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCognitiveHistory.fulfilled, (state, action) => {
        state.loading = false
        state.history = action.payload.history
        state.trends = action.payload.trend
      })
      .addCase(fetchCognitiveHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, setCognitiveMap } = cognitiveSlice.actions
export default cognitiveSlice.reducer