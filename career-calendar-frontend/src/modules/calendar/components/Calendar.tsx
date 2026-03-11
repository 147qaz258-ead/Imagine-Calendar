/**
 * 日历主组件
 */
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCalendarEvents } from '../store/calendarSlice'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { EventDetailModal } from './EventDetailModal'

export function Calendar() {
  const dispatch = useAppDispatch()
  const { currentYear, currentMonth, loading, error } = useAppSelector(state => state.calendar)

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // 加载日历数据
  useEffect(() => {
    dispatch(fetchCalendarEvents({ year: currentYear, month: currentMonth }))
  }, [currentYear, currentMonth, dispatch])

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId)
  }

  const handleCloseModal = () => {
    setSelectedEventId(null)
  }

  return (
    <div>
      {/* 日历头部 */}
      <CalendarHeader />

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 加载中遮罩 */}
      {loading && (
        <div className="mb-4 flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      )}

      {/* 日历网格 */}
      <CalendarGrid onEventClick={handleEventClick} />

      {/* 图例 */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span>企业类型：</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-400" />
            国企
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-purple-400" />
            外企
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-400" />
            民企
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-orange-400" />
            创业公司
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-400" />
            事业单位
          </span>
        </div>
      </div>

      {/* 事件详情弹窗 */}
      <EventDetailModal
        eventId={selectedEventId}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default Calendar