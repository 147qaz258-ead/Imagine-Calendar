/**
 * 日历模块入口
 */

// 类型
export * from './types'

// API 服务
export { calendarApi } from './services/calendarApi'

// Redux
export {
  fetchCalendarEvents,
  fetchEventDetail,
  followEvent,
  unfollowEvent,
  setMonth,
  prevMonth,
  nextMonth,
  goToToday,
  clearSelectedEvent,
  clearError,
} from './store/calendarSlice'
export { default as calendarReducer } from './store/calendarSlice'

// 组件
export {
  Calendar,
  CalendarHeader,
  CalendarGrid,
  CalendarDay,
  EventCard,
  EventDetailModal,
} from './components'

// 工具函数
export {
  getDaysInMonth,
  getFirstDayOfMonth,
  getPrevMonthDays,
  getNextMonthDays,
  formatDate,
  isToday,
  groupEventsByDate,
  getMonthName,
  getWeekDayNames,
  getDaysDiff,
} from './utils/dateUtils'