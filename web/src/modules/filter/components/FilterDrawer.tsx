/**
 * 筛选抽屉组件
 * 侧边滑出的筛选面板
 */
import { useEffect } from 'react'
import { FilterPanel } from './FilterPanel'
import { useFilterPanel } from '../hooks/useFilter'

interface FilterDrawerProps {
  open?: boolean
  onApply?: () => void
  onClose?: () => void
}

export function FilterDrawer({ open: controlledOpen, onApply, onClose }: FilterDrawerProps) {
  const { isOpen, close } = useFilterPanel()

  // 使用受控或内部状态
  const isDrawerOpen = controlledOpen !== undefined ? controlledOpen : isOpen

  // 关闭抽屉
  const handleClose = () => {
    close()
    onClose?.()
  }

  // 应用筛选
  const handleApply = () => {
    onApply?.()
    close()
  }

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isDrawerOpen])

  // 阻止背景滚动
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  if (!isDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* 抽屉内容 */}
      <div
        className={`
          absolute right-0 top-0 h-full w-full max-w-md
          bg-white shadow-xl
          transform transition-transform duration-300
          ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <FilterPanel onApply={handleApply} onClose={handleClose} />
      </div>
    </div>
  )
}

export default FilterDrawer