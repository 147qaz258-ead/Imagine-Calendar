/**
 * 日历工具函数
 */

import type { CalendarEvent, EventsByDate } from '../types'

/**
 * 获取月份的天数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * 获取月份第一天是星期几（0=周日, 1=周一, ...）
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

/**
 * 获取上月天数（用于填充日历前的空白）
 */
export function getPrevMonthDays(year: number, month: number): number[] {
  const firstDay = getFirstDayOfMonth(year, month)
  if (firstDay === 0) return [] // 周日开头，不需要填充

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

  const days: number[] = []
  for (let i = daysInPrevMonth - firstDay + 1; i <= daysInPrevMonth; i++) {
    days.push(i)
  }
  return days
}

/**
 * 获取下月天数（用于填充日历后的空白）
 */
export function getNextMonthDays(year: number, month: number): number[] {
  const daysInMonth = getDaysInMonth(year, month)
  const lastDay = new Date(year, month - 1, daysInMonth).getDay()
  if (lastDay === 6) return [] // 周六结束，不需要填充

  const days: number[] = []
  for (let i = 1; i <= 6 - lastDay; i++) {
    days.push(i)
  }
  return days
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(year: number, month: number, day: number): string {
  const monthStr = month.toString().padStart(2, '0')
  const dayStr = day.toString().padStart(2, '0')
  return `${year}-${monthStr}-${dayStr}`
}

/**
 * 检查是否为今天
 */
export function isToday(year: number, month: number, day: number): boolean {
  const today = new Date()
  return (
    today.getFullYear() === year &&
    today.getMonth() === month - 1 &&
    today.getDate() === day
  )
}

/**
 * 将事件列表按日期分组
 */
export function groupEventsByDate(events: CalendarEvent[]): EventsByDate {
  const grouped: EventsByDate = {}

  events.forEach((event) => {
    if (!grouped[event.date]) {
      grouped[event.date] = []
    }
    grouped[event.date].push(event)
  })

  return grouped
}

/**
 * 获取月份名称
 */
export function getMonthName(month: number): string {
  const months = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]
  return months[month - 1] || ''
}

/**
 * 获取星期名称
 */
export function getWeekDayNames(): string[] {
  return ['日', '一', '二', '三', '四', '五', '六']
}

/**
 * 计算两个日期之间的天数差
 */
export function getDaysDiff(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay))
}