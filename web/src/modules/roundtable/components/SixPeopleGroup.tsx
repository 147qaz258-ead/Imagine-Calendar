/**
 * 六人小组展示组件
 */
import type { Participant } from '../types'
import { ParticipantRole } from '../types'

interface SixPeopleGroupProps {
  participants: Participant[]
  maxParticipants?: number
  showRole?: boolean
}

export function SixPeopleGroup({
  participants,
  maxParticipants = 6,
  showRole = true,
}: SixPeopleGroupProps) {
  // 确保显示6个位置（包括空位）
  const slots = Array.from({ length: maxParticipants }, (_, index) => {
    const participant = participants[index]
    return participant || null
  })

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        群组成员 ({participants.length}/{maxParticipants})
      </h3>

      {/* 六边形布局 */}
      <div className="relative w-full max-w-md mx-auto" style={{ height: '280px' }}>
        {/* 顶部一人 */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <MemberSlot participant={slots[0]} index={0} showRole={showRole} />
        </div>

        {/* 第二行两人 */}
        <div className="absolute left-1/4 top-20 -translate-x-1/2">
          <MemberSlot participant={slots[1]} index={1} showRole={showRole} />
        </div>
        <div className="absolute left-3/4 top-20 -translate-x-1/2">
          <MemberSlot participant={slots[2]} index={2} showRole={showRole} />
        </div>

        {/* 第三行两人 */}
        <div className="absolute left-1/4 top-40 -translate-x-1/2">
          <MemberSlot participant={slots[3]} index={3} showRole={showRole} />
        </div>
        <div className="absolute left-3/4 top-40 -translate-x-1/2">
          <MemberSlot participant={slots[4]} index={4} showRole={showRole} />
        </div>

        {/* 底部一人 */}
        <div className="absolute left-1/2 top-60 -translate-x-1/2">
          <MemberSlot participant={slots[5]} index={5} showRole={showRole} />
        </div>
      </div>

      {/* 说明文字 */}
      <p className="text-center text-sm text-gray-500 mt-4">
        {participants.length < maxParticipants
          ? `还需 ${maxParticipants - participants.length} 人即可开始讨论`
          : '人员已齐，即将开始讨论'}
      </p>
    </div>
  )
}

// 成员位置组件
interface MemberSlotProps {
  participant: Participant | null
  index: number
  showRole: boolean
}

function MemberSlot({ participant, index, showRole }: MemberSlotProps) {
  // 预设颜色
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
  ]

  if (!participant) {
    // 空位
    return (
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
          <span className="text-gray-400 text-lg">?</span>
        </div>
        <span className="mt-1 text-xs text-gray-400">等待加入</span>
      </div>
    )
  }

  const bgColor = colors[index % colors.length]
  const initial = participant.nickname?.charAt(0) || '?'
  const isHost = participant.role === ParticipantRole.HOST

  return (
    <div className="flex flex-col items-center">
      {/* 头像 */}
      <div className="relative">
        {participant.avatar ? (
          <img
            src={participant.avatar}
            alt={participant.nickname}
            className={`w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ${
              isHost ? 'ring-yellow-400' : 'ring-transparent'
            }`}
          />
        ) : (
          <div
            className={`w-14 h-14 ${bgColor} rounded-full flex items-center justify-center text-white text-xl font-medium ring-2 ring-offset-2 ${
              isHost ? 'ring-yellow-400' : 'ring-transparent'
            }`}
          >
            {initial}
          </div>
        )}

        {/* 主持人标识 */}
        {isHost && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </div>

      {/* 昵称 */}
      <span className="mt-1 text-sm text-gray-700 truncate max-w-[80px]">
        {participant.nickname}
      </span>

      {/* 角色 */}
      {showRole && (
        <span className={`text-xs ${isHost ? 'text-yellow-600' : 'text-gray-500'}`}>
          {isHost ? '主持人' : '成员'}
        </span>
      )}
    </div>
  )
}

export default SixPeopleGroup