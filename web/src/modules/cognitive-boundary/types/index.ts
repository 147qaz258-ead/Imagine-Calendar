/**
 * 摸索认知边界模块类型定义
 */
import { QuestionLevel } from '@/data/cognitive-questions'

/** 问题评估记录 */
export interface QuestionAssessment {
  questionId: string
  level: QuestionLevel
  assessedAt: string
}

/** 维度评估结果 */
export interface DimensionAssessment {
  dimensionKey: string
  dimensionName: string
  assessments: QuestionAssessment[]
  averageScore: number
}

/** 完整的认知边界评估 */
export interface CognitiveBoundaryAssessment {
  id?: string
  userId: string
  dimensions: DimensionAssessment[]
  totalQuestions: number
  assessedQuestions: number
  completedAt?: string
  createdAt?: string
  updatedAt?: string
}

/** 提交评估请求 */
export interface SubmitAssessmentRequest {
  assessments: QuestionAssessment[]
}

/** 提交评估响应 */
export interface SubmitAssessmentResponse {
  success: boolean
  data: CognitiveBoundaryAssessment
  message?: string
}

/** 获取评估响应 */
export interface GetAssessmentResponse {
  success: boolean
  data: CognitiveBoundaryAssessment | null
  message?: string
}

/** CognitiveBoundary 状态 */
export interface CognitiveBoundaryState {
  currentAssessment: CognitiveBoundaryAssessment | null
  assessments: CognitiveBoundaryAssessment[]
  loading: boolean
  submitting: boolean
  error: string | null
}

/** 进度信息 */
export interface ProgressInfo {
  total: number
  completed: number
  percentage: number
}