/**
 * 筛选维度组件
 * 单个维度的展开/收起面板
 */
import type { FilterOption, DimensionConfig } from '../types'
import { FilterTagGroup } from './FilterTag'

interface FilterDimensionProps {
  dimension: DimensionConfig
  options: FilterOption[]
  selectedValues: string[]
  onChange: (key: string, values: string[]) => void
  expanded: boolean
  onToggleExpand: (key: string) => void
  disabled?: boolean
}

export function FilterDimension({
  dimension,
  options,
  selectedValues,
  onChange,
  expanded,
  onToggleExpand,
  disabled = false,
}: FilterDimensionProps) {
  const selectedCount = selectedValues.length

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* 维度标题 */}
      <button
        type="button"
        onClick={() => onToggleExpand(dimension.key)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{dimension.label}</span>
          {selectedCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {selectedCount}
            </span>
          )}
        </div>

        {/* 展开/收起图标 */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 维度内容 */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* 描述 */}
          {dimension.description && (
            <p className="text-sm text-gray-500 mb-3">{dimension.description}</p>
          )}

          {/* 标签选择 */}
          <FilterTagGroup
            options={options}
            selectedValues={selectedValues}
            onChange={(values) => onChange(dimension.key, values)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}

export default FilterDimension