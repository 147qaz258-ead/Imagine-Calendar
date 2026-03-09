/**
 * 群组详情组件
 */
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchRoundTableDetail, joinRoundTable, leaveRoundTable } from '../store/roundTableSlice'
import { MatchingStatus } from './MatchingStatus'
import { SixPeopleGroup } from './SixPeopleGroup'
import { ChatRoom } from './ChatRoom'
import { LeaderConfirm } from './LeaderConfirm'
import { QuestionnaireStatus } from './QuestionnaireStatus'
import { CalendarShare } from './CalendarShare'
import { CreateMeetingForm } from './CreateMeetingForm'
import { MeetingList } from './MeetingList'
import { RoundTableStatus, RoundTableStatusLabels, RoundTableStatusColors } from '../types'

interface RoundTableDetailProps {
  id: string
  onBack?: () => void
}

export function RoundTableDetail({ id, onBack }: RoundTableDetailProps) {
  const dispatch = useAppDispatch()
  const { currentRoundTable, detailLoading, error } = useAppSelector(state => state.roundTable)
  const { user } = useAppSelector(state => state.auth)
  const [showChatRoom, setShowChatRoom] = useState(false)
  const [wsEndpoint, setWsEndpoint] = useState<string | null>(null)
  const [showMeetingForm, setShowMeetingForm] = useState(false)

  // 加载详情
  useEffect(() => {
    dispatch(fetchRoundTableDetail(id))
  }, [dispatch, id])

  // 加入群组
  const handleJoin = async () => {
    const result = await dispatch(joinRoundTable(id))
    if (joinRoundTable.fulfilled.match(result)) {
      // 保存 WebSocket 端点并显示聊天室
      setWsEndpoint(result.payload.wsEndpoint)
      setShowChatRoom(true)
    }
  }

  // 离开群组
  const handleLeave = async () => {
    if (confirm('确定要离开这个群组吗？')) {
      await dispatch(leaveRoundTable(id))
      setShowChatRoom(false)
      setWsEndpoint(null)
    }
  }

  // 退出聊天室
  const handleLeaveChatRoom = () => {
    setShowChatRoom(false)
  }

  // 刷新群组详情
  const handleRefreshDetail = () => {
    dispatch(fetchRoundTableDetail(id))
  }

  // 加载中
  if (detailLoading && !currentRoundTable) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => dispatch(fetchRoundTableDetail(id))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          重试
        </button>
      </div>
    )
  }

  // 未找到
  if (!currentRoundTable) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">未找到群组</div>
        {onBack && (
          <button onClick={onBack} className="mt-4 text-blue-600">
            返回列表
          </button>
        )}
      </div>
    )
  }

  const statusColor = RoundTableStatusColors[currentRoundTable.status]
  const statusLabel = RoundTableStatusLabels[currentRoundTable.status]

  // 检查当前用户是否是组长
  const currentUserParticipant = currentRoundTable.participants.find(p => p.userId === user?.id)
  const isLeader = currentUserParticipant?.role === 'host'

  return (
    <div>
      {/* 返回按钮 */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回列表
        </button>
      )}

      {/* 头部信息 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`inline-block px-2 py-1 text-xs rounded ${statusColor.bg} ${statusColor.text} mb-2`}>
              {statusLabel}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{currentRoundTable.topic}</h1>
          </div>
          {(currentRoundTable.status === RoundTableStatus.MATCHING ||
            currentRoundTable.status === RoundTableStatus.READY) && (
            <button
              onClick={handleLeave}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              取消报名
            </button>
          )}
        </div>

        {/* 时间信息 */}
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {new Date(currentRoundTable.scheduledAt).toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          <span className="mx-2">|</span>
          {currentRoundTable.duration}分钟
        </div>

        {/* 描述 */}
        {currentRoundTable.description && (
          <p className="text-gray-600 mb-4">{currentRoundTable.description}</p>
        )}

        {/* 操作按钮 */}
        {(currentRoundTable.status === RoundTableStatus.READY ||
          currentRoundTable.status === RoundTableStatus.IN_PROGRESS) && (
          <button
            onClick={handleJoin}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {currentRoundTable.status === RoundTableStatus.IN_PROGRESS ? '加入讨论' : '进入群组'}
          </button>
        )}
      </div>

      {/* 匹配中状态 */}
      {currentRoundTable.status === RoundTableStatus.MATCHING && (
        <div className="mb-6">
          <MatchingStatus
            roundTable={currentRoundTable}
            onCancel={handleLeave}
          />
        </div>
      )}

      {/* 组长确认 - TASK-4.2: 满6人后显示 */}
      {currentRoundTable.status === RoundTableStatus.READY && (
        <div className="mb-6">
          <LeaderConfirm
            groupId={id}
            onLeaderConfirmed={() => dispatch(fetchRoundTableDetail(id))}
          />
        </div>
      )}

      {/* 六人小组展示 */}
      <div className="mb-6">
        <SixPeopleGroup participants={currentRoundTable.participants} />
      </div>

      {/* 问题清单完成状态 - TASK-4.3: READY或IN_PROGRESS状态显示 */}
      {(currentRoundTable.status === RoundTableStatus.READY ||
        currentRoundTable.status === RoundTableStatus.IN_PROGRESS) &&
        currentRoundTable.participants.length > 0 && (
          <div className="mb-6">
            <QuestionnaireStatus groupId={id} />
          </div>
        )}

      {/* 日历共享 - TASK-4.4: READY或IN_PROGRESS状态显示 */}
      {(currentRoundTable.status === RoundTableStatus.READY ||
        currentRoundTable.status === RoundTableStatus.IN_PROGRESS) &&
        currentRoundTable.participants.length > 0 && currentUserParticipant && (
          <div className="mb-6">
            <CalendarShare groupId={id} isLeader={isLeader} />
          </div>
        )}

      {/* 发起会议 - TASK-4.5: READY或IN_PROGRESS状态且有组长时显示 */}
      {(currentRoundTable.status === RoundTableStatus.READY ||
        currentRoundTable.status === RoundTableStatus.IN_PROGRESS) &&
        currentRoundTable.participants.length > 0 && (
          <div className="mb-6">
            {/* 会议列表 */}
            <MeetingList
              groupId={id}
              isLeader={isLeader}
              onRefresh={handleRefreshDetail}
            />

            {/* 组长可以发起会议 */}
            {isLeader && (
              <div className="mt-4">
                {showMeetingForm ? (
                  <CreateMeetingForm
                    groupId={id}
                    onSuccess={() => {
                      setShowMeetingForm(false)
                      handleRefreshDetail()
                    }}
                    onCancel={() => setShowMeetingForm(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowMeetingForm(true)}
                    className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    + 发起新会议
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      {/* 讨论问题清单 */}
      {currentRoundTable.questions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">讨论问题清单</h2>
          <ul className="space-y-3">
            {currentRoundTable.questions.map((question, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 讨论纪要 */}
      {currentRoundTable.status === RoundTableStatus.COMPLETED && currentRoundTable.summary && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">讨论纪要</h2>
          <div className="prose prose-sm max-w-none text-gray-600">
            {currentRoundTable.summary}
          </div>
        </div>
      )}

      {/* 聊天室 - 进行中状态显示 */}
      {showChatRoom && currentRoundTable.status === RoundTableStatus.IN_PROGRESS && (
        <div className="fixed inset-0 z-50 bg-gray-100 p-4">
          <div className="h-full max-w-4xl mx-auto">
            <ChatRoom
              roundTableId={id}
              wsEndpoint={wsEndpoint || undefined}
              participants={currentRoundTable.participants}
              initialMessages={currentRoundTable.messages || []}
              onLeave={handleLeaveChatRoom}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default RoundTableDetail