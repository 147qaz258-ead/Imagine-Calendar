/**
 * 日历状态管理 Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { CalendarEvent, Event, CompanyType, EventsByDate } from '../types'
import { calendarApi } from '../services/calendarApi'
import { groupEventsByDate } from '../utils/dateUtils'

// 状态接口
export interface CalendarState {
  // 当前视图年月
  currentYear: number
  currentMonth: number
  // 事件数据
  events: CalendarEvent[]
  eventsByDate: EventsByDate
  // 选中事件
  selectedEvent: Event | null
  // 关注的事件ID集合
  followedEventIds: string[]
  // 加载状态
  loading: boolean
  eventDetailLoading: boolean
  // 错误信息
  error: string | null
}

// 初始状态
const now = new Date()
const initialState: CalendarState = {
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth() + 1,
  events: [],
  eventsByDate: {},
  selectedEvent: null,
  followedEventIds: [],
  loading: false,
  eventDetailLoading: false,
  error: null,
}

// 异步 Thunk：获取日历事件
export const fetchCalendarEvents = createAsyncThunk(
  'calendar/fetchEvents',
  async (
    params: { year: number; month: number; companyType?: CompanyType },
    { rejectWithValue }
  ) => {
    try {
      const response = await calendarApi.getCalendarEvents(params)
      if (!response.success) {
        throw new Error('获取日历事件失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取日历事件失败')
    }
  }
)

// 异步 Thunk：获取事件详情
export const fetchEventDetail = createAsyncThunk(
  'calendar/fetchEventDetail',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await calendarApi.getEventDetail(eventId)
      if (!response.success) {
        throw new Error('获取事件详情失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取事件详情失败')
    }
  }
)

// 异步 Thunk：关注事件
export const followEvent = createAsyncThunk(
  'calendar/followEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await calendarApi.followEvent(eventId)
      if (!response.success) {
        throw new Error('关注失败')
      }
      return { eventId, ...response.data }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '关注失败')
    }
  }
)

// 异步 Thunk：取消关注事件
export const unfollowEvent = createAsyncThunk(
  'calendar/unfollowEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await calendarApi.unfollowEvent(eventId)
      if (!response.success) {
        throw new Error('取消关注失败')
      }
      return { eventId, ...response.data }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '取消关注失败')
    }
  }
)

// Slice
const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    // 切换月份
    setMonth: (state, action: PayloadAction<{ year: number; month: number }>) => {
      state.currentYear = action.payload.year
      state.currentMonth = action.payload.month
    },
    // 上一月
    prevMonth: (state) => {
      if (state.currentMonth === 1) {
        state.currentYear -= 1
        state.currentMonth = 12
      } else {
        state.currentMonth -= 1
      }
    },
    // 下一月
    nextMonth: (state) => {
      if (state.currentMonth === 12) {
        state.currentYear += 1
        state.currentMonth = 1
      } else {
        state.currentMonth += 1
      }
    },
    // 回到今天
    goToToday: (state) => {
      const today = new Date()
      state.currentYear = today.getFullYear()
      state.currentMonth = today.getMonth() + 1
    },
    // 清除选中事件
    clearSelectedEvent: (state) => {
      state.selectedEvent = null
    },
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // 获取日历事件
    builder
      .addCase(fetchCalendarEvents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCalendarEvents.fulfilled, (state, action) => {
        state.loading = false
        state.events = action.payload.events
        state.eventsByDate = groupEventsByDate(action.payload.events)
      })
      .addCase(fetchCalendarEvents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取事件详情
    builder
      .addCase(fetchEventDetail.pending, (state) => {
        state.eventDetailLoading = true
        state.error = null
      })
      .addCase(fetchEventDetail.fulfilled, (state, action) => {
        state.eventDetailLoading = false
        state.selectedEvent = action.payload
      })
      .addCase(fetchEventDetail.rejected, (state, action) => {
        state.eventDetailLoading = false
        state.error = action.payload as string
      })

    // 关注事件
    builder
      .addCase(followEvent.fulfilled, (state, action) => {
        if (action.payload.followed) {
          state.followedEventIds.push(action.payload.eventId)
        }
      })
      .addCase(followEvent.rejected, (state, action) => {
        state.error = action.payload as string
      })

    // 取消关注事件
    builder
      .addCase(unfollowEvent.fulfilled, (state, action) => {
        if (!action.payload.followed) {
          state.followedEventIds = state.followedEventIds.filter(
            (id) => id !== action.payload.eventId
          )
        }
      })
      .addCase(unfollowEvent.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { setMonth, prevMonth, nextMonth, goToToday, clearSelectedEvent, clearError } =
  calendarSlice.actions

export default calendarSlice.reducer