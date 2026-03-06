/**
 * 筛选页面组件
 * 独立的筛选页面，用于详细设置筛选条件
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterPanel } from '../components/FilterPanel'
import { useFilterActions, useFilterResults, useFilterPersistence } from '../hooks/useFilter'
import { countFilters } from '../utils/filterUtils'

export function FilterPage() {
  const navigate = useNavigate()
  const [isApplying, setIsApplying] = useState(false)

  const { appliedFilters } = useFilterActions()
  const { total, executeFilter } = useFilterResults(300)
  const { saveFilters } = useFilterPersistence()

  // 初始筛选计数
  const filterCount = countFilters(appliedFilters)

  // 页面加载时执行筛选
  useEffect(() => {
    if (filterCount > 0) {
      executeFilter(appliedFilters)
    }
  }, [])

  // 应用筛选回调
  const handleApply = async () => {
    setIsApplying(true)
    try {
      saveFilters()
      // 返回日历页面
      navigate('/calendar')
    } finally {
      setIsApplying(false)
    }
  }

  // 关闭回调
  const handleClose = () => {
    navigate('/calendar')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">筛选条件</h1>
          </div>

          {/* 筛选结果数量 */}
          {filterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                找到 <span className="font-medium text-gray-900">{total}</span> 个匹配结果
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          <FilterPanel onApply={handleApply} onClose={handleClose} />
        </div>
      </main>

      {/* 应用中遮罩 */}
      {isApplying && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700">正在应用筛选...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterPage