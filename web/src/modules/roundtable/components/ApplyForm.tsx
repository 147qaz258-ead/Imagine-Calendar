/**
 * 群组报名表单组件
 */
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { applyRoundTable, resetApplicationStatus } from '../store/roundTableSlice'

interface ApplyFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ApplyForm({ onSuccess, onCancel }: ApplyFormProps) {
  const dispatch = useAppDispatch()
  const { applying, applicationStatus, error } = useAppSelector(state => state.roundTable)

  // 表单状态
  const [preferredTimes, setPreferredTimes] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [customTopic, setCustomTopic] = useState('')

  // 预设时间段选项
  const timeSlotOptions = [
    { value: 'weekday_morning', label: '工作日早晨 (9:00-12:00)' },
    { value: 'weekday_afternoon', label: '工作日下午 (14:00-18:00)' },
    { value: 'weekday_evening', label: '工作日晚上 (19:00-22:00)' },
    { value: 'weekend_morning', label: '周末早晨 (9:00-12:00)' },
    { value: 'weekend_afternoon', label: '周末下午 (14:00-18:00)' },
    { value: 'weekend_evening', label: '周末晚上 (19:00-22:00)' },
  ]

  // 预设话题选项
  const topicOptions = [
    '求职经验分享',
    '面试技巧讨论',
    '职业规划迷茫',
    '行业选择困惑',
    '简历优化建议',
    '实习经历分享',
    '考研还是工作',
    '国企还是私企',
  ]

  // 切换时间段选择
  const toggleTimeSlot = (value: string) => {
    setPreferredTimes(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    )
  }

  // 切换话题选择
  const toggleTopic = (topic: string) => {
    setTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  // 添加自定义话题
  const addCustomTopic = () => {
    if (customTopic.trim() && !topics.includes(customTopic.trim())) {
      setTopics(prev => [...prev, customTopic.trim()])
      setCustomTopic('')
    }
  }

  // 提交报名
  const handleSubmit = async () => {
    if (preferredTimes.length === 0) {
      alert('请选择至少一个期望时间段')
      return
    }

    const result = await dispatch(applyRoundTable({
      preferredTimes,
      topics: topics.length > 0 ? topics : undefined,
    }))

    if (applyRoundTable.fulfilled.match(result)) {
      onSuccess?.()
    }
  }

  // 已提交报名
  if (applicationStatus.status !== 'idle') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">报名成功</h3>
        <p className="text-sm text-gray-500 mb-4">
          {applicationStatus.status === 'matched'
            ? '已为您匹配到群组，即将开始讨论'
            : `正在为您匹配志同道合的伙伴，预计等待 ${applicationStatus.estimatedWaitTime || 30} 分钟`}
        </p>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            dispatch(resetApplicationStatus())
            onSuccess?.()
          }}
        >
          查看我的群组
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">报名群组讨论</h2>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 期望时间段 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          期望时间段 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {timeSlotOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleTimeSlot(option.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                preferredTimes.includes(option.value)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {preferredTimes.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">请选择至少一个时间段</p>
        )}
      </div>

      {/* 感兴趣的话题 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          感兴趣的话题（可选）
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {topicOptions.map(topic => (
            <button
              key={topic}
              type="button"
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                topics.includes(topic)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* 自定义话题 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="添加自定义话题..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomTopic()
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomTopic}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            添加
          </button>
        </div>

        {/* 已选话题 */}
        {topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map(topic => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 说明文字 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">群组讨论说明</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>每场群组由6名志同道合的伙伴组成</li>
          <li>讨论时长约60分钟</li>
          <li>系统将根据您的偏好为您匹配合适的群组</li>
          <li>报名后可在"我的群组"中查看匹配状态</li>
        </ul>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={applying || preferredTimes.length === 0}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            applying || preferredTimes.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {applying ? '提交中...' : '提交报名'}
        </button>
      </div>
    </div>
  )
}

export default ApplyForm