/**
 * 群组 WebSocket 服务
 * 根据 API-CONTRACT.md 唯一可信源实现
 */
import { io, Socket } from 'socket.io-client'
import type {
  WebSocketEvent,
  ConnectedEvent,
  UserJoinedEvent,
  UserLeftEvent,
  UserStatusEvent,
  ReceiveMessageEvent,
  RoundTableStartEvent,
  RoundTableEndEvent,
  NextPhaseEvent,
  ErrorEvent,
  SendMessagePayload,
  ContentType,
} from '../types'

// WebSocket 事件回调类型
export type WebSocketCallback<T = WebSocketEvent> = (event: T) => void

// Socket 配置选项
const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
}

/**
 * 群组 WebSocket 客户端类
 */
export class RoundtableSocket {
  private socket: Socket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  // 事件监听器
  private listeners: Map<string, Set<WebSocketCallback>> = new Map()

  /**
   * 连接到群组 WebSocket
   */
  connect(roundTableId: string, token: string, wsEndpoint?: string): void {
    // 如果已连接，先断开
    if (this.socket?.connected) {
      this.disconnect()
    }

    // 构建 WebSocket URL
    // 根据 API-CONTRACT.md: ws://host/round-tables/:id/ws?token=<jwt>
    const baseUrl = wsEndpoint || `${window.location.origin}/round-tables/${roundTableId}/ws`

    this.socket = io(baseUrl, {
      ...SOCKET_OPTIONS,
      auth: { token },
      query: { roundTableId },
    })

    this.setupListeners()
  }

  /**
   * 设置 Socket 事件监听
   */
  private setupListeners(): void {
    if (!this.socket) return

    // 连接成功
    this.socket.on('connect', () => {
      console.log('[RoundtableSocket] Connected')
      this.emitToListeners('connected', { type: 'connected', data: {} as ConnectedEvent['data'] })
    })

    // 连接错误
    this.socket.on('connect_error', (error: Error) => {
      console.error('[RoundtableSocket] Connection error:', error)
      this.emitToListeners('error', {
        type: 'error',
        data: { code: 'CONNECTION_ERROR', message: error.message },
      })
    })

    // 断开连接
    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      console.log('[RoundtableSocket] Disconnected:', reason)
      if (reason === 'io server disconnect') {
        // 服务器主动断开，尝试重连
        this.socket?.connect()
      }
    })

    // 重连尝试
    this.socket.io.on('reconnect_attempt', (attempt: number) => {
      console.log('[RoundtableSocket] Reconnect attempt:', attempt)
    })

    // 重连成功
    this.socket.io.on('reconnect', (attempt: number) => {
      console.log('[RoundtableSocket] Reconnected after', attempt, 'attempts')
    })

    // 重连失败
    this.socket.io.on('reconnect_failed', () => {
      console.error('[RoundtableSocket] Reconnect failed')
      this.emitToListeners('error', {
        type: 'error',
        data: { code: 'RECONNECT_FAILED', message: '无法重新连接到群组' },
      })
    })

    // === 业务事件监听 (根据 API-CONTRACT.md) ===

    // 用户加入
    this.socket.on('user_joined', (data: UserJoinedEvent['data']) => {
      this.emitToListeners('user_joined', { type: 'user_joined', data })
    })

    // 用户离开
    this.socket.on('user_left', (data: UserLeftEvent['data']) => {
      this.emitToListeners('user_left', { type: 'user_left', data })
    })

    // 用户状态变更
    this.socket.on('user_status', (data: UserStatusEvent['data']) => {
      this.emitToListeners('user_status', { type: 'user_status', data })
    })

    // 接收消息
    this.socket.on('receive_message', (data: ReceiveMessageEvent['data']) => {
      this.emitToListeners('receive_message', { type: 'receive_message', data })
    })

    // 群组开始
    this.socket.on('round_table_start', (data: RoundTableStartEvent['data']) => {
      this.emitToListeners('round_table_start', { type: 'round_table_start', data })
    })

    // 群组结束
    this.socket.on('round_table_end', (data: RoundTableEndEvent['data']) => {
      this.emitToListeners('round_table_end', { type: 'round_table_end', data })
    })

    // 进入下一环节
    this.socket.on('next_phase', (data: NextPhaseEvent['data']) => {
      this.emitToListeners('next_phase', { type: 'next_phase', data })
    })

    // 错误
    this.socket.on('error', (data: ErrorEvent['data']) => {
      this.emitToListeners('error', { type: 'error', data })
    })
  }

  /**
   * 发送消息
   */
  sendMessage(content: string, contentType: ContentType = 'text'): void {
    if (!this.socket?.connected) {
      console.error('[RoundtableSocket] Not connected')
      return
    }

    const payload: SendMessagePayload = {
      type: 'send_message',
      data: { content, contentType },
    }

    this.socket.emit('send_message', payload.data)
  }

  /**
   * 开始说话
   */
  startSpeaking(): void {
    if (!this.socket?.connected) return
    this.socket.emit('start_speaking')
  }

  /**
   * 停止说话
   */
  stopSpeaking(): void {
    if (!this.socket?.connected) return
    this.socket.emit('stop_speaking')
  }

  /**
   * 发送输入状态
   */
  sendTypingStatus(isTyping: boolean): void {
    if (!this.socket?.connected) return
    this.socket.emit('user_status', { status: isTyping ? 'typing' : 'idle' })
  }

  /**
   * 添加事件监听器
   */
  on<T extends WebSocketEvent>(event: T['type'], callback: WebSocketCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as WebSocketCallback)

    // 返回取消订阅函数
    return () => {
      this.listeners.get(event)?.delete(callback as WebSocketCallback)
    }
  }

  /**
   * 移除事件监听器
   */
  off<T extends WebSocketEvent>(event: T['type'], callback?: WebSocketCallback<T>): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback as WebSocketCallback)
    } else {
      this.listeners.delete(event)
    }
  }

  /**
   * 触发事件监听器
   */
  private emitToListeners(event: string, data: WebSocketEvent): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.listeners.clear()
  }
}

// 创建单例实例
let socketInstance: RoundtableSocket | null = null

/**
 * 获取 WebSocket 实例
 */
export function getRoundtableSocket(): RoundtableSocket {
  if (!socketInstance) {
    socketInstance = new RoundtableSocket()
  }
  return socketInstance
}

/**
 * 重置 WebSocket 实例（用于测试）
 */
export function resetRoundtableSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

export default RoundtableSocket