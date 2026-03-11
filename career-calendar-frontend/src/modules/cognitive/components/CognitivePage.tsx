/**
 * 认知图谱页面
 */
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCognitiveMap, fetchCognitiveHistory } from '../store/cognitiveSlice'
import { fetchCurrentUser } from '@/modules/auth/store/authSlice'
import { fetchAssessment } from '@/modules/cognitive-boundary/store/cognitiveBoundarySlice'
import { RadarChart } from './RadarChart'
import { DimensionCard } from './DimensionCard'
import { HistoryList } from './HistoryList'

// 默认维度（当用户没有认知图谱时显示）
const DEFAULT_DIMENSIONS = [
  { name: '行业认知', score: 0 },
  { name: '岗位理解', score: 0 },
  { name: '技能水平', score: 0 },
  { name: '职场软实力', score: 0 },
  { name: '人脉资源', score: 0 },
  { name: '自我认知', score: 0 },
]

export const CognitivePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { cognitiveMap, history, loading, error } = useAppSelector((state) => state.cognitive)
  const { user: authUser, isAuthenticated } = useAppSelector((state) => state.auth)
  const { currentAssessment } = useAppSelector((state) => state.cognitiveBoundary)

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

  // 加载认知图谱
  useEffect(() => {
    if (authUser?.id) {
      dispatch(fetchCognitiveMap(authUser.id))
      dispatch(fetchCognitiveHistory({ userId: authUser.id }))
    }
  }, [authUser?.id, dispatch])

  // 加载认知边界评估状态
  useEffect(() => {
    dispatch(fetchAssessment())
  }, [dispatch])

  // 获取维度数据
  const dimensions = cognitiveMap?.dimensions?.length
    ? cognitiveMap.dimensions.map((d) => ({ name: d.name, score: d.score }))
    : DEFAULT_DIMENSIONS

  // 检查是否已完成评估
  const hasCompletedAssessment = currentAssessment && currentAssessment.assessedQuestions > 0
  const assessmentProgress = currentAssessment
    ? Math.round((currentAssessment.assessedQuestions / currentAssessment.totalQuestions) * 100)
    : 0

  if (loading && !cognitiveMap) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">认知图谱</h1>

      {/* 认知边界评估入口 */}
      <div className="mb-6 p-5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              摸索认知边界
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              {hasCompletedAssessment
                ? `你已完成 ${assessmentProgress}% 的认知边界评估，继续完善可帮助生成更准确的认知图谱`
                : '通过系统评估了解你在职业发展各维度的认知深度，生成个性化认知图谱'}
            </p>
          </div>
          <button
            onClick={() => navigate('/cognitive-boundary')}
            className="px-5 py-2.5 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors shadow-sm"
          >
            {hasCompletedAssessment ? '继续评估' : '开始评估'}
          </button>
        </div>
        {hasCompletedAssessment && assessmentProgress < 100 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-purple-100 mb-1">
              <span>评估进度</span>
              <span>{assessmentProgress}%</span>
            </div>
            <div className="w-full h-2 bg-purple-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${assessmentProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 说明 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          认知图谱记录了你在职业发展各维度的认知深度。通过参与群组讨论、学习伙伴互动、案例分析等活动，可以不断拓展认知边界。
        </p>
      </div>

      {/* 图谱展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 雷达图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">认知雷达图</h2>
          <RadarChart dimensions={dimensions} />
        </div>

        {/* 维度卡片列表 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">各维度详情</h2>
          {dimensions.map((dim) => (
            <DimensionCard
              key={dim.name}
              name={dim.name}
              score={dim.score}
              knowledgeSource={
                cognitiveMap?.dimensions?.find((d) => d.name === dim.name)?.knowledgeSource || []
              }
            />
          ))}
        </div>
      </div>

      {/* 历史记录 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">认知演进历史</h2>
        {history.length > 0 ? (
          <HistoryList history={history} />
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            暂无认知演进记录。参与群组讨论、案例分析等活动后，认知变化将在此记录。
          </div>
        )}
      </div>

      {/* 快速入口 */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/roundtable')}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
        >
          <h3 className="font-medium text-gray-900">参加群组讨论</h3>
          <p className="text-sm text-gray-500 mt-1">与他人交流，拓展认知边界</p>
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
        >
          <h3 className="font-medium text-gray-900">查看招聘日历</h3>
          <p className="text-sm text-gray-500 mt-1">发现机会，积累行业认知</p>
        </button>
      </div>
    </div>
  )
}

export default CognitivePage