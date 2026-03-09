/**
 * 创建会议表单组件
 * TASK-4.5: 发起会议功能
 */
import { useState } from 'react'
import type { TimeConflict } from '../services/roundTableApi'
import { roundTableApi } from '../services/roundTableApi'

interface CreateMeetingFormProps {
  groupId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateMeetingForm({ groupId, onSuccess, onCancel }: CreateMeetingFormProps) {
  const [title, setTitle] = useState('群组讨论会议')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(120)
  const [meetingUrl, setMeetingUrl] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<TimeConflict[] | null>(null)

  // 合并日期和时间
  const combineDateTime = (dateStr: string, timeStr: string): string => {
    if (!dateStr || !timeStr) return ''
    return `${dateStr}T${timeStr}:00`
  }

  // 提交创建
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setConflicts(null)

    if (!date || !time) {
      setError('请选择会议日期和时间')
      return
    }

    const scheduledAt = combineDateTime(date, time)
    if (!scheduledAt) {
      setError('日期时间格式错误')
      return
    }

    setLoading(true)

    try {
      await roundTableApi.createMeeting(groupId, {
        title,
        scheduledAt,
        duration,
        meetingUrl: meetingUrl || undefined,
        location: location || undefined,
        notes: notes || undefined,
      })

      // 成功
      onSuccess?.()
    } catch (err: unknown) {
      const errorResponse = err as { code?: string; message?: string; conflicts?: TimeConflict[] }
      if (errorResponse.code === 'TIME_CONFLICT') {
        setError(errorResponse.message || '所选时间与成员已有事件冲突')
        setConflicts(errorResponse.conflicts || null)
      } else {
        setError(errorResponse.message || '创建会议失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">发起会议</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 会议标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会议标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入会议标题"
            required
          />
        </div>

        {/* 日期和时间 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* 时长 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            时长（分钟）
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={30}>30分钟</option>
            <option value={60}>1小时</option>
            <option value={90}>1.5小时</option>
            <option value={120}>2小时</option>
            <option value={180}>3小时</option>
          </select>
        </div>

        {/* 会议链接 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会议链接
          </label>
          <input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例如：https://meeting.example.com/xxx"
          />
        </div>

        {/* 地点 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            地点
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="线下会议地点"
          />
        </div>

        {/* 备注 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            备注
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="会议备注信息"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 时间冲突详情 */}
        {conflicts && conflicts.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-2">以下成员在该时间段有事件冲突：</p>
            <ul className="space-y-2">
              {conflicts.map((conflict) => (
                <li key={conflict.userId} className="text-sm text-yellow-700">
                  <span className="font-medium">{conflict.nickname}</span>
                  <ul className="ml-4 mt-1">
                    {conflict.events.map((event) => (
                      <li key={event.id}>
                        {event.title} ({event.startTime} - {event.endTime})
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '创建中...' : '创建会议'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default CreateMeetingForm