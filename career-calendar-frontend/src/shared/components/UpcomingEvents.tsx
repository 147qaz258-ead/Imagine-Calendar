/**
 * 即将到来的事件组件 - 显示近期日程
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export function UpcomingEvents() {
  const navigate = useNavigate()
  const { eventsByDate } = useAppSelector(state => state.calendar)
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  // 获取未来7天的事件
  const upcomingEvents = useMemo(() => {
    if (!eventsByDate) return []

    const today = new Date()
    const events: Array<{ id: string; title: string; date: string; companyType: string }> = []

    // 遍历未来7天
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      const dayEvents = eventsByDate[dateKey]
      if (dayEvents && dayEvents.length > 0) {
        dayEvents.forEach(event => {
          events.push({
            id: event.id,
            title: event.title,
            date: dateKey,
            companyType: event.companyType || 'unknown',
          })
        })
      }

      // 最多显示5个事件
      if (events.length >= 5) break
    }

    return events.slice(0, 5)
  }, [eventsByDate])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天'
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  }

  const handleEventClick = (eventId: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // 可以触发日历中的事件详情
    navigate(`/calendar?event=${eventId}`)
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500 mb-3">近期日程</h3>
      {upcomingEvents.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">暂无近期日程</p>
      ) : (
        <div className="space-y-2">
          {upcomingEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => handleEventClick(event.id)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-xs text-gray-400 w-10 flex-shrink-0">
                {formatDate(event.date)}
              </span>
              <span className="text-sm text-gray-700 truncate">
                {event.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default UpcomingEvents