/**
 * 圆桌讨论模块入口
 */
// 组件导出
export { RoundTableCard, ParticipantAvatar } from './components/RoundTableCard'
export { MatchingStatus } from './components/MatchingStatus'
export { ApplyForm } from './components/ApplyForm'
export { SixPeopleGroup } from './components/SixPeopleGroup'
export { RoundTableList } from './components/RoundTableList'
export { RoundTableDetail } from './components/RoundTableDetail'
export { ChatRoom } from './components/ChatRoom'
export { MessageList } from './components/MessageList'
export { MessageInput } from './components/MessageInput'

// Hooks 导出
export { useSocket } from './hooks/useSocket'

// 类型导出
export * from './types'

// API 导出
export { roundTableApi } from './services/roundTableApi'
export { getRoundtableSocket, resetRoundtableSocket } from './services/roundtableSocket'

// Store 导出
export {
  default as roundTableReducer,
  fetchRoundTables,
  fetchRoundTableDetail,
  applyRoundTable,
  joinRoundTable,
  leaveRoundTable,
  fetchQuestions,
  clearCurrentRoundTable,
  resetApplicationStatus,
  clearError,
  setMyRoundTables,
} from './store/roundTableSlice'
export type { RoundTableState } from './store/roundTableSlice'

export {
  default as chatReducer,
  setConnected,
  setConnectionError,
  setParticipants,
  userJoined,
  userLeft,
  updateUserStatus,
  addMessage,
  addSystemMessage,
  clearMessages,
  roundTableStart,
  roundTableEnd,
  nextPhase,
  resetChat,
} from './store/chatSlice'
export type { ChatState } from './store/chatSlice'