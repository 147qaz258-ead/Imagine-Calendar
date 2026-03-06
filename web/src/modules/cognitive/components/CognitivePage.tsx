/**
 * 认知图谱页面
 */
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCognitiveMap, fetchCognitiveHistory } from '../store/cognitiveSlice'
import { fetchCurrentUser } from '@/modules/auth/store/authSlice'
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

  // 获取维度数据
  const dimensions = cognitiveMap?.dimensions?.length
    ? cognitiveMap.dimensions.map((d) => ({ name: d.name, score: d.score }))
    : DEFAULT_DIMENSIONS

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
          认知图谱记录了你在职业发展各维度的认知深度。通过参与圆桌讨论、学习伙伴互动、案例分析等活动，可以不断拓展认知边界。
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
            暂无认知演进记录。参与圆桌讨论、案例分析等活动后，认知变化将在此记录。
          </div>
        )}
      </div>

      {/* 快速入口 */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/roundtable')}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
        >
          <h3 className="font-medium text-gray-900">参加圆桌讨论</h3>
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