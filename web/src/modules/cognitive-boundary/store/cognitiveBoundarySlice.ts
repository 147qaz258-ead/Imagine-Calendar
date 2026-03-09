/**
 * 摸索认知边界状态管理
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { QuestionLevel } from '@/data/cognitive-questions'
import type {
  CognitiveBoundaryState,
  QuestionAssessment,
  CognitiveBoundaryAssessment,
} from '../types'
import { cognitiveBoundaryApi } from '../services/cognitiveBoundaryApi'

// 初始状态
const initialState: CognitiveBoundaryState = {
  currentAssessment: null,
  assessments: [],
  loading: false,
  submitting: false,
  error: null,
}

// 获取评估
export const fetchAssessment = createAsyncThunk(
  'cognitiveBoundary/fetchAssessment',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cognitiveBoundaryApi.getAssessment()
      if (!response.success) {
        return rejectWithValue(response.message || '获取评估失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取评估失败')
    }
  }
)

// 提交评估
export const submitAssessments = createAsyncThunk(
  'cognitiveBoundary/submitAssessments',
  async (assessments: QuestionAssessment[], { rejectWithValue }) => {
    try {
      const response = await cognitiveBoundaryApi.submitAssessment({ assessments })
      if (!response.success) {
        return rejectWithValue(response.message || '提交评估失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '提交评估失败')
    }
  }
)

// 更新单个问题评估
export const updateQuestionLevel = createAsyncThunk(
  'cognitiveBoundary/updateQuestionLevel',
  async ({ questionId, level }: { questionId: string; level: QuestionLevel }, { rejectWithValue }) => {
    try {
      const response = await cognitiveBoundaryApi.updateQuestionAssessment(questionId, level)
      if (!response.success) {
        return rejectWithValue(response.message || '更新评估失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '更新评估失败')
    }
  }
)

// 获取评估历史
export const fetchAssessmentHistory = createAsyncThunk(
  'cognitiveBoundary/fetchAssessmentHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cognitiveBoundaryApi.getAssessmentHistory()
      if (!response.success) {
        return rejectWithValue(response.message || '获取历史记录失败')
      }
      return response
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取历史记录失败')
    }
  }
)

// Slice
const cognitiveBoundarySlice = createSlice({
  name: 'cognitiveBoundary',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    // 重置状态
    resetState: (state) => {
      state.currentAssessment = null
      state.assessments = []
      state.loading = false
      state.submitting = false
      state.error = null
    },
    // 本地更新问题等级（乐观更新）
    localUpdateLevel: (state, action: PayloadAction<{ questionId: string; level: QuestionLevel }>) => {
      if (state.currentAssessment) {
        const { questionId, level } = action.payload
        let found = false

        // 遍历所有维度找到对应问题并更新
        for (const dim of state.currentAssessment.dimensions) {
          const assessment = dim.assessments.find((a) => a.questionId === questionId)
          if (assessment) {
            assessment.level = level
            assessment.assessedAt = new Date().toISOString()
            found = true
            break
          }
        }

        // 如果没找到，可能需要添加新的评估记录
        if (!found) {
          // 这里简化处理，实际可能需要更复杂的逻辑
        }
      }
    },
  },
  extraReducers: (builder) => {
    // 获取评估
    builder
      .addCase(fetchAssessment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAssessment.fulfilled, (state, action) => {
        state.loading = false
        state.currentAssessment = action.payload.data
      })
      .addCase(fetchAssessment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 提交评估
    builder
      .addCase(submitAssessments.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(submitAssessments.fulfilled, (state, action) => {
        state.submitting = false
        state.currentAssessment = action.payload.data
      })
      .addCase(submitAssessments.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload as string
      })

    // 更新单个问题评估
    builder
      .addCase(updateQuestionLevel.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(updateQuestionLevel.fulfilled, (state, action) => {
        state.submitting = false
        state.currentAssessment = action.payload.data
      })
      .addCase(updateQuestionLevel.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload as string
      })

    // 获取评估历史
    builder
      .addCase(fetchAssessmentHistory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAssessmentHistory.fulfilled, (state, action) => {
        state.loading = false
        state.assessments = action.payload.data
      })
      .addCase(fetchAssessmentHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, resetState, localUpdateLevel } = cognitiveBoundarySlice.actions
export default cognitiveBoundarySlice.reducer