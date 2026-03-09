/**
 * 会议列表组件
 * TASK-4.5: 发起会议功能
 */
import { useEffect, useState } from 'react'
import { roundTableApi, type GroupMeeting, MeetingStatus } from '../services/roundTableApi'

interface MeetingListProps {
  groupId: string
  isLeader: boolean
  onRefresh?: () => void
}

const MeetingStatusLabels: Record<MeetingStatus, string> = {
  scheduled: '已安排',
  completed: '已完成',
  cancelled: '已取消',
}

const MeetingStatusColors: Record<MeetingStatus, { bg: string; text: string }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

export function MeetingList({ groupId, isLeader, onRefresh }: MeetingListProps) {
  const [meetings, setMeetings] = useState<GroupMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMeetings()
  }, [groupId])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      const response = await roundTableApi.getMeetings(groupId)
      setMeetings(response.data.meetings)
      setError(null)
    } catch (err) {
      setError('加载会议列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm('确定要取消这个会议吗？')) return

    try {
      await roundTableApi.cancelMeeting(groupId, meetingId)
      await loadMeetings()
      onRefresh?.()
    } catch (err) {
      alert('取消会议失败')
    }
  }

  // 格式化日期时间
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">会议列表</h3>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">会议列表</h3>
        <p className="text-red-500">{error}</p>
        <button onClick={loadMeetings} className="mt-2 text-blue-600 hover:underline">
          重试
        </button>
      </div>
    )
  }

  // 过滤掉已取消的会议
  const activeMeetings = meetings.filter(m => m.status !== 'cancelled')

  if (activeMeetings.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">会议列表</h3>

      <div className="space-y-3">
        {activeMeetings.map((meeting) => {
          const statusColor = MeetingStatusColors[meeting.status]
          const statusLabel = MeetingStatusLabels[meeting.status]

          return (
            <div
              key={meeting.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 状态和标题 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded ${statusColor.bg} ${statusColor.text}`}
                    >
                      {statusLabel}
                    </span>
                    <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                  </div>

                  {/* 时间和时长 */}
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDateTime(meeting.scheduledAt)}
                    <span className="mx-2">|</span>
                    {meeting.duration}分钟
                  </div>

                  {/* 会议链接或地点 */}
                  {(meeting.meetingUrl || meeting.location) && (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {meeting.meetingUrl ? (
                        <a
                          href={meeting.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          加入会议
                        </a>
                      ) : (
                        meeting.location
                      )}
                    </div>
                  )}

                  {/* 备注 */}
                  {meeting.notes && (
                    <p className="text-sm text-gray-500 mt-2">{meeting.notes}</p>
                  )}

                  {/* 发起人 */}
                  <p className="text-xs text-gray-400 mt-2">
                    发起人：{meeting.creatorNickname}
                  </p>
                </div>

                {/* 取消按钮 */}
                {isLeader && meeting.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancelMeeting(meeting.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MeetingList