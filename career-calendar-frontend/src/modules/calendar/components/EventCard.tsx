/**
 * 事件卡片组件 - 显示在日历格子中的事件简要信息
 */
import type { CalendarEvent } from '../types'
import { CompanyTypeColors, CompanyType } from '../types'

interface EventCardProps {
  event: CalendarEvent
  onClick?: (event: CalendarEvent) => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  const colors = CompanyTypeColors[event.companyType] || CompanyTypeColors[CompanyType.PRIVATE]

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(event)
      }}
      className={`w-full text-left px-2 py-1 rounded text-xs truncate transition-colors ${colors.bg} ${colors.text} hover:opacity-80 border-l-2 ${colors.border}`}
      title={`${event.title} - ${event.company}`}
    >
      <span className="font-medium">{event.title}</span>
      {event.company && (
        <span className="ml-1 opacity-75">· {event.company}</span>
      )}
    </button>
  )
}

export default EventCard