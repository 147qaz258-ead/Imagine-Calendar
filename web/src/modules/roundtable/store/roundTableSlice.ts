/**
 * 圆桌讨论状态管理 Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { RoundTable, MyRoundTables, RoundTableQuestion } from '../types'
import { RoundTableStatus } from '../types'
import { roundTableApi } from '../services/roundTableApi'

// 状态接口
export interface RoundTableState {
  // 我的圆桌分组
  myRoundTables: MyRoundTables
  // 当前圆桌详情
  currentRoundTable: RoundTable | null
  // 问题清单
  questions: RoundTableQuestion[]
  // 报名状态
  applicationStatus: {
    applicationId: string | null
    status: 'idle' | 'pending' | 'matched'
    estimatedWaitTime: number | null
  }
  // 加载状态
  loading: boolean
  detailLoading: boolean
  applying: boolean
  // 错误信息
  error: string | null
}

// 初始状态
const initialState: RoundTableState = {
  myRoundTables: {
    matching: [],
    upcoming: [],
    completed: [],
  },
  currentRoundTable: null,
  questions: [],
  applicationStatus: {
    applicationId: null,
    status: 'idle',
    estimatedWaitTime: null,
  },
  loading: false,
  detailLoading: false,
  applying: false,
  error: null,
}

// 异步 Thunk：获取圆桌列表
export const fetchRoundTables = createAsyncThunk(
  'roundTable/fetchList',
  async (params: { status?: RoundTableStatus; page?: number; pageSize?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await roundTableApi.getRoundTables(params)
      if (!response.success) {
        throw new Error('获取圆桌列表失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取圆桌列表失败')
    }
  }
)

// 异步 Thunk：获取圆桌详情
export const fetchRoundTableDetail = createAsyncThunk(
  'roundTable/fetchDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await roundTableApi.getDetail(id)
      if (!response.success) {
        throw new Error('获取圆桌详情失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取圆桌详情失败')
    }
  }
)

// 异步 Thunk：报名圆桌
export const applyRoundTable = createAsyncThunk(
  'roundTable/apply',
  async (
    data: { preferredTimes: string[]; topics?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await roundTableApi.apply(data)
      if (!response.success) {
        throw new Error('报名失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '报名失败')
    }
  }
)

// 异步 Thunk：加入圆桌
export const joinRoundTable = createAsyncThunk(
  'roundTable/join',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await roundTableApi.join(id)
      if (!response.success) {
        throw new Error('加入圆桌失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '加入圆桌失败')
    }
  }
)

// 异步 Thunk：离开圆桌
export const leaveRoundTable = createAsyncThunk(
  'roundTable/leave',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await roundTableApi.leave(id)
      if (!response.success) {
        throw new Error('离开圆桌失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '离开圆桌失败')
    }
  }
)

// 异步 Thunk：获取问题清单
export const fetchQuestions = createAsyncThunk(
  'roundTable/fetchQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roundTableApi.getQuestions()
      if (!response.success) {
        throw new Error('获取问题清单失败')
      }
      return response.data.questions
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取问题清单失败')
    }
  }
)

// 辅助函数：分类圆桌
function categorizeRoundTables(roundTables: RoundTable[]): MyRoundTables {
  const now = new Date()

  return {
    matching: roundTables.filter(rt => rt.status === RoundTableStatus.MATCHING),
    upcoming: roundTables.filter(rt =>
      (rt.status === RoundTableStatus.READY || rt.status === RoundTableStatus.IN_PROGRESS) &&
      new Date(rt.scheduledAt) > now
    ),
    completed: roundTables.filter(rt =>
      rt.status === RoundTableStatus.COMPLETED || rt.status === RoundTableStatus.CANCELLED
    ),
  }
}

// Slice
const roundTableSlice = createSlice({
  name: 'roundTable',
  initialState,
  reducers: {
    // 清除当前圆桌
    clearCurrentRoundTable: (state) => {
      state.currentRoundTable = null
    },
    // 重置报名状态
    resetApplicationStatus: (state) => {
      state.applicationStatus = {
        applicationId: null,
        status: 'idle',
        estimatedWaitTime: null,
      }
    },
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    // 更新圆桌列表（手动分类）
    setMyRoundTables: (state, action: PayloadAction<RoundTable[]>) => {
      state.myRoundTables = categorizeRoundTables(action.payload)
    },
  },
  extraReducers: (builder) => {
    // 获取圆桌列表
    builder
      .addCase(fetchRoundTables.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRoundTables.fulfilled, (state, action) => {
        state.loading = false
        state.myRoundTables = categorizeRoundTables(action.payload.roundTables)
      })
      .addCase(fetchRoundTables.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取圆桌详情
    builder
      .addCase(fetchRoundTableDetail.pending, (state) => {
        state.detailLoading = true
        state.error = null
      })
      .addCase(fetchRoundTableDetail.fulfilled, (state, action) => {
        state.detailLoading = false
        state.currentRoundTable = action.payload
      })
      .addCase(fetchRoundTableDetail.rejected, (state, action) => {
        state.detailLoading = false
        state.error = action.payload as string
      })

    // 报名圆桌
    builder
      .addCase(applyRoundTable.pending, (state) => {
        state.applying = true
        state.error = null
      })
      .addCase(applyRoundTable.fulfilled, (state, action) => {
        state.applying = false
        state.applicationStatus = {
          applicationId: action.payload.applicationId,
          status: action.payload.status,
          estimatedWaitTime: action.payload.estimatedWaitTime || null,
        }
      })
      .addCase(applyRoundTable.rejected, (state, action) => {
        state.applying = false
        state.error = action.payload as string
      })

    // 加入圆桌
    builder
      .addCase(joinRoundTable.fulfilled, (state, action) => {
        state.currentRoundTable = action.payload.roundTable
      })
      .addCase(joinRoundTable.rejected, (state, action) => {
        state.error = action.payload as string
      })

    // 离开圆桌
    builder
      .addCase(leaveRoundTable.fulfilled, (state, action) => {
        if (action.payload.left && action.payload.roundTable) {
          // 更新圆桌信息
          state.currentRoundTable = action.payload.roundTable
        } else if (action.payload.left) {
          // 已离开，清除当前圆桌
          state.currentRoundTable = null
        }
      })
      .addCase(leaveRoundTable.rejected, (state, action) => {
        state.error = action.payload as string
      })

    // 获取问题清单
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false
        state.questions = action.payload
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearCurrentRoundTable, resetApplicationStatus, clearError, setMyRoundTables } =
  roundTableSlice.actions

export default roundTableSlice.reducer