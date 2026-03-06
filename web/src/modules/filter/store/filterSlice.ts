/**
 * 筛选状态管理 Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type {
  UserPreferences,
  FilterOption,
  FilterEventsRequest,
  FilteredEvent,
  DimensionMatch,
} from '../types'
import { filterApi } from '../services/filterApi'

// 状态接口
export interface FilterState {
  // 筛选选项（13维度选项数据）
  filterOptions: {
    locations: FilterOption[]
    selfPositioning: FilterOption[]
    developmentDirection: FilterOption[]
    industries: FilterOption[]
    platformTypes: FilterOption[]
    companyScales: FilterOption[]
    companyCulture: FilterOption[]
    leadershipStyle: FilterOption[]
    trainingPrograms: FilterOption[]
    overtimePreference: FilterOption[]
    holidayPolicy: FilterOption[]
    medicalBenefits: FilterOption[]
    maternityBenefits: FilterOption[]
  }
  // 当前筛选条件
  filters: Partial<UserPreferences>
  // 已应用的筛选条件
  appliedFilters: Partial<UserPreferences>
  // 筛选结果
  filteredEvents: FilteredEvent[]
  totalResults: number
  // 当前页
  currentPage: number
  pageSize: number
  // 匹配度分析结果
  matchingResult: {
    overallScore: number
    dimensions: DimensionMatch[]
    suggestions: string[]
  } | null
  // 状态标记
  loading: boolean
  optionsLoading: boolean
  hasChanges: boolean
  // 面板状态
  isPanelOpen: boolean
  // 展开的维度
  expandedDimensions: string[]
  // 错误信息
  error: string | null
}

// 初始状态
const initialState: FilterState = {
  filterOptions: {
    locations: [],
    selfPositioning: [],
    developmentDirection: [],
    industries: [],
    platformTypes: [],
    companyScales: [],
    companyCulture: [],
    leadershipStyle: [],
    trainingPrograms: [],
    overtimePreference: [],
    holidayPolicy: [],
    medicalBenefits: [],
    maternityBenefits: [],
  },
  filters: {},
  appliedFilters: {},
  filteredEvents: [],
  totalResults: 0,
  currentPage: 1,
  pageSize: 20,
  matchingResult: null,
  loading: false,
  optionsLoading: false,
  hasChanges: false,
  isPanelOpen: false,
  expandedDimensions: [],
  error: null,
}

// 异步 Thunk：获取筛选选项
export const fetchFilterOptions = createAsyncThunk(
  'filter/fetchOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await filterApi.getFilterOptions()
      if (!response.success) {
        throw new Error('获取筛选选项失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取筛选选项失败')
    }
  }
)

// 异步 Thunk：筛选事件
export const filterEvents = createAsyncThunk(
  'filter/filterEvents',
  async (params: { preferences: Partial<UserPreferences>; page?: number }, { rejectWithValue }) => {
    try {
      const request: FilterEventsRequest = {
        preferences: params.preferences,
        page: params.page || 1,
        pageSize: 20,
      }
      const response = await filterApi.filterEvents(request)
      if (!response.success) {
        throw new Error('筛选事件失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '筛选事件失败')
    }
  }
)

// 异步 Thunk：获取匹配度分析
export const fetchMatchingAnalyze = createAsyncThunk(
  'filter/fetchMatchingAnalyze',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await filterApi.getMatchingAnalyze({ eventId })
      if (!response.success) {
        throw new Error('获取匹配度分析失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取匹配度分析失败')
    }
  }
)

// Slice
const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    // 切换面板显示
    togglePanel: (state) => {
      state.isPanelOpen = !state.isPanelOpen
    },

    // 打开面板
    openPanel: (state) => {
      state.isPanelOpen = true
    },

    // 关闭面板
    closePanel: (state) => {
      state.isPanelOpen = false
    },

    // 更新筛选条件
    updateFilter: (state, action: PayloadAction<{ key: keyof UserPreferences; values: string[] }>) => {
      const { key, values } = action.payload
      state.filters[key] = values
      state.hasChanges = true
    },

    // 批量更新筛选条件
    updateFilters: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.hasChanges = true
    },

    // 应用筛选（将当前筛选条件应用到 appliedFilters）
    applyFilters: (state) => {
      state.appliedFilters = { ...state.filters }
      state.hasChanges = false
    },

    // 清空筛选条件
    clearFilters: (state) => {
      state.filters = {}
      state.appliedFilters = {}
      state.filteredEvents = []
      state.totalResults = 0
      state.hasChanges = false
    },

    // 重置为已应用的筛选
    resetFilters: (state) => {
      state.filters = { ...state.appliedFilters }
      state.hasChanges = false
    },

    // 切换维度展开状态
    toggleDimension: (state, action: PayloadAction<string>) => {
      const dimension = action.payload
      const index = state.expandedDimensions.indexOf(dimension)
      if (index > -1) {
        state.expandedDimensions.splice(index, 1)
      } else {
        state.expandedDimensions.push(dimension)
      }
    },

    // 展开所有维度
    expandAllDimensions: (state) => {
      state.expandedDimensions = [
        'locations',
        'selfPositioning',
        'developmentDirection',
        'industries',
        'platformTypes',
        'companyScales',
        'companyCulture',
        'leadershipStyle',
        'trainingPrograms',
        'overtimePreference',
        'holidayPolicy',
        'medicalBenefits',
        'maternityBenefits',
      ]
    },

    // 收起所有维度
    collapseAllDimensions: (state) => {
      state.expandedDimensions = []
    },

    // 设置页码
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },

    // 清除匹配结果
    clearMatchingResult: (state) => {
      state.matchingResult = null
    },

    // 清除错误
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // 获取筛选选项
    builder
      .addCase(fetchFilterOptions.pending, (state) => {
        state.optionsLoading = true
        state.error = null
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.optionsLoading = false
        state.filterOptions = action.payload
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.optionsLoading = false
        state.error = action.payload as string
      })

    // 筛选事件
    builder
      .addCase(filterEvents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(filterEvents.fulfilled, (state, action) => {
        state.loading = false
        state.filteredEvents = action.payload.events
        state.totalResults = action.payload.total
        state.currentPage = action.payload.page
      })
      .addCase(filterEvents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取匹配度分析
    builder
      .addCase(fetchMatchingAnalyze.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMatchingAnalyze.fulfilled, (state, action) => {
        state.loading = false
        state.matchingResult = {
          overallScore: action.payload.overallScore,
          dimensions: action.payload.dimensions,
          suggestions: action.payload.suggestions,
        }
      })
      .addCase(fetchMatchingAnalyze.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  togglePanel,
  openPanel,
  closePanel,
  updateFilter,
  updateFilters,
  applyFilters,
  clearFilters,
  resetFilters,
  toggleDimension,
  expandAllDimensions,
  collapseAllDimensions,
  setPage,
  clearMatchingResult,
  clearError,
} = filterSlice.actions

export default filterSlice.reducer