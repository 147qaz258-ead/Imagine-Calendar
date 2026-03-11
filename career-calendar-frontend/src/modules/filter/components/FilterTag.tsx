/**
 * 筛选标签组件
 * 多选标签选择器
 */
import type { FilterOption } from '../types'

interface FilterTagProps {
  option: FilterOption
  selected: boolean
  onToggle: (value: string) => void
  disabled?: boolean
}

export function FilterTag({ option, selected, onToggle, disabled = false }: FilterTagProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(option.value)}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        text-sm rounded-full border transition-all
        ${
          selected
            ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={option.description}
    >
      {selected && (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>{option.label}</span>
    </button>
  )
}

interface FilterTagGroupProps {
  options: FilterOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
  max?: number
}

export function FilterTagGroup({
  options,
  selectedValues,
  onChange,
  disabled = false,
  max,
}: FilterTagGroupProps) {
  const handleToggle = (value: string) => {
    if (disabled) return

    const isSelected = selectedValues.includes(value)

    if (isSelected) {
      // 取消选择
      onChange(selectedValues.filter((v) => v !== value))
    } else {
      // 添加选择
      if (max && selectedValues.length >= max) {
        // 已达到最大选择数量
        return
      }
      onChange([...selectedValues, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <FilterTag
          key={option.value}
          option={option}
          selected={selectedValues.includes(option.value)}
          onToggle={handleToggle}
          disabled={disabled || (max !== undefined && !selectedValues.includes(option.value) && selectedValues.length >= max)}
        />
      ))}
    </div>
  )
}

export default FilterTag