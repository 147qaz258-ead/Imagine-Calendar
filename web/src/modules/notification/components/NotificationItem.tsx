/**
 * 通知项组件
 */
import React from 'react'
import type { Notification, NotificationType } from '../types'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  isMarkingAsRead: boolean
}

// 通知类型配置
const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { label: string; bgColor: string; iconColor: string }> = {
  event_reminder: {
    label: '活动提醒',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  roundtable_invite: {
    label: '圆桌邀请',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  application_update: {
    label: '申请更新',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  system: {
    label: '系统通知',
    bgColor: 'bg-gray-50',
    iconColor: 'text-gray-500',
  },
}

// 通知图标
const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
  const config = NOTIFICATION_TYPE_CONFIG[type]

  const icons: Record<NotificationType, React.ReactNode> = {
    event_reminder: (
      <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    roundtable_invite: (
      <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    application_update: (
      <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    system: (
      <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return <>{icons[type]}</>
}

// 格式化时间
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }

  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }

  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }

  // 其他显示日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  isMarkingAsRead,
}) => {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type]

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all ${
        notification.read
          ? 'bg-white border-gray-200'
          : `${config.bgColor} border-gray-300`
      }`}
    >
      {/* 未读标记 */}
      {!notification.read && (
        <div className="absolute top-4 left-0 w-1 h-8 bg-blue-500 rounded-r" />
      )}

      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <NotificationIcon type={notification.type} />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${config.bgColor} ${config.iconColor}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTime(notification.createdAt)}
            </span>
          </div>

          <h4 className={`mt-1 text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
            {notification.title}
          </h4>

          <p className={`mt-1 text-sm ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
            {notification.content}
          </p>

          {/* 标记已读按钮 */}
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              disabled={isMarkingAsRead}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isMarkingAsRead ? '标记中...' : '标记已读'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationItem