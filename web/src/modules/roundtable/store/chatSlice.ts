/**
 * 群组聊天状态管理 Slice
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ChatMessage, Participant, UserStatus } from '../types'
import { MEETING_PHASES } from '../types'

// 用户输入状态
interface TypingStatus {
  [userId: string]: boolean
}

// 聊天状态接口
export interface ChatState {
  // 连接状态
  isConnected: boolean
  connectionError: string | null

  // 消息列表
  messages: ChatMessage[]

  // 参与者列表
  participants: Participant[]

  // 用户状态（发言/空闲/输入中）
  userStatuses: { [userId: string]: UserStatus }

  // 输入状态
  typingStatus: TypingStatus

  // 当前会议阶段
  currentPhase: number
  phaseEndTime: string | null
  currentQuestion: string | null

  // 群组状态
  roundTableStarted: boolean
  roundTableEnded: boolean
  summary: string | null

  // WebSocket 端点
  wsEndpoint: string | null
}

// 初始状态
const initialState: ChatState = {
  isConnected: false,
  connectionError: null,
  messages: [],
  participants: [],
  userStatuses: {},
  typingStatus: {},
  currentPhase: 0,
  phaseEndTime: null,
  currentQuestion: null,
  roundTableStarted: false,
  roundTableEnded: false,
  summary: null,
  wsEndpoint: null,
}

// 聊天 Slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // 设置连接状态
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
      if (action.payload) {
        state.connectionError = null
      }
    },

    // 设置连接错误
    setConnectionError: (state, action: PayloadAction<string | null>) => {
      state.connectionError = action.payload
      if (action.payload) {
        state.isConnected = false
      }
    },

    // 设置 WebSocket 端点
    setWsEndpoint: (state, action: PayloadAction<string>) => {
      state.wsEndpoint = action.payload
    },

    // 初始化参与者列表
    setParticipants: (state, action: PayloadAction<Participant[]>) => {
      state.participants = action.payload
    },

    // 用户加入
    userJoined: (state, action: PayloadAction<Participant>) => {
      const exists = state.participants.find(p => p.userId === action.payload.userId)
      if (!exists) {
        state.participants.push(action.payload)
      }
    },

    // 用户离开
    userLeft: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter(p => p.userId !== action.payload)
      delete state.userStatuses[action.payload]
      delete state.typingStatus[action.payload]
    },

    // 更新用户状态
    updateUserStatus: (state, action: PayloadAction<{ userId: string; status: UserStatus }>) => {
      state.userStatuses[action.payload.userId] = action.payload.status
      // 如果不是输入中，清除输入状态
      if (action.payload.status !== 'typing') {
        delete state.typingStatus[action.payload.userId]
      }
    },

    // 设置输入状态
    setTypingStatus: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
      state.typingStatus[action.payload.userId] = action.payload.isTyping
    },

    // 添加消息
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      // 避免重复消息
      const exists = state.messages.find(m => m.id === action.payload.id)
      if (!exists) {
        state.messages.push(action.payload)
      }
    },

    // 添加系统消息
    addSystemMessage: (state, action: PayloadAction<string>) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        nickname: '系统',
        content: action.payload,
        contentType: 'text',
        createdAt: new Date().toISOString(),
        isSystem: true,
      }
      state.messages.push(systemMessage)
    },

    // 清空消息
    clearMessages: (state) => {
      state.messages = []
    },

    // 群组开始
    roundTableStart: (state, action: PayloadAction<{ startedAt: string; duration: number }>) => {
      state.roundTableStarted = true
      state.roundTableEnded = false
      state.currentPhase = 0

      // 计算阶段结束时间
      const endTime = new Date(action.payload.startedAt)
      endTime.setMinutes(endTime.getMinutes() + MEETING_PHASES[0].duration)
      state.phaseEndTime = endTime.toISOString()
    },

    // 群组结束
    roundTableEnd: (state, action: PayloadAction<{ endedAt: string; duration: number; summary: string }>) => {
      state.roundTableEnded = true
      state.roundTableStarted = false
      state.summary = action.payload.summary
    },

    // 进入下一阶段
    nextPhase: (state, action: PayloadAction<{ phase: number; phaseName: string; question?: string }>) => {
      state.currentPhase = action.payload.phase
      state.currentQuestion = action.payload.question || null

      // 计算新阶段结束时间
      if (state.phaseEndTime) {
        const currentPhaseData = MEETING_PHASES[action.payload.phase]
        if (currentPhaseData) {
          const endTime = new Date()
          endTime.setMinutes(endTime.getMinutes() + currentPhaseData.duration)
          state.phaseEndTime = endTime.toISOString()
        }
      }
    },

    // 设置当前问题
    setCurrentQuestion: (state, action: PayloadAction<string | null>) => {
      state.currentQuestion = action.payload
    },

    // 重置聊天状态
    resetChat: () => initialState,
  },
})

export const {
  setConnected,
  setConnectionError,
  setWsEndpoint,
  setParticipants,
  userJoined,
  userLeft,
  updateUserStatus,
  setTypingStatus,
  addMessage,
  addSystemMessage,
  clearMessages,
  roundTableStart,
  roundTableEnd,
  nextPhase,
  setCurrentQuestion,
  resetChat,
} = chatSlice.actions

export default chatSlice.reducer