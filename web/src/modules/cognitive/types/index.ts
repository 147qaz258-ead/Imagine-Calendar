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

// ============ 版本管理类型 ============

/** 认知版本列表项 */
export interface CognitiveVersionListItem {
  id: string
  userId: string
  versionNumber: number
  versionName: string | null
  description: string | null
  triggerType: string | null
  roundTableId: string | null
  createdAt: string
  dimensionCount: number
  totalScore: number
}

/** 认知版本详情 */
export interface CognitiveVersion {
  id: string
  userId: string
  versionNumber: number
  versionName: string | null
  description: string | null
  dimensions: CognitiveDimension[]
  roundTableId: string | null
  triggerType: string | null
  createdAt: string
}

/** 获取版本列表响应 */
export interface CognitiveVersionsResponse {
  success: boolean
  data: CognitiveVersionListItem[]
  message?: string
}

/** 获取单个版本响应 */
export interface CognitiveVersionResponse {
  success: boolean
  data: CognitiveVersion
  message?: string
}

/** 创建版本请求 */
export interface CreateCognitiveVersionRequest {
  versionName?: string
  description?: string
  roundTableId?: string
  triggerType?: string
}

/** 维度差异 */
export interface DimensionDiff {
  name: string
  scoreV1: number
  scoreV2: number
  change: number
  changePercent: number
}

/** 版本对比结果 */
export interface VersionComparison {
  v1: {
    id: string
    versionNumber: number
    versionName: string | null
    createdAt: string
    dimensions: CognitiveDimension[]
  }
  v2: {
    id: string
    versionNumber: number
    versionName: string | null
    createdAt: string
    dimensions: CognitiveDimension[]
  }
  diffs: DimensionDiff[]
  overallChange: number
  improvedDimensions: string[]
  declinedDimensions: string[]
}

/** 版本对比响应 */
export interface CompareVersionsResponse {
  success: boolean
  data: VersionComparison
  message?: string
}

/** Cognitive 状态 */
export interface CognitiveState {
  cognitiveMap: CognitiveMap | null
  history: CognitiveHistory[]
  trends: DimensionTrend[]
  versions: CognitiveVersionListItem[]
  loading: boolean
  error: string | null
}