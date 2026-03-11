/**
 * 组长确认组件
 * TASK-4.2: 组长确认机制完善
 */
import { useEffect, useState, useCallback } from 'react'
import { roundTableApi, type LeaderConfirmStatusResponse } from '../services/roundTableApi'

interface LeaderConfirmProps {
  groupId: string
  onLeaderConfirmed?: () => void
}

interface LeaderStatus {
  hasLeader: boolean
  leader: { userId: string; nickname: string } | null
  needsConfirm: boolean
  deadline: string | null
  canConfirm: boolean
  remainingTime: number
}

export function LeaderConfirm({ groupId, onLeaderConfirmed }: LeaderConfirmProps) {
  const [status, setStatus] = useState<LeaderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取组长确认状态
  const fetchStatus = useCallback(async () => {
    try {
      const response: LeaderConfirmStatusResponse = await roundTableApi.getLeaderConfirmStatus(groupId)
      if (response.success) {
        setStatus(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch leader status:', err)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  // 初始加载
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // 倒计时更新
  useEffect(() => {
    if (!status?.needsConfirm || status.remainingTime <= 0) return

    const timer = setInterval(() => {
      setStatus((prev) => {
        if (!prev || prev.remainingTime <= 1) {
          // 时间到，重新获取状态
          fetchStatus()
          return prev
        }
        return { ...prev, remainingTime: prev.remainingTime - 1 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status?.needsConfirm, status?.remainingTime, fetchStatus])

  // 确认成为组长
  const handleConfirm = async () => {
    setConfirming(true)
    setError(null)

    try {
      const response = await roundTableApi.confirmAsLeader(groupId)
      if (response.success) {
        // 刷新状态
        await fetchStatus()
        onLeaderConfirmed?.()
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      setError(errorObj?.response?.data?.message || '确认失败，请稍后重试')
    } finally {
      setConfirming(false)
    }
  }

  // 格式化剩余时间
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0:00:00'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // 加载中
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  // 没有状态数据
  if (!status) {
    return null
  }

  // 已有组长
  if (status.hasLeader && status.leader) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-800 font-medium">
            组长：{status.leader.nickname}
          </span>
        </div>
      </div>
    )
  }

  // 不需要确认（未满6人或已过截止时间）
  if (!status.needsConfirm) {
    return null
  }

  // 需要确认
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-yellow-800 font-medium mb-1">群组已满6人</h3>
          <p className="text-yellow-700 text-sm mb-2">
            请确认是否愿意成为组长，负责组织和主持讨论。
          </p>
          {status.canConfirm && (
            <p className="text-yellow-600 text-sm">
              剩余时间：<span className="font-mono font-medium">{formatTime(status.remainingTime)}</span>
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}

      {status.canConfirm ? (
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming ? '确认中...' : '我愿意成为组长'}
        </button>
      ) : (
        <p className="mt-2 text-yellow-600 text-sm">
          您已确认或无法确认，等待其他成员响应...
        </p>
      )}

      <p className="mt-2 text-yellow-600 text-xs">
        12小时内无人确认将随机指定组长
      </p>
    </div>
  )
}

export default LeaderConfirm