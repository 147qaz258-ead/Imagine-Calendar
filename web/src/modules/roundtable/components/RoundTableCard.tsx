/**
 * 群组卡片组件
 */
import type { RoundTable, Participant } from '../types'
import { RoundTableStatus, RoundTableStatusLabels, RoundTableStatusColors, ParticipantRole } from '../types'

interface RoundTableCardProps {
  roundTable: RoundTable
  onClick?: () => void
  onJoin?: () => void
  onLeave?: () => void
  showActions?: boolean
}

export function RoundTableCard({
  roundTable,
  onClick,
  onJoin,
  onLeave,
  showActions = true,
}: RoundTableCardProps) {
  const statusColor = RoundTableStatusColors[roundTable.status]
  const statusLabel = RoundTableStatusLabels[roundTable.status]
  const participantCount = roundTable.participants.length
  const isFull = participantCount >= roundTable.maxParticipants

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 获取主持人
  const host = roundTable.participants.find(p => p.role === ParticipantRole.HOST)

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${statusColor.border} overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      {/* 状态标签 */}
      <div className={`${statusColor.bg} ${statusColor.text} px-4 py-2 text-sm font-medium`}>
        {statusLabel}
        {roundTable.status === RoundTableStatus.MATCHING && (
          <span className="ml-2">
            ({participantCount}/{roundTable.maxParticipants}人)
          </span>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 主题 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{roundTable.topic}</h3>

        {/* 时间 */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatTime(roundTable.scheduledAt)}
          <span className="mx-2">|</span>
          {roundTable.duration}分钟
        </div>

        {/* 描述 */}
        {roundTable.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{roundTable.description}</p>
        )}

        {/* 参与者头像 */}
        <div className="flex items-center mb-3">
          <div className="flex -space-x-2">
            {roundTable.participants.slice(0, 6).map(participant => (
              <ParticipantAvatar key={participant.userId} participant={participant} size="sm" />
            ))}
          </div>
          {participantCount > 6 && (
            <span className="ml-2 text-sm text-gray-500">+{participantCount - 6}</span>
          )}
        </div>

        {/* 主持人 */}
        {host && (
          <div className="text-sm text-gray-500">
            主持人: {host.nickname}
          </div>
        )}

        {/* 操作按钮 */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            {roundTable.status === RoundTableStatus.MATCHING && !isFull && onJoin && (
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onJoin()
                }}
              >
                加入群组
              </button>
            )}
            {roundTable.status === RoundTableStatus.READY && onJoin && (
              <button
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onJoin()
                }}
              >
                进入群组
              </button>
            )}
            {(roundTable.status === RoundTableStatus.MATCHING || roundTable.status === RoundTableStatus.READY) && onLeave && (
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onLeave()
                }}
              >
                取消报名
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 参与者头像组件
interface ParticipantAvatarProps {
  participant: Participant
  size?: 'sm' | 'md' | 'lg'
}

export function ParticipantAvatar({ participant, size = 'md' }: ParticipantAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  // 获取昵称首字
  const initial = participant.nickname?.charAt(0) || '?'

  // 随机背景色（基于用户ID）
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
  ]
  const colorIndex = participant.userId.charCodeAt(0) % colors.length
  const bgColor = colors[colorIndex]

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-medium ring-2 ring-white`}
      title={participant.nickname}
    >
      {participant.avatar ? (
        <img
          src={participant.avatar}
          alt={participant.nickname}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  )
}

export default RoundTableCard