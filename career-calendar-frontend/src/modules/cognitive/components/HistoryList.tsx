/**
 * 认知历史列表组件
 */
import React from 'react'
import type { CognitiveHistory } from '../types'

interface HistoryListProps {
  history: CognitiveHistory[]
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
  if (history.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y">
      {history.slice(0, 10).map((item, index) => (
        <div key={index} className="p-4">
          {/* 日期和触发原因 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {item.triggeredBy}
            </span>
          </div>

          {/* 维度变化 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {item.dimensions.map((dim, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{dim.name}</span>
                <span className="font-medium text-gray-900">{dim.score}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default HistoryList