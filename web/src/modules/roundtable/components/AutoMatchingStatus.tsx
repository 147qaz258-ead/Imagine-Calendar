/**
 * 自动匹配状态组件
 * 显示用户的群组匹配状态（替代原来的报名表单）
 */
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchRoundTables, resetApplicationStatus } from '../store/roundTableSlice'
import { useNavigate } from 'react-router-dom'

interface AutoMatchingStatusProps {
  showTitle?: boolean
}

export function AutoMatchingStatus({ showTitle = true }: AutoMatchingStatusProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { myRoundTables, loading, applicationStatus } = useAppSelector(
    (state) => state.roundTable
  )
  const { user } = useAppSelector((state) => state.auth)

  // 加载我的群组状态
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchRoundTables())
    }
  }, [dispatch, user?.id])

  // 计算匹配状态
  const matchingCount = myRoundTables.matching.length
  const upcomingCount = myRoundTables.upcoming.length
  const hasActiveMatching = matchingCount > 0

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      </div>
    )
  }

  // 如果有正在进行的群组
  if (upcomingCount > 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        {showTitle && (
          <h2 className="text-xl font-semibold text-gray-900 mb-4">我的群组</h2>
        )}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-green-800">已匹配成功</h3>
              <p className="text-sm text-green-600">
                您有 {upcomingCount} 个待进行的群组讨论
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/roundtable')}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          查看我的群组
        </button>
      </div>
    )
  }

  // 如果正在匹配中
  if (hasActiveMatching || applicationStatus.status === 'pending') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        {showTitle && (
          <h2 className="text-xl font-semibold text-gray-900 mb-4">匹配中</h2>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-blue-800">正在为您匹配</h3>
              <p className="text-sm text-blue-600">
                系统正在寻找与您志同道合的伙伴...
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center">
          匹配成功后我们会通知您，请留意消息提醒
        </p>
      </div>
    )
  }

  // 还未开始匹配（需要先完成个性化选择）
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {showTitle && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">我的群组</h2>
      )}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">即将开启</h3>
            <p className="text-sm text-gray-600">
              完成个性化选择后，自动为您匹配群组
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate('/cognitive-boundary')}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        开始认知评估
      </button>
    </div>
  )
}

export default AutoMatchingStatus