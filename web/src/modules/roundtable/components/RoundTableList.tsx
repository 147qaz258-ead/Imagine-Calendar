/**
 * 圆桌列表组件
 */
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchRoundTables } from '../store/roundTableSlice'
import { RoundTableCard } from './RoundTableCard'
import { ApplyForm } from './ApplyForm'
import type { RoundTable } from '../types'
import { RoundTableStatus, RoundTableStatusLabels } from '../types'

type TabType = 'all' | 'matching' | 'upcoming' | 'completed'

interface RoundTableListProps {
  onViewDetail?: (id: string) => void
}

export function RoundTableList({ onViewDetail }: RoundTableListProps) {
  const dispatch = useAppDispatch()
  const { myRoundTables, loading, error } = useAppSelector(state => state.roundTable)

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [showApplyForm, setShowApplyForm] = useState(false)

  // 加载数据
  useEffect(() => {
    dispatch(fetchRoundTables())
  }, [dispatch])

  // 获取当前Tab的圆桌列表
  const getCurrentRoundTables = (): RoundTable[] => {
    switch (activeTab) {
      case 'matching':
        return myRoundTables.matching
      case 'upcoming':
        return myRoundTables.upcoming
      case 'completed':
        return myRoundTables.completed
      default:
        return [
          ...myRoundTables.matching,
          ...myRoundTables.upcoming,
          ...myRoundTables.completed,
        ]
    }
  }

  const roundTables = getCurrentRoundTables()

  // Tab配置
  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: myRoundTables.matching.length + myRoundTables.upcoming.length + myRoundTables.completed.length },
    { key: 'matching', label: '匹配中', count: myRoundTables.matching.length },
    { key: 'upcoming', label: '即将开始', count: myRoundTables.upcoming.length },
    { key: 'completed', label: '已完成', count: myRoundTables.completed.length },
  ]

  if (showApplyForm) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setShowApplyForm(false)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回列表
          </button>
        </div>
        <ApplyForm
          onSuccess={() => {
            setShowApplyForm(false)
            dispatch(fetchRoundTables())
          }}
          onCancel={() => setShowApplyForm(false)}
        />
      </div>
    )
  }

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">我的圆桌</h2>
        <button
          onClick={() => setShowApplyForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          报名圆桌
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tab切换 */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 加载中 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* 空状态 */}
      {!loading && roundTables.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无圆桌</h3>
          <p className="text-gray-500 mb-4">
            {activeTab === 'all'
              ? '您还没有参与任何圆桌讨论'
              : `暂无${RoundTableStatusLabels[activeTab as RoundTableStatus] || ''}的圆桌`}
          </p>
          <button
            onClick={() => setShowApplyForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            立即报名
          </button>
        </div>
      )}

      {/* 圆桌列表 */}
      {!loading && roundTables.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roundTables.map(roundTable => (
            <RoundTableCard
              key={roundTable.id}
              roundTable={roundTable}
              onClick={() => onViewDetail?.(roundTable.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RoundTableList