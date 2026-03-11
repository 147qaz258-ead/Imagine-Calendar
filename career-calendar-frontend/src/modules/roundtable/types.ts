/**
 * 群组模块类型定义
 * 根据 API-CONTRACT.md 唯一可信源定义
 */

// 群组状态枚举
export enum RoundTableStatus {
  MATCHING = 'matching',         // 匹配中
  READY = 'ready',               // 人齐待开始
  IN_PROGRESS = 'in_progress',   // 进行中
  COMPLETED = 'completed',       // 已完成
  CANCELLED = 'cancelled'        // 已取消
}

// 参与者角色枚举
export enum ParticipantRole {
  HOST = 'host',                 // 主持人
  MEMBER = 'member'              // 普通成员
}

// 参与者状态枚举
export enum ParticipantStatus {
  APPLIED = 'applied',           // 已报名
  MATCHED = 'matched',           // 已匹配
  JOINED = 'joined',             // 已加入
  LEADER_CONFIRMED = 'leader_confirmed', // 已确认为组长
  LEFT = 'left',                 // 已离开
  CANCELLED = 'cancelled'        // 已取消
}

// 群组状态中文标签
export const RoundTableStatusLabels: Record<RoundTableStatus, string> = {
  [RoundTableStatus.MATCHING]: '匹配中',
  [RoundTableStatus.READY]: '待开始',
  [RoundTableStatus.IN_PROGRESS]: '进行中',
  [RoundTableStatus.COMPLETED]: '已完成',
  [RoundTableStatus.CANCELLED]: '已取消',
}

// 群组状态颜色映射
export const RoundTableStatusColors: Record<RoundTableStatus, { bg: string; text: string; border: string }> = {
  [RoundTableStatus.MATCHING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  [RoundTableStatus.READY]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
  [RoundTableStatus.IN_PROGRESS]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  [RoundTableStatus.COMPLETED]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
  },
  [RoundTableStatus.CANCELLED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
  },
}

// 参与者信息
export interface Participant {
  userId: string
  nickname: string
  avatar?: string
  joinedAt: string
  role: ParticipantRole
}

// 群组讨论
export interface RoundTable {
  id: string
  topic: string
  description?: string
  scheduledAt: string           // 预定时间 ISO 8601
  duration: number              // 时长（分钟）
  maxParticipants: number       // 最大参与人数（固定6人）
  participants: Participant[]
  status: RoundTableStatus
  questions: string[]           // 讨论问题清单
  summary?: string              // 讨论纪要
  messages?: ChatMessage[]      // 历史消息
  createdAt: string
  updatedAt: string
}

// 群组问题
export interface RoundTableQuestion {
  id: string
  category: string              // 问题类别
  question: string              // 问题内容
  followUp?: string[]           // 追问
}

// 群组查询参数
export interface RoundTableQuery {
  status?: RoundTableStatus
  page?: number
  pageSize?: number
}

// 群组列表响应
export interface RoundTableListResponse {
  success: boolean
  data: {
    roundTables: RoundTable[]
    total: number
    page: number
    pageSize: number
  }
}

// 群组详情响应
export interface RoundTableDetailResponse {
  success: boolean
  data: RoundTable
}

// 创建群组报名请求
export interface ApplyRoundTableRequest {
  preferredTimes: string[]      // 期望时间段 ISO 8601
  topics?: string[]             // 感兴趣的话题
}

// 创建群组报名响应
export interface ApplyRoundTableResponse {
  success: boolean
  data: {
    applicationId: string
    status: 'pending' | 'matched'
    estimatedWaitTime?: number  // 预计等待时间（分钟）
  }
}

// 加入群组响应
export interface JoinRoundTableResponse {
  success: boolean
  data: {
    roundTable: RoundTable
    wsEndpoint: string          // WebSocket 连接地址
  }
}

// 离开群组响应
export interface LeaveRoundTableResponse {
  success: boolean
  data: {
    left: boolean
    roundTable?: RoundTable
  }
}

// 问题清单响应
export interface QuestionsResponse {
  success: boolean
  data: {
    questions: RoundTableQuestion[]
  }
}

// 我的群组分组
export interface MyRoundTables {
  matching: RoundTable[]         // 匹配中
  upcoming: RoundTable[]         // 即将开始
  completed: RoundTable[]        // 已完成
}

// ========== WebSocket 事件类型 (根据 API-CONTRACT.md) ==========

// 用户状态类型
export type UserStatus = 'speaking' | 'idle' | 'typing'

// 消息内容类型
export type ContentType = 'text' | 'image' | 'file'

// 连接成功事件
export interface ConnectedEvent {
  type: 'connected'
  data: {
    roundTableId: string
    userId: string
    participants: Participant[]
  }
}

// 用户加入事件
export interface UserJoinedEvent {
  type: 'user_joined'
  data: {
    user: Participant
  }
}

// 用户离开事件
export interface UserLeftEvent {
  type: 'user_left'
  data: {
    userId: string
  }
}

// 用户状态变更事件
export interface UserStatusEvent {
  type: 'user_status'
  data: {
    userId: string
    status: UserStatus
  }
}

