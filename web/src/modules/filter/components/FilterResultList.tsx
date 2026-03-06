/**
 * 筛选结果列表组件
 * 显示筛选后的事件列表
 */
import { useFilterResults } from '../hooks/useFilter'
import { getMatchScoreLevel } from '../utils/filterUtils'
import type { FilteredEvent } from '../types'

interface FilterResultListProps {
  onItemClick?: (event: FilteredEvent) => void
}

export function FilterResultList({ onItemClick }: FilterResultListProps) {
  const { events, total, loading, currentPage, totalPages, loadPage, hasNext, hasPrev } = useFilterResults()

  // 加载中状态
  if (loading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-500">加载中...</p>
      </div>
    )
  }

  // 空状态
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="mt-3 text-gray-500">没有找到匹配的事件</p>
        <p className="text-sm text-gray-400">请尝试调整筛选条件</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* 结果统计 */}
      <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600">
        共找到 <span className="font-medium text-gray-900">{total}</span> 个匹配事件
      </div>

      {/* 事件列表 */}
      {events.map((event) => (
        <FilterResultItem
          key={event.id}
          event={event}
          onClick={() => onItemClick?.(event)}
        />
      ))}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <button
            onClick={() => loadPage(currentPage - 1)}
            disabled={!hasPrev}
            className={`
              px-3 py-1.5 text-sm rounded
              ${hasPrev
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-gray-400 cursor-not-allowed'
              }
            `}
          >
            上一页
          </button>

          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => loadPage(currentPage + 1)}
            disabled={!hasNext}
            className={`
              px-3 py-1.5 text-sm rounded
              ${hasNext
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-gray-400 cursor-not-allowed'
              }
            `}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * 筛选结果项组件
 */
interface FilterResultItemProps {
  event: FilteredEvent
  onClick?: () => void
}

function FilterResultItem({ event, onClick }: FilterResultItemProps) {
  // 企业类型颜色
  const getCompanyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      soe: 'bg-gray-100 text-gray-800',
      foreign: 'bg-purple-100 text-purple-800',
      private: 'bg-yellow-100 text-yellow-800',
      startup: 'bg-orange-100 text-orange-800',
      government: 'bg-blue-100 text-blue-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  // 企业类型标签
  const getCompanyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      soe: '国企',
      foreign: '外企',
      private: '民企',
      startup: '创业',
      government: '事业单位',
    }
    return labels[type] || type
  }

  // 匹配度显示
  const matchLevel = event.matchScore !== undefined
    ? getMatchScoreLevel(event.matchScore)
    : null

  return (
    <div
      onClick={onClick}
      className="px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        {/* 左侧信息 */}
        <div className="flex-1 min-w-0">
          {/* 企业类型标签 */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                ${getCompanyTypeColor(event.companyType)}
              `}
            >
              {getCompanyTypeLabel(event.companyType)}
            </span>
            <span className="text-sm text-gray-500">{event.company}</span>
          </div>

          {/* 职位标题 */}
          <h3 className="text-base font-medium text-gray-900 truncate">
            {event.position}
          </h3>

          {/* 事件标题 */}
          <p className="text-sm text-gray-600 truncate mt-1">
            {event.title}
          </p>

          {/* 日期 */}
          <p className="text-xs text-gray-400 mt-1">
            {event.eventDate}
          </p>
        </div>

        {/* 右侧匹配度 */}
        {matchLevel && (
          <div className="flex flex-col items-end">
            <span className={`text-lg font-bold ${matchLevel.color}`}>
              {event.matchScore}%
            </span>
            <span className="text-xs text-gray-500">{matchLevel.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterResultList