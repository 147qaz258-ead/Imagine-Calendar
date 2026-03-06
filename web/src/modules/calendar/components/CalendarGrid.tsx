/**
 * 日历格子组件 - 显示每一天
 */
import { useMemo } from 'react'
import { useAppSelector } from '@/store/hooks'
import { CalendarDay } from './CalendarDay'
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getPrevMonthDays,
  getNextMonthDays,
  getWeekDayNames,
} from '../utils/dateUtils'

interface CalendarGridProps {
  onEventClick?: (eventId: string) => void
}

export function CalendarGrid({ onEventClick }: CalendarGridProps) {
  const { currentYear, currentMonth, eventsByDate } = useAppSelector(state => state.calendar)

  // 计算日历网格数据
  const calendarData = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const prevMonthDays = getPrevMonthDays(currentYear, currentMonth)
    const nextMonthDays = getNextMonthDays(currentYear, currentMonth)

    return {
      daysInMonth,
      firstDay,
      prevMonthDays,
      nextMonthDays,
    }
  }, [currentYear, currentMonth])

  const weekDays = getWeekDayNames()

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 星期头部 */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`py-3 text-center text-sm font-medium text-gray-600 ${
              index === 0 || index === 6 ? 'text-red-500' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7">
        {/* 上月填充日期 */}
        {calendarData.prevMonthDays.map((day) => (
          <CalendarDay
            key={`prev-${day}`}
            day={day}
            isCurrentMonth={false}
            isPrevMonth
            currentYear={currentYear}
            currentMonth={currentMonth}
            eventsByDate={eventsByDate}
          />
        ))}

        {/* 当月日期 */}
        {Array.from({ length: calendarData.daysInMonth }, (_, i) => i + 1).map((day) => (
          <CalendarDay
            key={`current-${day}`}
            day={day}
            isCurrentMonth
            currentYear={currentYear}
            currentMonth={currentMonth}
            eventsByDate={eventsByDate}
            onEventClick={onEventClick}
          />
        ))}

        {/* 下月填充日期 */}
        {calendarData.nextMonthDays.map((day) => (
          <CalendarDay
            key={`next-${day}`}
            day={day}
            isCurrentMonth={false}
            isPrevMonth={false}
            currentYear={currentYear}
            currentMonth={currentMonth}
            eventsByDate={eventsByDate}
          />
        ))}
      </div>
    </div>
  )
}

export default CalendarGrid