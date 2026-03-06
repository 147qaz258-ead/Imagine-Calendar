/**
 * 认知图谱类型定义
 * 基于 API-CONTRACT.md
 */

/** 知识来源类型 */
export type KnowledgeSourceType =
  | 'self_exploration'
  | 'others_sharing'
  | 'round_table'
  | 'study_buddy'
  | 'case_study'

/** 知识来源 */
export interface KnowledgeSource {
  type: KnowledgeSourceType
  description: string
  depth: number
  contributedAt: string
}

/** 认知维度 */
export interface CognitiveDimension {
  name: string
  score: number
  knowledgeSource: KnowledgeSource[]
}

/** 认知历史 */
export interface CognitiveHistory {
  date: string
  dimensions: CognitiveDimension[]
  triggeredBy: string
}

/** 认知图谱 */
export interface CognitiveMap {
  id: string
  userId: string
  dimensions: CognitiveDimension[]
  history: CognitiveHistory[]
  createdAt: string
  updatedAt: string
}

/** 获取认知图谱响应 */
export interface CognitiveMapResponse {
  success: boolean
  data: CognitiveMap
  message?: string
}

/** 更新维度请求 */
export interface UpdateDimensionRequest {
  dimension: string
  score: number
  knowledgeSource: KnowledgeSource
}

/** 认知历史查询 */
export interface CognitiveHistoryQuery {
  startDate?: string
  endDate?: string
}

/** 维度趋势 */
export interface DimensionTrend {
  dimension: string
  values: {
    date: string
    score: number
  }[]
}

/** 认知历史响应 */
export interface CognitiveHistoryResponse {
  success: boolean
  data: {
    history: CognitiveHistory[]
    trend: DimensionTrend[]
  }
  message?: string
}

/** 对比图谱请求 */
export interface CompareCognitiveMapRequest {
  userIds: string[]
}

/** 对比图谱响应 */
export interface CompareCognitiveMapResponse {
  success: boolean
  data: {
    users: {
      userId: string
      nickname: string
      dimensions: CognitiveDimension[]
    }[]
    commonStrengths: string[]
    commonGaps: string[]
    diversityScore: number
  }
  message?: string
}

/** Cognitive 状态 */
export interface CognitiveState {
  cognitiveMap: CognitiveMap | null
  history: CognitiveHistory[]
  trends: DimensionTrend[]
  loading: boolean
  error: string | null
}