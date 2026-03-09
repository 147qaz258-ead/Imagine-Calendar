/**
 * 问题清单完成状态组件
 * TASK-4.3: 问题清单完成状态
 */
import { useEffect, useState } from 'react'
import { roundTableApi, type QuestionnaireStatusResponse } from '../services/roundTableApi'

interface QuestionnaireStatusProps {
  groupId: string
}

export function QuestionnaireStatus({ groupId }: QuestionnaireStatusProps) {
  const [data, setData] = useState<QuestionnaireStatusResponse['data'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true)
        const response = await roundTableApi.getQuestionnaireStatus(groupId)
        if (response.success) {
          setData(response.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取状态失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
  }, [groupId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h4 className="text-base font-medium text-gray-900 mb-3">问题清单完成状态</h4>

      {/* 成员状态列表 */}
      <div className="flex flex-wrap gap-3 mb-3">
        {data.statusList.map((status) => (
          <div key={status.userId} className="flex flex-col items-center">
            {/* 头像和完成状态 */}
            <div className="relative">
              {status.avatar ? (
                <img
                  src={status.avatar}
                  alt={status.nickname}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {status.nickname.charAt(0)}
                </div>
              )}

              {/* 完成状态图标 */}
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                  status.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                {status.completed ? (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-white text-xs font-bold">
                    {Math.round((status.progress / status.total) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* 昵称 */}
            <span className="mt-1 text-xs text-gray-600 max-w-[60px] truncate">
              {status.nickname}
            </span>
          </div>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          已完成：{data.completed}/{data.total} 人
        </span>
        {data.completed === data.total && data.total > 0 && (
          <span className="text-green-600 font-medium">全部完成</span>
        )}
      </div>
    </div>
  )
}

export default QuestionnaireStatus