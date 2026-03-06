/**
 * 预设方案选择器
 * 快速应用预设筛选方案
 */
import { FILTER_PRESETS, type FilterPreset } from '../types'

interface PresetSelectorProps {
  onApplyPreset: (preset: FilterPreset) => void
  currentPresetId?: string
  disabled?: boolean
}

export function PresetSelector({ onApplyPreset, currentPresetId, disabled = false }: PresetSelectorProps) {
  // 预设图标
  const getPresetIcon = (icon: string) => {
    switch (icon) {
      case 'code':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        )
      case 'building':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        )
      case 'rocket':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )
      case 'balance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        )
    }
  }

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">快捷方案</h3>

      <div className="grid grid-cols-2 gap-2">
        {FILTER_PRESETS.map((preset) => {
          const isActive = preset.id === currentPresetId

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              disabled={disabled}
              className={`
                flex items-start gap-2 p-3 rounded-lg border text-left
                transition-all
                ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* 图标 */}
              <span
                className={`flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}
              >
                {getPresetIcon(preset.icon)}
              </span>

              {/* 内容 */}
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {preset.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PresetSelector