/**
 * 消息列表组件
 * 显示聊天消息列表，支持自动滚动到底部
 */
import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../types'
import { format } from 'date-fns'

interface MessageListProps {
  messages: ChatMessage[]
  currentUserId?: string
}

/**
 * 格式化时间
 */
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return format(date, 'HH:mm')
  } catch {
    return ''
  }
}

/**
 * 单条消息组件
 */
function MessageItem({
  message,
  isOwn,
}: {
  message: ChatMessage
  isOwn: boolean
}) {
  // 系统消息
  if (message.isSystem || message.userId === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}>
        {/* 头像 */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${
            isOwn ? 'from-blue-400 to-blue-600 ml-2' : 'from-gray-300 to-gray-400 mr-2'
          } flex items-center justify-center text-white text-sm font-medium`}
        >
          {message.nickname?.charAt(0) || '?'}
        </div>

        {/* 消息内容 */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* 昵称和时间 */}
          <div
            className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <span className="text-xs text-gray-500">{message.nickname}</span>
            <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
          </div>

          {/* 消息气泡 */}
          <div
            className={`px-3 py-2 rounded-lg ${
              isOwn
                ? 'bg-blue-500 text-white rounded-tr-none'
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}
          >
            {message.contentType === 'image' ? (
              <img
                src={message.content}
                alt="图片消息"
                className="max-w-full rounded max-h-60 object-contain"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 消息列表组件
 */
export function MessageList({ messages, currentUserId }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  // 检测用户是否在滚动
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = list
      // 如果用户滚动到接近底部，保持自动滚动
      shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100
    }

    list.addEventListener('scroll', handleScroll)
    return () => list.removeEventListener('scroll', handleScroll)
  }, [])

  // 新消息时自动滚动到底部
  useEffect(() => {
    if (shouldAutoScrollRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-sm">暂无消息</p>
          <p className="text-xs mt-1">发送第一条消息开始讨论吧</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.userId === currentUserId}
        />
      ))}
    </div>
  )
}

export default MessageList