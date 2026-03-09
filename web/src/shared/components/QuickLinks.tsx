/**
 * 快捷入口组件 - 显示常用功能快捷方式
 */
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export function QuickLinks() {
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  const links = [
    {
      id: 'profile',
      title: '用户画像',
      path: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-50',
    },
    {
      id: 'cognitive',
      title: '认知图谱',
      path: '/cognitive',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'roundtable',
      title: '我的群组',
      path: '/roundtable',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      color: 'text-orange-600 bg-orange-50',
    },
    {
      id: 'notifications',
      title: '通知中心',
      path: '/notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50',
    },
  ]

  const handleClick = (path: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate(path)
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500 mb-3">快捷入口</h3>
      {links.map((link) => (
        <button
          key={link.id}
          onClick={() => handleClick(link.path)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <div className={`p-2 rounded-lg ${link.color}`}>
            {link.icon}
          </div>
          <span className="text-sm text-gray-700">{link.title}</span>
        </button>
      ))}
    </div>
  )
}

export default QuickLinks