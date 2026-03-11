/**
 * 事件详情弹窗组件
 */
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchEventDetail, followEvent, unfollowEvent } from '../store/calendarSlice'
import { CompanyTypeColors, CompanyTypeLabels, CompanyType } from '../types'

interface EventDetailModalProps {
  eventId: string | null
  onClose: () => void
}

export function EventDetailModal({ eventId, onClose }: EventDetailModalProps) {
  const dispatch = useAppDispatch()
  const { selectedEvent, eventDetailLoading, followedEventIds } = useAppSelector(state => state.calendar)

  // 加载事件详情
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventDetail(eventId))
    }
  }, [eventId, dispatch])

  if (!eventId) return null

  const isLoading = eventDetailLoading || !selectedEvent
  const isFollowed = followedEventIds.includes(eventId)

  const handleFollow = () => {
    if (isFollowed) {
      dispatch(unfollowEvent(eventId))
    } else {
      dispatch(followEvent(eventId))
    }
  }

  const colors = selectedEvent
    ? CompanyTypeColors[selectedEvent.companyType] || CompanyTypeColors[CompanyType.PRIVATE]
    : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : selectedEvent ? (
          <>
            {/* 头部 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {colors && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {CompanyTypeLabels[selectedEvent.companyType]}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{selectedEvent.company}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 内容 */}
            <div className="px-6 py-4 space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">日期</span>
                  <p className="text-gray-900">{selectedEvent.eventDate}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">职位</span>
                  <p className="text-gray-900">{selectedEvent.position}</p>
                </div>
                {selectedEvent.startTime && selectedEvent.endTime && (
                  <div>
                    <span className="text-sm text-gray-500">时间</span>
                    <p className="text-gray-900">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                  </div>
                )}
                {selectedEvent.location && (
                  <div>
                    <span className="text-sm text-gray-500">地点</span>
                    <p className="text-gray-900">{selectedEvent.location}</p>
                  </div>
                )}
              </div>

              {/* 描述 */}
              {selectedEvent.description && (
                <div>
                  <span className="text-sm text-gray-500">描述</span>
                  <p className="text-gray-900 mt-1">{selectedEvent.description}</p>
                </div>
              )}

              {/* 要求 */}
              {selectedEvent.requirements && selectedEvent.requirements.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">要求</span>
                  <ul className="mt-1 space-y-1">
                    {selectedEvent.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-900">
                        <span className="text-blue-500 mt-1">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 福利 */}
              {selectedEvent.benefits && selectedEvent.benefits.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">福利</span>
                  <ul className="mt-1 space-y-1">
                    {selectedEvent.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-900">
                        <span className="text-green-500 mt-1">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 标签 */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">标签</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedEvent.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 底部操作 */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={handleFollow}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isFollowed
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowed ? '取消关注' : '关注'}
              </button>
              {selectedEvent.applyUrl && (
                <a
                  href={selectedEvent.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-4 bg-green-600 text-white text-center rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  立即申请
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            事件不存在或已删除
          </div>
        )}
      </div>
    </div>
  )
}

export default EventDetailModal