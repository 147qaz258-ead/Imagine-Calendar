/**
 * 日历单日格子组件
 */
import type { CalendarEvent, EventsByDate } from '../types'
import { isToday, formatDate } from '../utils/dateUtils'
import { EventCard } from './EventCard'

interface CalendarDayProps {
  day: number
  isCurrentMonth: boolean
  isPrevMonth?: boolean
  currentYear: number
  currentMonth: number
  eventsByDate: EventsByDate
  onEventClick?: (eventId: string) => void
}

export function CalendarDay({
  day,
  isCurrentMonth,
  isPrevMonth,
  currentYear,
  currentMonth,
  eventsByDate,
  onEventClick,
}: CalendarDayProps) {
  // 计算实际日期
  let actualYear = currentYear
  let actualMonth = currentMonth

  if (!isCurrentMonth) {
    if (isPrevMonth) {
      actualMonth = currentMonth === 1 ? 12 : currentMonth - 1
      actualYear = currentMonth === 1 ? currentYear - 1 : currentYear
    } else {
      actualMonth = currentMonth === 12 ? 1 : currentMonth + 1
      actualYear = currentMonth === 12 ? currentYear + 1 : currentYear
    }
  }

  const dateStr = formatDate(actualYear, actualMonth, day)
  const dayEvents = eventsByDate[dateStr] || []
  const isTodayDate = isToday(actualYear, actualMonth, day)

  // 最多显示3个事件，剩余的显示+N
  const maxVisibleEvents = 3
  const visibleEvents = dayEvents.slice(0, maxVisibleEvents)
  const remainingCount = dayEvents.length - maxVisibleEvents

  const handleEventClick = (event: CalendarEvent) => {
    onEventClick?.(event.id)
  }

  return (
    <div
      className={`min-h-[100px] border-b border-r border-gray-100 p-1 transition-colors ${
        isCurrentMonth
          ? 'bg-white hover:bg-gray-50'
          : 'bg-gray-50 text-gray-400'
      }`}
    >
      {/* 日期数字 */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-medium px-1.5 py-0.5 rounded ${
            isTodayDate
              ? 'bg-blue-600 text-white'
              : isCurrentMonth
              ? 'text-gray-900'
              : 'text-gray-400'
          }`}
        >
          {day}
        </span>
      </div>

      {/* 事件列表 */}
      {visibleEvents.length > 0 && (
        <div className="space-y-1">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={handleEventClick}
            />
          ))}
          {remainingCount > 0 && (
            <div className="text-xs text-gray-500 px-2">
              +{remainingCount} 更多
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CalendarDay