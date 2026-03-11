/**
 * 日历头部组件 - 月份切换导航
 */
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { prevMonth, nextMonth, goToToday } from '../store/calendarSlice'
import { getMonthName } from '../utils/dateUtils'

export function CalendarHeader() {
  const dispatch = useAppDispatch()
  const { currentYear, currentMonth, loading } = useAppSelector(state => state.calendar)

  return (
    <div className="flex items-center justify-between mb-6">
      {/* 左侧月份导航 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(prevMonth())}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          aria-label="上一月"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-gray-900 min-w-[120px] text-center">
          {currentYear}年 {getMonthName(currentMonth)}
        </h2>

        <button
          onClick={() => dispatch(nextMonth())}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          aria-label="下一月"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 右侧操作按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(goToToday())}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          回到今天
        </button>
      </div>
    </div>
  )
}

export default CalendarHeader