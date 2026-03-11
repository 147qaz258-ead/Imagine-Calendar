/**
 * 认知边界评估组件
 * 独立的评估入口，根据用户偏好动态加载问题
 * 支持级联选择：先选子分类，再回答问题
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchAssessment, submitAssessments, clearError } from '../store/cognitiveBoundarySlice'
import { fetchCurrentUser } from '@/modules/auth/store/authSlice'
import {
  getDynamicQuestions,
  getQuestionStats,
  type QuestionLevel,
  type CognitiveQuestion,
  ASSESSMENT_LEVELS,
} from '@/data/cognitive-questions'
import type { QuestionAssessment } from '../types'
import type { UserPreferences } from '@/modules/profile/types'

interface CognitiveBoundaryAssessmentProps {
  /** 完成后的回调 */
  onComplete?: () => void
  /** 是否显示返回按钮 */
  showBackButton?: boolean
}

// 子分类选项配置
const SUB_CATEGORY_OPTIONS: Record<string, { label: string; description: string }[]> = {
  selfPositioning: [
    { label: '商人', description: '注重商业运作、风险管理和机会抓取' },
    { label: '创业者', description: '创造新企业或产品，承担从零开始的挑战' },
    { label: '职业经理人', description: '决策、激励团队并应对企业运营挑战' },
  ],
  developmentDirection: [
    { label: '公共部门', description: '政府或非政府组织，推动社会和公共政策改善' },
    { label: '私营部门', description: '直接参与市场竞争和商业运营' },
    { label: '公私合营部门', description: '混合所有制企业，两种工作文化融合' },
  ],
}

export const CognitiveBoundaryAssessment: React.FC<CognitiveBoundaryAssessmentProps> = ({
  onComplete,
  showBackButton = true,
}) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentAssessment, loading, submitting, error } = useAppSelector(
    (state) => state.cognitiveBoundary
  )
  const { user: authUser, isAuthenticated } = useAppSelector((state) => state.auth)

  // 本地评估状态
  const [assessments, setAssessments] = useState<Record<string, QuestionLevel>>({})

  // 当前选中的维度
  const [activeDimensionIndex, setActiveDimensionIndex] = useState(0)

  // 当前选中的子分类（按维度存储）
  const [selectedSubCategories, setSelectedSubCategories] = useState<Record<string, string>>({})

  // 如果已登录但没有用户数据，先获取当前用户
  useEffect(() => {
    if (isAuthenticated && !authUser) {
      dispatch(fetchCurrentUser())
    }
  }, [isAuthenticated, authUser, dispatch])

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

  // 根据用户偏好获取动态问题
  const dynamicQuestions = useMemo((): readonly CognitiveQuestion[] => {
    const preferences = authUser?.preferences as UserPreferences | undefined
    if (preferences) {
      return getDynamicQuestions(preferences, {
        includeGeneric: true,
        maxQuestionsPerDimension: 5,
      })
    }
    // 如果没有偏好，返回通用问题
    return getDynamicQuestions({} as UserPreferences, {
      includeGeneric: true,
      maxQuestionsPerDimension: 5,
    })
  }, [authUser?.preferences])

  // 按维度分组问题
  const questionsByDimension = useMemo((): ReadonlyMap<string, readonly CognitiveQuestion[]> => {
    const map = new Map<string, CognitiveQuestion[]>()
    dynamicQuestions.forEach((q) => {
      const existing = map.get(q.dimensionKey) || []
      map.set(q.dimensionKey, [...existing, q])
    })
    return map
  }, [dynamicQuestions])

  // 获取维度的子分类列表
  const getSubCategoriesForDimension = useCallback((dimensionKey: string): string[] => {
    const questions = questionsByDimension.get(dimensionKey) || []
    const subCategories = new Set<string>()
    questions.forEach(q => {
      if (q.subCategory) {
        subCategories.add(q.subCategory)
      }
    })
    return Array.from(subCategories)
  }, [questionsByDimension])

  // 获取当前维度当前子分类的问题
  const getFilteredQuestions = useCallback((dimensionKey: string): readonly CognitiveQuestion[] => {
    const allQuestions = questionsByDimension.get(dimensionKey) || []
    const subCategories = getSubCategoriesForDimension(dimensionKey)

    // 如果该维度有子分类选项
    if (subCategories.length > 0) {
      const selectedSubCategory = selectedSubCategories[dimensionKey]
      if (selectedSubCategory) {
        return allQuestions.filter(q => q.subCategory === selectedSubCategory)
      }
      // 如果没选子分类，返回空（让用户先选）
      return []
    }

    return allQuestions
  }, [questionsByDimension, getSubCategoriesForDimension, selectedSubCategories])

  // 维度列表
  const dimensions = useMemo((): ReadonlyArray<{ key: string; name: string; hasSubCategories: boolean }> => {
    const seen = new Set<string>()
    const result: Array<{ key: string; name: string; hasSubCategories: boolean }> = []
    dynamicQuestions.forEach((q) => {
      if (!seen.has(q.dimensionKey)) {
        seen.add(q.dimensionKey)
        const subCategories = getSubCategoriesForDimension(q.dimensionKey)
        result.push({
          key: q.dimensionKey,
          name: q.dimensionName,
          hasSubCategories: subCategories.length > 1,
        })
      }
    })
    return result
  }, [dynamicQuestions, getSubCategoriesForDimension])

  // 问题统计
  const questionStats = useMemo(() => {
    const preferences = authUser?.preferences as UserPreferences | undefined
    return getQuestionStats(preferences)
  }, [authUser?.preferences])

  // 处理评估变更
  const handleAssessmentChange = useCallback((questionId: string, level: QuestionLevel) => {
    setAssessments((prev) => ({
      ...prev,
      [questionId]: level,
    }))
  }, [])

  // 处理子分类选择
  const handleSubCategorySelect = useCallback((dimensionKey: string, subCategory: string) => {
    setSelectedSubCategories(prev => ({
      ...prev,
      [dimensionKey]: subCategory,
    }))
  }, [])

  // 计算总体进度
  const calculateProgress = useCallback(() => {
    const total = dynamicQuestions.length
    const completed = Object.keys(assessments).length
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [dynamicQuestions.length, assessments])

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
      if (onComplete) {
        onComplete()
      } else {
        // 默认返回认知图谱页面
        navigate('/cognitive')
      }
    }
  }

  // 返回上一页
  const handleBack = () => {
    if (onComplete) {
      onComplete()
    } else {
      navigate('/cognitive')
    }
  }

  // 当前维度
  const activeDimension = dimensions[activeDimensionIndex]
  const activeQuestions: readonly CognitiveQuestion[] = activeDimension ? getFilteredQuestions(activeDimension.key) : []
  const activeSubCategories = activeDimension ? getSubCategoriesForDimension(activeDimension.key) : []

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">摸索认知边界</h1>
          <p className="text-gray-600 mt-1">
            通过回答以下问题，了解你在职业发展各维度的认知深度
          </p>
        </div>
        {showBackButton && (
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
        )}
      </div>

      {/* 说明 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">评估说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>每个问题下方有一个滑动条，请根据你的了解程度选择</li>
          <li>从左到右：完全不知道 -&gt; 深入了解</li>
          <li>请诚实评估，这是为了帮助你更好地了解自己</li>
        </ul>
      </div>

      {/* 动态问题提示 */}
      {questionStats.hasDynamicQuestions && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-700">
            根据你的偏好设置，为你推荐了 <strong>{questionStats.totalQuestions}</strong> 个相关问题
          </p>
        </div>
      )}

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
        {dimensions.map((dim, index) => {
          const dimQuestions = questionsByDimension.get(dim.key) || []
          const dimCompleted = dimQuestions.filter((q) => assessments[q.id]).length
          const isActive = activeDimensionIndex === index
          const isComplete = dimCompleted === dimQuestions.length && dimQuestions.length > 0

          return (
            <button
              key={dim.key}
              onClick={() => setActiveDimensionIndex(index)}
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">{activeDimension.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {activeQuestions.length > 0
                ? `${activeQuestions.length} 个问题`
                : '请先选择一个选项'}
            </p>
          </div>

          {/* 子分类选择器 */}
          {activeSubCategories.length > 1 && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <p className="text-sm font-medium text-gray-700 mb-3">
                请选择你的定位：
              </p>
              <div className="flex flex-wrap gap-2">
                {activeSubCategories.map((subCategory) => {
                  const isSelected = selectedSubCategories[activeDimension.key] === subCategory
                  const optionInfo = SUB_CATEGORY_OPTIONS[activeDimension.key]?.find(
                    o => o.label === subCategory
                  )

                  return (
                    <button
                      key={subCategory}
                      onClick={() => handleSubCategorySelect(activeDimension.key, subCategory)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div>{subCategory}</div>
                      {optionInfo && !isSelected && (
                        <div className="text-xs text-gray-500 mt-0.5">{optionInfo.description}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 问题列表 */}
          {activeQuestions.length > 0 && (
            <div className="p-4 space-y-6">
              {activeQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  {/* 问题文本 */}
                  <p className="text-gray-800">{question.question}</p>
                  {/* 滑动条 */}
                  <div className="mt-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={assessments[question.id] || 3}
                      onChange={(e) =>
                        handleAssessmentChange(question.id, parseInt(e.target.value) as QuestionLevel)
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <span
                          key={level}
                          className={`${
                            assessments[question.id] === level ? 'text-blue-600 font-medium' : ''
                          }`}
                        >
                          {ASSESSMENT_LEVELS[level as QuestionLevel].label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 未选择子分类提示 */}
          {activeSubCategories.length > 1 && activeQuestions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <p>请先在上方选择一个选项，然后回答相关问题</p>
            </div>
          )}

          {/* 无问题提示 */}
          {activeSubCategories.length <= 1 && activeQuestions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <p>该维度暂无问题</p>
            </div>
          )}
        </div>
      )}

      {/* 无问题提示 */}
      {dimensions.length === 0 && (
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">暂无问题可评估</p>
          <p className="text-sm text-gray-500 mt-2">
            请先在 <button onClick={() => navigate('/profile/preferences')} className="text-blue-600 hover:underline">偏好设置</button> 中完善你的职业偏好
          </p>
        </div>
      )}

      {/* 底部操作栏 */}
      {dimensions.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setActiveDimensionIndex(Math.max(0, activeDimensionIndex - 1))}
            disabled={activeDimensionIndex === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← 上一维度
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveDimensionIndex(Math.min(dimensions.length - 1, activeDimensionIndex + 1))}
              disabled={activeDimensionIndex === dimensions.length - 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一维度 →
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting || progress.completed < dynamicQuestions.length}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                progress.completed >= dynamicQuestions.length
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? '提交中...' : '完成评估'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CognitiveBoundaryAssessment