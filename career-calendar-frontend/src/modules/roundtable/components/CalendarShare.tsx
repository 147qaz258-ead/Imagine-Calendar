/**
 * 日历共享组件
 * TASK-4.4: 日历共享功能
 */
import { useState, useEffect } from 'react'
import { roundTableApi, type CalendarShareItem, type MemberAvailability, type AvailabilitySlot } from '../services/roundTableApi'

interface CalendarShareProps {
  groupId: string
  isLeader: boolean
}

export function CalendarShare({ groupId, isLeader }: CalendarShareProps) {
  if (isLeader) {
    return <LeaderCalendarShare groupId={groupId} />
  }
  return <MemberCalendarShare groupId={groupId} />
}

/**
 * 组长视角的日历共享组件
 */
function LeaderCalendarShare({ groupId }: { groupId: string }) {
  const [shares, setShares] = useState<CalendarShareItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availability, setAvailability] = useState<MemberAvailability[]>([])
  const [showAvailability, setShowAvailability] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: getDateString(0),
    endDate: getDateString(7),
  })

  // 获取共享状态
  const fetchShareStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await roundTableApi.getCalendarShareStatus(groupId)
      if (response.success) {
        setShares(response.data.shares)
      }
    } catch (err) {
      setError('获取共享状态失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShareStatus()
  }, [groupId])

  // 发起共享邀请
  const handleRequestShare = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await roundTableApi.requestCalendarShare(groupId)
      if (response.success) {
        setShares(response.data.shares)
      }
    } catch (err) {
      setError('发起邀请失败')
    } finally {
      setLoading(false)
    }
  }

  // 查看成员空闲时间
  const handleViewAvailability = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await roundTableApi.getMembersAvailability(
        groupId,
        dateRange.startDate,
        dateRange.endDate,
      )
      if (response.success) {
        setAvailability(response.data.availability)
        setShowAvailability(true)
      }
    } catch (err) {
      setError('获取空闲时间失败')
    } finally {
      setLoading(false)
    }
  }

  const acceptedCount = shares.filter((s) => s.status === 'accepted').length
  const pendingCount = shares.filter((s) => s.status === 'pending').length
  const hasAccepted = acceptedCount > 0

  if (loading && shares.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">日历共享</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {shares.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 mb-4">尚未发起日历共享邀请</p>
          <button
            onClick={handleRequestShare}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            发起共享邀请
          </button>
        </div>
      ) : (
        <>
          {/* 统计信息 */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">已接受: {acceptedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">待确认: {pendingCount}</span>
            </div>
          </div>

          {/* 成员列表 */}
          <div className="space-y-2 mb-4">
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {share.avatar ? (
                      <img src={share.avatar} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {share.nickname.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-700">{share.nickname}</span>
                </div>
                <ShareStatusBadge status={share.status} />
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {pendingCount > 0 && (
              <button
                onClick={handleRequestShare}
                disabled={loading}
                className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
              >
                重新发送邀请
              </button>
            )}
            {hasAccepted && (
              <button
                onClick={handleViewAvailability}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                查看空闲时间
              </button>
            )}
          </div>

          {/* 日期范围选择 */}
          {hasAccepted && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-500">查看范围:</span>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="px-2 py-1 border rounded"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="px-2 py-1 border rounded"
              />
            </div>
          )}
        </>
      )}

      {/* 空闲时间展示 */}
      {showAvailability && availability.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-md font-medium text-gray-900 mb-4">成员空闲时间</h3>
          <AvailabilityGrid availability={availability} />
          <button
            onClick={() => setShowAvailability(false)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            收起
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * 成员视角的日历共享组件
 */
function MemberCalendarShare({ groupId }: { groupId: string }) {
  const [shares, setShares] = useState<CalendarShareItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  // 获取共享邀请
  const fetchShares = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await roundTableApi.getCalendarShareStatus(groupId)
      if (response.success) {
        setShares(response.data.shares)
      }
    } catch (err) {
      setError('获取邀请失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShares()
  }, [groupId])

  // 接受共享
  const handleAccept = async (shareId: string) => {
    setProcessing(shareId)
    setError(null)
    try {
      const response = await roundTableApi.acceptCalendarShare(groupId, shareId)
      if (response.success) {
        await fetchShares()
      }
    } catch (err) {
      setError('接受邀请失败')
    } finally {
      setProcessing(null)
    }
  }

  // 拒绝共享
  const handleDecline = async (shareId: string) => {
    setProcessing(shareId)
    setError(null)
    try {
      const response = await roundTableApi.declineCalendarShare(groupId, shareId)
      if (response.success) {
        await fetchShares()
      }
    } catch (err) {
      setError('拒绝邀请失败')
    } finally {
      setProcessing(null)
    }
  }

  const pendingShares = shares.filter((s) => s.status === 'pending')

  if (loading && shares.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (shares.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">日历共享邀请</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {pendingShares.length > 0 ? (
        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            组长希望查看您的空闲时间，以便安排群组活动。
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAccept(pendingShares[0].id)}
              disabled={processing === pendingShares[0].id}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {processing === pendingShares[0].id ? '处理中...' : '同意共享'}
            </button>
            <button
              onClick={() => handleDecline(pendingShares[0].id)}
              disabled={processing === pendingShares[0].id}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              拒绝
            </button>
          </div>
          <p className="text-xs text-gray-400">
            同意后，组长只能看到您的空闲/忙碌状态，无法查看具体事件内容。
          </p>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          {shares[0]?.status === 'accepted' ? (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              您已同意共享日历
            </div>
          ) : shares[0]?.status === 'declined' ? (
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              您已拒绝共享日历
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

/**
 * 共享状态徽章
 */
function ShareStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待确认' },
    accepted: { bg: 'bg-green-100', text: 'text-green-700', label: '已接受' },
    declined: { bg: 'bg-gray-100', text: 'text-gray-600', label: '已拒绝' },
  }

  const { bg, text, label } = config[status] || config.pending

  return (
    <span className={`px-2 py-1 text-xs rounded ${bg} ${text}`}>
      {label}
    </span>
  )
}

/**
 * 空闲时间网格展示
 */
function AvailabilityGrid({ availability }: { availability: MemberAvailability[] }) {
  if (availability.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        暂无成员接受共享
      </div>
    )
  }

  // 按日期分组时间段
  const dates = new Set<string>()
  availability.forEach((member) => {
    member.slots.forEach((slot) => dates.add(slot.date))
  })
  const sortedDates = Array.from(dates).sort()

  const timeSlots = [
    { label: '上午', startTime: '09:00' },
    { label: '下午', startTime: '14:00' },
    { label: '晚上', startTime: '19:00' },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-3 text-left font-medium text-gray-600">成员</th>
            {sortedDates.map((date) => (
              <th key={date} className="py-2 px-3 text-center font-medium text-gray-600">
                {formatDate(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {availability.map((member) => (
            <tr key={member.userId} className="border-b">
              <td className="py-2 px-3 text-gray-700">{member.nickname}</td>
              {sortedDates.map((date) => (
                <td key={date} className="py-2 px-1">
                  <div className="flex flex-col gap-1">
                    {timeSlots.map((timeSlot) => {
                      const slot = member.slots.find(
                        (s) => s.date === date && s.startTime === timeSlot.startTime,
                      )
                      return (
                        <div
                          key={timeSlot.startTime}
                          className={`w-full h-2 rounded ${
                            slot?.status === 'available' ? 'bg-green-400' : 'bg-gray-300'
                          }`}
                          title={`${timeSlot.label}: ${slot?.status === 'available' ? '空闲' : '忙碌'}`}
                        />
                      )
                    })}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-400 rounded" />
          <span>空闲</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-300 rounded" />
          <span>忙碌</span>
        </div>
      </div>
    </div>
  )
}

/**
 * 获取日期字符串
 */
function getDateString(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}/${date.getDate()} ${weekdays[date.getDay()]}`
}

export default CalendarShare