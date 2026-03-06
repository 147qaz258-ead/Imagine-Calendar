/**
 * 筛选按钮组件
 * 显示在日历页右上角，点击展开筛选面板
 */
import { useFilterPanel } from '../hooks/useFilter'

interface FilterButtonProps {
  className?: string
}

export function FilterButton({ className = '' }: FilterButtonProps) {
  const { filterCount, hasChanges, toggle } = useFilterPanel()

  return (
    <button
      onClick={toggle}
      className={`
        inline-flex items-center gap-2 px-4 py-2
        bg-white border border-gray-300 rounded-lg
        hover:bg-gray-50 transition-colors
        ${hasChanges ? 'border-blue-500 bg-blue-50' : ''}
        ${className}
      `}
    >
      {/* 筛选图标 */}
      <svg
        className="w-5 h-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>

      {/* 文字 */}
      <span className="text-gray-700">筛选</span>

      {/* 筛选数量徽章 */}
      {filterCount > 0 && (
        <span
          className={`
            inline-flex items-center justify-center
            min-w-[20px] h-5 px-1.5
            text-xs font-medium rounded-full
            ${hasChanges ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
          `}
        >
          {filterCount}
        </span>
      )}
    </button>
  )
}

export default FilterButton