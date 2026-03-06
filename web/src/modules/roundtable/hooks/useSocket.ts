/**
 * WebSocket 连接 Hook
 * 管理圆桌 WebSocket 连接和事件处理
 */
import { useEffect, useCallback, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setConnected,
  setConnectionError,
  setParticipants,
  userJoined,
  userLeft,
  updateUserStatus,
  addMessage,
  addSystemMessage,
  roundTableStart,
  roundTableEnd,
  nextPhase,
  resetChat,
} from '../store/chatSlice'
import { getRoundtableSocket } from '../services/roundtableSocket'
import type {
  ConnectedEvent,
  UserJoinedEvent,
  UserLeftEvent,
  UserStatusEvent,
  ReceiveMessageEvent,
  RoundTableStartEvent,
  RoundTableEndEvent,
  NextPhaseEvent,
  ErrorEvent,
} from '../types'

interface UseSocketOptions {
  roundTableId: string
  autoConnect?: boolean
}

interface UseSocketReturn {
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  sendMessage: (content: string, contentType?: 'text' | 'image') => void
  sendTypingStatus: (isTyping: boolean) => void
  startSpeaking: () => void
  stopSpeaking: () => void
}

/**
 * 圆桌 WebSocket Hook
 */
export function useSocket({
  roundTableId,
  autoConnect = true,
}: UseSocketOptions): UseSocketReturn {
  const dispatch = useAppDispatch()
  const { isConnected, connectionError } = useAppSelector((state) => {
    // Chat slice might not be registered, handle gracefully
    if ('chat' in state) {
      return state.chat as { isConnected: boolean; connectionError: string | null }
    }
    return { isConnected: false, connectionError: null }
  })
  const { token } = useAppSelector((state) => state.auth)
  const unsubscribersRef = useRef<(() => void)[]>([])

  // 获取 WebSocket 实例
  const socket = getRoundtableSocket()

  // 设置事件监听器
  const setupEventListeners = useCallback(() => {
    // 清理旧的监听器
    unsubscribersRef.current.forEach((unsub) => unsub())
    unsubscribersRef.current = []

    // 连接成功
    const unsubConnected = socket.on<ConnectedEvent>('connected', (event) => {
      dispatch(setConnected(true))
      dispatch(setParticipants(event.data.participants))
      dispatch(addSystemMessage('已连接到圆桌'))
    })
    unsubscribersRef.current.push(unsubConnected)

    // 用户加入
    const unsubUserJoined = socket.on<UserJoinedEvent>('user_joined', (event) => {
      dispatch(userJoined(event.data.user))
      dispatch(addSystemMessage(`${event.data.user.nickname} 加入了圆桌`))
    })
    unsubscribersRef.current.push(unsubUserJoined)

    // 用户离开
    const unsubUserLeft = socket.on<UserLeftEvent>('user_left', (event) => {
      dispatch(userLeft(event.data.userId))
      dispatch(addSystemMessage('有人离开了圆桌'))
    })
    unsubscribersRef.current.push(unsubUserLeft)

    // 用户状态变更
    const unsubUserStatus = socket.on<UserStatusEvent>('user_status', (event) => {
      dispatch(updateUserStatus({
        userId: event.data.userId,
        status: event.data.status,
      }))
    })
    unsubscribersRef.current.push(unsubUserStatus)

    // 接收消息
    const unsubReceiveMessage = socket.on<ReceiveMessageEvent>('receive_message', (event) => {
      dispatch(addMessage({
        id: event.data.id,
        userId: event.data.userId,
        nickname: event.data.nickname,
        content: event.data.content,
        contentType: event.data.contentType,
        createdAt: event.data.createdAt,
      }))
    })
    unsubscribersRef.current.push(unsubReceiveMessage)

    // 圆桌开始
    const unsubRoundTableStart = socket.on<RoundTableStartEvent>('round_table_start', (event) => {
      dispatch(roundTableStart({
        startedAt: event.data.startedAt,
        duration: event.data.duration,
      }))
      dispatch(addSystemMessage('圆桌讨论已开始'))
    })
    unsubscribersRef.current.push(unsubRoundTableStart)

    // 圆桌结束
    const unsubRoundTableEnd = socket.on<RoundTableEndEvent>('round_table_end', (event) => {
      dispatch(roundTableEnd({
        endedAt: event.data.endedAt,
        duration: event.data.duration,
        summary: event.data.summary,
      }))
      dispatch(addSystemMessage('圆桌讨论已结束'))
    })
    unsubscribersRef.current.push(unsubRoundTableEnd)

    // 进入下一阶段
    const unsubNextPhase = socket.on<NextPhaseEvent>('next_phase', (event) => {
      dispatch(nextPhase({
        phase: event.data.phase,
        phaseName: event.data.phaseName,
        question: event.data.question,
      }))
      dispatch(addSystemMessage(`进入${event.data.phaseName}`))
    })
    unsubscribersRef.current.push(unsubNextPhase)

    // 错误
    const unsubError = socket.on<ErrorEvent>('error', (event) => {
      dispatch(setConnectionError(event.data.message))
    })
    unsubscribersRef.current.push(unsubError)
  }, [dispatch, socket])

  // 连接
  const connect = useCallback(() => {
    if (!token) {
      dispatch(setConnectionError('请先登录'))
      return
    }

    if (!roundTableId) {
      dispatch(setConnectionError('缺少圆桌ID'))
      return
    }

    setupEventListeners()
    socket.connect(roundTableId, token)
  }, [token, roundTableId, socket, dispatch, setupEventListeners])

  // 断开连接
  const disconnect = useCallback(() => {
    unsubscribersRef.current.forEach((unsub) => unsub())
    unsubscribersRef.current = []
    socket.disconnect()
    dispatch(resetChat())
  }, [socket, dispatch])

  // 发送消息
  const sendMessage = useCallback(
    (content: string, contentType: 'text' | 'image' = 'text') => {
      if (!content.trim()) return
      socket.sendMessage(content, contentType)
    },
    [socket]
  )

  // 发送输入状态
  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      socket.sendTypingStatus(isTyping)
    },
    [socket]
  )

  // 开始说话
  const startSpeaking = useCallback(() => {
    socket.startSpeaking()
  }, [socket])

  // 停止说话
  const stopSpeaking = useCallback(() => {
    socket.stopSpeaking()
  }, [socket])

  // 自动连接
  useEffect(() => {
    if (autoConnect && token && roundTableId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, token, roundTableId, connect, disconnect])

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    sendTypingStatus,
    startSpeaking,
    stopSpeaking,
  }
}

export default useSocket