// 发送消息载荷
export interface SendMessagePayload {
  type: 'send_message'
  data: {
    content: string
    contentType: ContentType
  }
}

// 接收消息事件
export interface ReceiveMessageEvent {
  type: 'receive_message'
  data: {
    id: string
    userId: string
    nickname: string
    content: string
    contentType: ContentType
    createdAt: string
  }
}

// 开始说话载荷
export interface StartSpeakingPayload {
  type: 'start_speaking'
}

// 停止说话载荷
export interface StopSpeakingPayload {
  type: 'stop_speaking'
}

// 群组开始事件
export interface RoundTableStartEvent {
  type: 'round_table_start'
  data: {
    startedAt: string
    duration: number
  }
}

// 群组结束事件
export interface RoundTableEndEvent {
  type: 'round_table_end'
  data: {
    endedAt: string
    duration: number
    summary: string
  }
}

// 进入下一环节事件
export interface NextPhaseEvent {
  type: 'next_phase'
  data: {
    phase: number
    phaseName: string
    question?: string
  }
}

// 错误事件
export interface ErrorEvent {
  type: 'error'
  data: {
    code: string
    message: string
  }
}

// WebSocket 事件联合类型
export type WebSocketEvent =
  | ConnectedEvent
  | UserJoinedEvent
  | UserLeftEvent
  | UserStatusEvent
  | ReceiveMessageEvent
  | RoundTableStartEvent
  | RoundTableEndEvent
  | NextPhaseEvent
  | ErrorEvent

// 聊天消息
export interface ChatMessage {
  id: string
  userId: string
  nickname: string
  avatar?: string
  content: string
  contentType: ContentType
  createdAt: string
  isSystem?: boolean  // 系统消息标识
}

// 会议阶段
export interface MeetingPhase {
  id: string
  name: string
  duration: number  // 分钟
  description: string
}

// 会议阶段定义
export const MEETING_PHASES: MeetingPhase[] = [
  { id: 'icebreaker', name: '破冰环节', duration: 10, description: '自我介绍' },
  { id: 'discussion1', name: '话题讨论 1', duration: 30, description: '系统推送话题' },
  { id: 'discussion2', name: '话题讨论 2', duration: 30, description: '用户发起话题' },
  { id: 'review', name: '认知盘点', duration: 30, description: '填写认知图更新' },
  { id: 'wrapup', name: '下一步约定', duration: 20, description: '约定后续行动' },
]

// 讨论问题（20个问题清单）
export const DISCUSSION_QUESTIONS = [
  { category: '职业规划', question: '你对自己未来3-5年的职业规划是什么？', followUp: ['为什么选择这个方向？', '有哪些具体的里程碑？'] },
  { category: '职业规划', question: '在职业发展过程中，你最看重哪些因素？', followUp: ['薪资、成长、工作生活平衡如何排序？'] },
  { category: '行业选择', question: '你对哪些行业比较感兴趣？为什么？', followUp: ['是否了解这些行业的现状和发展趋势？'] },
  { category: '行业选择', question: '你如何评估一个行业的发展前景？', followUp: ['有哪些信息渠道？'] },
  { category: '企业选择', question: '你倾向于选择什么类型的企业？为什么？', followUp: ['国企、外企、民企、创业公司的考量'] },
  { category: '企业选择', question: '你对企业文化有什么偏好？', followUp: ['开放扁平还是层级分明？'] },
  { category: '岗位选择', question: '你想从事什么类型的工作岗位？', followUp: ['技术、产品、运营、市场等方向'] },
  { category: '岗位选择', question: '你期望的工作节奏是怎样的？', followUp: ['对加班的看法'] },
  { category: '能力提升', question: '你目前最需要提升的能力是什么？', followUp: ['有哪些学习计划？'] },
  { category: '能力提升', question: '你如何保持学习和成长？', followUp: ['有哪些学习资源和方法？'] },
  { category: '求职准备', question: '你准备如何准备招聘季？', followUp: ['简历、笔试、面试的准备'] },
  { category: '求职准备', question: '你对招聘流程有哪些了解？', followUp: ['秋招、春招的时间节点'] },
  { category: '实习经验', question: '你有哪些实习或项目经验？', followUp: ['收获了什么？'] },
  { category: '实习经验', question: '实习和全职工作有什么不同？', followUp: ['如何规划实习转正？'] },
  { category: '地域选择', question: '你对工作地点有什么偏好？', followUp: ['一线城市还是新一线城市？'] },
  { category: '地域选择', question: '选择工作城市时考虑哪些因素？', followUp: ['房价、户口、发展机会等'] },
  { category: '薪资期望', question: '你对薪资有什么期望？', followUp: ['如何评估薪资水平？'] },
  { category: '薪资期望', question: '除了基本薪资，你还关注哪些福利？', followUp: ['期权、保险、公积金等'] },
  { category: '职业困惑', question: '你目前最大的职业困惑是什么？', followUp: ['希望从讨论中获得什么帮助？'] },
  { category: '职业困惑', question: '如果遇到职业瓶颈，你会如何应对？', followUp: ['有没有相关经验分享？'] },
]