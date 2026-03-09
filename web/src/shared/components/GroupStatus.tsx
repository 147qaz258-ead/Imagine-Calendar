/**
 * 群组状态组件 - 显示用户参与的群组状态
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchRoundTables, RoundTableStatusLabels, RoundTableStatusColors } from '@/modules/roundtable'
import type { RoundTable } from '@/modules/roundtable'

export function GroupStatus() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const { myRoundTables, loading } = useAppSelector(state => state.roundTable)

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchRoundTables())
    }
  }, [isAuthenticated, dispatch])

  // 合并匹配中和即将开始的群组（最多显示3个）
  const activeGroups = [...myRoundTables.matching, ...myRoundTables.upcoming].slice(0, 3)

  const getStatusText = (status: string) => {
    return RoundTableStatusLabels[status as keyof typeof RoundTableStatusLabels] || '未知状态'
  }

  const getStatusColor = (status: string) => {
    const colors = RoundTableStatusColors[status as keyof typeof RoundTableStatusColors]
    if (colors) {
      return `${colors.bg} ${colors.text}`
    }
    return 'bg-gray-100 text-gray-600'
  }

  const handleGroupClick = (id: string) => {
    navigate(`/roundtable/${id}`)
  }

  const handleViewAll = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate('/roundtable')
  }

  const totalGroups = myRoundTables.matching.length + myRoundTables.upcoming.length + myRoundTables.completed.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">我的群组</h3>
        {totalGroups > 0 && (
          <button
            onClick={handleViewAll}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            查看全部
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        </div>
      ) : !isAuthenticated ? (
        <p className="text-sm text-gray-400 py-2">
          登录后查看群组
        </p>
      ) : activeGroups.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">
          暂无参与的群组
        </p>
      ) : (
        <div className="space-y-2">
          {activeGroups.map((group: RoundTable) => (
            <button
              key={group.id}
              onClick={() => handleGroupClick(group.id)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm text-gray-700 truncate flex-1">
                {group.topic}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(group.status)}`}>
                {getStatusText(group.status)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default GroupStatus