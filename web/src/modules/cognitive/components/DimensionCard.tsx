/**
 * 认知维度卡片组件
 */
import React from 'react'
import type { KnowledgeSource } from '../types'

interface DimensionCardProps {
  name: string
  score: number
  knowledgeSource: KnowledgeSource[]
}

// 知识来源类型映射
const SOURCE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  self_exploration: { label: '自我探索', color: 'bg-green-100 text-green-700' },
  others_sharing: { label: '他人分享', color: 'bg-emerald-100 text-emerald-700' },
  round_table: { label: '圆桌讨论', color: 'bg-blue-100 text-blue-700' },
  study_buddy: { label: '学习伙伴', color: 'bg-purple-100 text-purple-700' },
  case_study: { label: '案例实践', color: 'bg-orange-100 text-orange-700' },
}

// 获取分数对应的颜色
const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  if (score >= 20) return 'bg-orange-500'
  return 'bg-gray-300'
}

export const DimensionCard: React.FC<DimensionCardProps> = ({
  name,
  score,
  knowledgeSource,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* 标题和分数 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">{name}</h3>
        <span className="text-lg font-bold text-blue-600">{score}</span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`${getScoreColor(score)} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      {/* 知识来源标签 */}
      {knowledgeSource.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {knowledgeSource.slice(0, 3).map((source, i) => {
            const typeInfo = SOURCE_TYPE_LABELS[source.type] || {
              label: source.type,
              color: 'bg-gray-100 text-gray-700',
            }
            return (
              <span
                key={i}
                className={`px-2 py-0.5 text-xs rounded-full ${typeInfo.color}`}
              >
                {typeInfo.label}
              </span>
            )
          })}
          {knowledgeSource.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
              +{knowledgeSource.length - 3}
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">暂无认知来源记录</p>
      )}
    </div>
  )
}

export default DimensionCard