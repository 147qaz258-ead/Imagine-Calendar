/**
 * 匹配状态展示组件
 */
import { RoundTableStatus, RoundTableStatusLabels } from '../types'
import type { RoundTable } from '../types'

interface MatchingStatusProps {
  roundTable: RoundTable
  onCancel?: () => void
}

export function MatchingStatus({ roundTable, onCancel }: MatchingStatusProps) {
  const participantCount = roundTable.participants.length
  const maxParticipants = roundTable.maxParticipants
  const progress = (participantCount / maxParticipants) * 100

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* 匹配中动画 */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          {/* 外圈动画 */}
          <div className="w-24 h-24 rounded-full border-4 border-blue-200 animate-pulse" />
          {/* 进度圈 */}
          <svg className="absolute inset-0 w-24 h-24 -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 44 * (progress / 100)} ${2 * Math.PI * 44}`}
              className="text-blue-600"
            />
          </svg>
          {/* 中心文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">
              {participantCount}/{maxParticipants}
            </span>
          </div>
        </div>
      </div>

      {/* 状态文字 */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {RoundTableStatusLabels[roundTable.status]}
        </h3>
        <p className="text-sm text-gray-500">
          {roundTable.status === RoundTableStatus.MATCHING ? (
            <>
              正在为您匹配志同道合的伙伴
              <br />
              还需要 {maxParticipants - participantCount} 人即可开始
            </>
          ) : roundTable.status === RoundTableStatus.READY ? (
            '人数已齐，即将开始'
          ) : (
            '圆桌讨论进行中'
          )}
        </p>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>匹配进度</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 当前参与者 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">当前参与者</h4>
        <div className="flex flex-wrap gap-2">
          {roundTable.participants.map(p => (
            <div
              key={p.userId}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
            >
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                {p.nickname.charAt(0)}
              </div>
              <span className="text-sm text-gray-700">{p.nickname}</span>
            </div>
          ))}
          {/* 空位 */}
          {Array.from({ length: maxParticipants - participantCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-2 px-3 py-1 border border-dashed border-gray-300 rounded-full"
            >
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
                ?
              </div>
              <span className="text-sm text-gray-400">等待加入</span>
            </div>
          ))}
        </div>
      </div>

      {/* 预计等待时间 */}
      {roundTable.status === RoundTableStatus.MATCHING && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center text-blue-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">预计等待时间: 约30分钟</span>
          </div>
        </div>
      )}

      {/* 取消按钮 */}
      {roundTable.status === RoundTableStatus.MATCHING && onCancel && (
        <button
          className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          onClick={onCancel}
        >
          取消报名
        </button>
      )}
    </div>
  )
}

export default MatchingStatus