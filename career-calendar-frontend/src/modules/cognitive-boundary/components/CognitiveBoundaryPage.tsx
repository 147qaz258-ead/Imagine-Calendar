/**
 * 摸索认知边界页面
 * 13维度 × 5问题评估
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchAssessment, submitAssessments, clearError } from '../store/cognitiveBoundarySlice'
import { DimensionAssessment } from '../components/DimensionAssessment'
import {
  QUESTIONS,
  DIMENSIONS,
  getQuestionsByDimension,
  type QuestionLevel,
} from '@/data/cognitive-questions'
import type { QuestionAssessment } from '../types'
import { fetchCurrentUser } from '@/modules/auth/store/authSlice'

export const CognitiveBoundaryPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentAssessment, loading, submitting, error } = useAppSelector(
    (state) => state.cognitiveBoundary
  )
  const { user: authUser, isAuthenticated } = useAppSelector((state) => state.auth)

  // 本地评估状态
  const [assessments, setAssessments] = useState<Record<string, QuestionLevel>>({})

  // 当前选中的维度
  const [activeDimension, setActiveDimension] = useState<string>(DIMENSIONS[0].key)

  // 如果已登录但没有用户数据，先获取当前用户
  useEffect(() => {
    if (isAuthenticated && !authUser) {
      dispatch(fetchCurrentUser())
    }
  }, [isAuthenticated, authUser, dispatch])

  // 未登录跳转
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 加载已有评估
  useEffect(() => {
    dispatch(fetchAssessment())
  }, [dispatch])

  // 从已有评估初始化本地状态
  useEffect(() => {
    if (currentAssessment) {
      const initialAssessments: Record<string, QuestionLevel> = {}
      currentAssessment.dimensions.forEach((dim) => {
        dim.assessments.forEach((a) => {
          initialAssessments[a.questionId] = a.level
        })
      })
      setAssessments(initialAssessments)
    }
  }, [currentAssessment])

  // 处理评估变更
  const handleAssessmentChange = useCallback((questionId: string, level: QuestionLevel) => {
    setAssessments((prev) => ({
      ...prev,
      [questionId]: level,
    }))
  }, [])

  // 计算总体进度
  const calculateProgress = useCallback(() => {
    const total = QUESTIONS.length
    const completed = Object.keys(assessments).length
    return {
      total,
      completed,
      percentage: Math.round((completed / total) * 100),
    }
  }, [assessments])

  // 提交评估
  const handleSubmit = async () => {
    const assessmentList: QuestionAssessment[] = Object.entries(assessments).map(
      ([questionId, level]) => ({
        questionId,
        level,
        assessedAt: new Date().toISOString(),
      })
    )

    const result = await dispatch(submitAssessments(assessmentList))
    if (submitAssessments.fulfilled.match(result)) {
      // 提交成功后显示成功消息或跳转到认知图谱页面
      // 注意：不再触发引导流程跳转，认知边界评估已独立于引导流程
      navigate('/cognitive')
    }
  }

  const progress = calculateProgress()

  if (loading && !currentAssessment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">摸索认知边界</h1>
        <p className="text-gray-600 mt-1">
          通过回答以下问题，了解你在职业发展各维度的认知深度
        </p>
      </div>

      {/* 说明 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">评估说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 每个问题下方有一个滑动条，请根据你的了解程度选择</li>
          <li>• 从左到右：完全不知道 → 深入了解</li>
          <li>• 请诚实评估，这是为了帮助你更好地了解自己</li>
        </ul>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => dispatch(clearError())}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 进度条 */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">评估进度</span>
          <span className="text-sm text-gray-500">
            {progress.completed} / {progress.total} 问题
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="mt-2 text-right text-sm text-gray-500">
          {progress.percentage}% 完成
        </div>
      </div>

      {/* 维度导航 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {DIMENSIONS.map((dim) => {
          const dimQuestions = getQuestionsByDimension(dim.key)
          const dimCompleted = dimQuestions.filter((q) => assessments[q.id]).length
          const isActive = activeDimension === dim.key
          const isComplete = dimCompleted === dimQuestions.length

          return (
            <button
              key={dim.key}
              onClick={() => setActiveDimension(dim.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isComplete
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dim.name}
              <span className="ml-1 text-xs opacity-75">
                ({dimCompleted}/{dimQuestions.length})
              </span>
            </button>
          )
        })}
      </div>

      {/* 当前维度评估 */}
      {activeDimension && (
        <DimensionAssessment
          dimensionKey={activeDimension}
          dimensionName={DIMENSIONS.find((d) => d.key === activeDimension)?.name || ''}
          questions={getQuestionsByDimension(activeDimension)}
          assessments={assessments}
          onAssessmentChange={handleAssessmentChange}
        />
      )}

      {/* 底部操作栏 */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => {
            const currentIndex = DIMENSIONS.findIndex((d) => d.key === activeDimension)
            if (currentIndex > 0) {
              setActiveDimension(DIMENSIONS[currentIndex - 1].key)
            }
          }}
          disabled={DIMENSIONS.findIndex((d) => d.key === activeDimension) === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← 上一维度
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const currentIndex = DIMENSIONS.findIndex((d) => d.key === activeDimension)
              if (currentIndex < DIMENSIONS.length - 1) {
                setActiveDimension(DIMENSIONS[currentIndex + 1].key)
              }
            }}
            disabled={DIMENSIONS.findIndex((d) => d.key === activeDimension) === DIMENSIONS.length - 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一维度 →
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || progress.completed < QUESTIONS.length}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              progress.completed >= QUESTIONS.length
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? '提交中...' : '完成评估'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CognitiveBoundaryPage