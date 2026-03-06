/**
 * 筛选面板组件
 * 包含13维度筛选、预设方案、操作按钮
 */
import { FilterDimension } from './FilterDimension'
import { PresetSelector } from './PresetSelector'
import { useFilterOptions, useFilterPanel, useFilterActions, useFilterPersistence } from '../hooks/useFilter'
import { FILTER_DIMENSIONS, type FilterPreset } from '../types'
import type { UserPreferences } from '../types'

interface FilterPanelProps {
  onApply?: () => void
  onClose?: () => void
}

export function FilterPanel({ onApply, onClose }: FilterPanelProps) {
  const { options, loading: optionsLoading } = useFilterOptions()
  const { expandedDimensions, filterCount, hasChanges, close, toggleDimension, expandAll, collapseAll } = useFilterPanel()
  const { filters, updateFilter, applyFilters, clearFilters, resetFilters, applyPreset } = useFilterActions()
  const { saveFilters } = useFilterPersistence()

  // 当前匹配的预设方案
  const getCurrentPresetId = (): string | undefined => {
    // 简单判断是否匹配某个预设
    return undefined
  }

  // 应用预设
  const handleApplyPreset = (preset: FilterPreset) => {
    applyPreset(preset)
  }

  // 应用筛选
  const handleApply = () => {
    applyFilters()
    saveFilters()
    onApply?.()
  }

  // 清空筛选
  const handleClear = () => {
    clearFilters()
  }

  // 取消
  const handleCancel = () => {
    resetFilters()
    close()
    onClose?.()
  }

  // 维度选择变化
  const handleDimensionChange = (key: string, values: string[]) => {
    updateFilter(key as keyof UserPreferences, values)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">筛选条件</h2>
        <button
          onClick={handleCancel}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 加载状态 */}
        {optionsLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* 预设方案 */}
        {!optionsLoading && (
          <PresetSelector
            onApplyPreset={handleApplyPreset}
            currentPresetId={getCurrentPresetId()}
          />
        )}

        {/* 维度展开/收起控制 */}
        {!optionsLoading && (
          <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-100">
            <button
              onClick={expandAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              全部展开
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              全部收起
            </button>
          </div>
        )}

        {/* 13维度筛选 */}
        {!optionsLoading && (
          <div className="divide-y divide-gray-100">
            {FILTER_DIMENSIONS.map((dimension) => (
              <FilterDimension
                key={dimension.key}
                dimension={dimension}
                options={options[dimension.key] || []}
                selectedValues={filters[dimension.key] || []}
                onChange={handleDimensionChange}
                expanded={expandedDimensions.includes(dimension.key)}
                onToggleExpand={toggleDimension}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
        {/* 清空按钮 */}
        <button
          onClick={handleClear}
          disabled={filterCount === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          清空筛选
        </button>

        {/* 操作按钮组 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            disabled={!hasChanges && filterCount === 0}
            className={`
              px-4 py-2 rounded-lg font-medium
              ${
                hasChanges || filterCount > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {filterCount > 0 ? `应用筛选 (${filterCount})` : '应用筛选'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel