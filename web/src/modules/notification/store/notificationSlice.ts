/**
 * 通知状态管理
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { NotificationState, Notification, GetNotificationsQuery } from '../types'
import { notificationApi } from '../services/notificationApi'

// 初始状态
const initialState: NotificationState = {
  notifications: [],
  total: 0,
  unreadCount: 0,
  loading: false,
  error: null,
  markAsReadLoading: null,
  markAllAsReadLoading: false,
}

// 获取通知列表
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (query: GetNotificationsQuery | undefined, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotifications(query)
      if (!response.success) {
        return rejectWithValue(response.message || '获取通知列表失败')
      }
      return response.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取通知列表失败')
    }
  }
)

// 获取未读数量
export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getUnreadCount()
      if (!response.success) {
        return rejectWithValue(response.message || '获取未读数量失败')
      }
      return response.data.count
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '获取未读数量失败')
    }
  }
)

// 标记单条已读
export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAsRead(id)
      if (!response.success) {
        return rejectWithValue(response.message || '标记已读失败')
      }
      return { id, data: response.data }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '标记已读失败')
    }
  }
)

// 标记全部已读
export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAllAsRead()
      if (!response.success) {
        return rejectWithValue(response.message || '标记全部已读失败')
      }
      return response.data.updatedCount
    } catch (error: unknown) {
      const err = error as { message?: string }
      return rejectWithValue(err.message || '标记全部已读失败')
    }
  }
)

// Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    // 重置状态
    resetNotifications: (state) => {
      state.notifications = []
      state.total = 0
      state.unreadCount = 0
      state.loading = false
      state.error = null
      state.markAsReadLoading = null
      state.markAllAsReadLoading = false
    },
    // 添加通知（用于实时推送）
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
      state.total += 1
      if (!action.payload.read) {
        state.unreadCount += 1
      }
    },
  },
  extraReducers: (builder) => {
    // 获取通知列表
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.notifications = action.payload.notifications
        state.total = action.payload.total
        state.unreadCount = action.payload.unreadCount
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取未读数量
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })

    // 标记单条已读
    builder
      .addCase(markAsRead.pending, (state, action) => {
        state.markAsReadLoading = action.meta.arg
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.markAsReadLoading = null
        const { id, data } = action.payload
        const notification = state.notifications.find((n) => n.id === id)
        if (notification) {
          notification.read = data.read
          notification.readAt = data.readAt
        }
        // 更新未读数量
        if (state.unreadCount > 0) {
          state.unreadCount -= 1
        }
      })
      .addCase(markAsRead.rejected, (state) => {
        state.markAsReadLoading = null
      })

    // 标记全部已读
    builder
      .addCase(markAllAsRead.pending, (state) => {
        state.markAllAsReadLoading = true
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.markAllAsReadLoading = false
        state.unreadCount = 0
        state.notifications = state.notifications.map((n) => ({
          ...n,
          read: true,
          readAt: n.readAt || new Date().toISOString(),
        }))
      })
      .addCase(markAllAsRead.rejected, (state) => {
        state.markAllAsReadLoading = false
      })
  },
})

export const { clearError, resetNotifications, addNotification } = notificationSlice.actions
export default notificationSlice.reducer