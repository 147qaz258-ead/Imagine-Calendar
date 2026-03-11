/**
 * 聊天室组件
 * 整合消息列表和输入框，提供完整的聊天功能
 */
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useSocket } from '../hooks/useSocket'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { resetChat, setParticipants } from '../store/chatSlice'
import type { ChatMessage, Participant } from '../types'

interface ChatRoomProps {
  roundTableId: string
  wsEndpoint?: string
  participants?: Participant[]
  initialMessages?: ChatMessage[]
  onLeave?: () => void
}

/**
 * 连接状态指示器
 */
function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      <span className="text-xs text-gray-500">
        {isConnected ? '已连接' : '未连接'}
      </span>
    </div>
  )
}

/**
 * 参与者列表
 */
function ParticipantAvatars({ participants }: { participants: Participant[] }) {
  const displayParticipants = participants.slice(0, 6)
  const remaining = participants.length - 6

  return (
    <div className="flex items-center gap-1">
      {displayParticipants.map((p) => (
        <div
          key={p.userId}
          className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium"
          title={p.nickname}
        >
          {p.nickname?.charAt(0) || '?'}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
          +{remaining}
        </div>
      )}
    </div>
  )
}

/**
 * 聊天室组件
 */
export function ChatRoom({
  roundTableId,
  participants: initialParticipants = [],
  initialMessages = [],
  onLeave,
}: ChatRoomProps) {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  // Chat state - handle gracefully if chat slice is not registered
  const chatState = useAppSelector((state) => {
    if ('chat' in state) {
      return state.chat as {
        isConnected: boolean
        messages: ChatMessage[]
        participants: Participant[]
        connectionError: string | null
      }
    }
    return {
      isConnected: false,
      messages: [],
      participants: [],
      connectionError: null,
    }
  })

  const { isConnected, messages, participants, connectionError } = chatState

  // 本地消息状态（用于初始消息）
  const [localMessages] = useState<ChatMessage[]>(initialMessages)

  // 使用 WebSocket Hook
  const { sendMessage, disconnect } = useSocket({
    roundTableId,
    autoConnect: true,
  })

  // 初始化参与者和历史消息
  useEffect(() => {
    if (initialParticipants.length > 0) {
      dispatch(setParticipants(initialParticipants))
    }
  }, [dispatch, initialParticipants])

  // 合并本地消息和实时消息
  const allMessages = [...localMessages, ...messages]

  // 去重
  const uniqueMessages = allMessages.filter(
    (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
  )

  // 排序
  const sortedMessages = [...uniqueMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // 处理离开
  const handleLeave = () => {
    disconnect()
    dispatch(resetChat())
    onLeave?.()
  }

  // 处理发送消息
  const handleSendMessage = (content: string, contentType: 'text' | 'image') => {
    sendMessage(content, contentType)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">群组讨论</h3>
          <ParticipantAvatars participants={participants} />
        </div>
        <div className="flex items-center gap-2">
          <ConnectionStatus isConnected={isConnected} />
          {onLeave && (
            <button
              onClick={handleLeave}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              离开
            </button>
          )}
        </div>
      </div>

      {/* 连接错误提示 */}
      {connectionError && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm text-center">
          {connectionError}
        </div>
      )}

      {/* 消息列表 */}
      <MessageList messages={sortedMessages} currentUserId={user?.id} />

      {/* 消息输入 */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={!isConnected}
        placeholder={isConnected ? '输入消息...' : '正在连接...'}
      />
    </div>
  )
}

export default ChatRoom