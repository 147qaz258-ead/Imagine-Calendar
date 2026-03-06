/**
 * 通知列表组件
 */
import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchNotifications, markAsRead, markAllAsRead } from '../store/notificationSlice'
import type { NotificationType } from '../types'
import { NotificationItem } from './NotificationItem'

interface NotificationListProps {
  filterType?: NotificationType
}

// 通知类型筛选选项
const TYPE_OPTIONS: { value: NotificationType | ''; label: string }[] = [
  { value: '', label: '全部类型' },
  { value: 'event_reminder', label: '活动提醒' },
  { value: 'roundtable_invite', label: '圆桌邀请' },
  { value: 'application_update', label: '申请更新' },
  { value: 'system', label: '系统通知' },
]

export const NotificationList: React.FC<NotificationListProps> = ({ filterType }) => {
  const dispatch = useAppDispatch()
  const {
    notifications,
    total,
    unreadCount,
    loading,
    error,
    markAsReadLoading,
    markAllAsReadLoading,
  } = useAppSelector((state) => state.notification)

  const [selectedType, setSelectedType] = React.useState<NotificationType | ''>(filterType || '')

  // 加载通知列表
  useEffect(() => {
    dispatch(fetchNotifications({
      type: selectedType || undefined,
      page: 1,
      pageSize: 50,
    }))
  }, [dispatch, selectedType])

  // 标记单条已读
  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id))
  }

  // 标记全部已读
  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllAsRead())
    }
  }

  // 加载中
  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    )
  }

  // 错误
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-medium">加载失败</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={() => dispatch(fetchNotifications({ type: selectedType || undefined, page: 1, pageSize: 50 }))}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* 类型筛选 */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as NotificationType | '')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* 未读数量和全部已读 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadLoading}
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:text-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
            >
              {markAllAsReadLoading ? '标记中...' : '全部标记已读'}
            </button>
          )}
        </div>
      </div>

      {/* 通知列表 */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="mt-3">暂无通知</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                isMarkingAsRead={markAsReadLoading === notification.id}
              />
            ))}
          </div>

          {/* 统计 */}
          {total > 0 && (
            <div className="text-center text-sm text-gray-400 pt-4">
              共 {total} 条通知
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NotificationList