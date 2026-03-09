import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { FilterPage as FilterPageComponent } from '@/modules/filter'
import { RoundTableList, RoundTableDetail } from '@/modules/roundtable'
import { Calendar } from '@/modules/calendar'
import { LoginPage } from '@/modules/auth'
import { ProfilePage as ProfilePageComponent, PreferencesForm } from '@/modules/profile'
import { CognitivePage as CognitivePageComponent } from '@/modules/cognitive'
import { CognitiveBoundaryPage as CognitiveBoundaryPageComponent } from '@/modules/cognitive-boundary'
import { NotificationPage as NotificationPageComponent } from '@/modules/notification'
import { Layout, QuickLinks, UpcomingEvents, GroupStatus } from '@/shared/components'
import { useAppSelector } from '@/store/hooks'
import { AboutPage, HelpPage } from '@/pages'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/filter" element={<FilterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/preferences" element={<PreferencesPage />} />
        <Route path="/cognitive-boundary" element={<CognitiveBoundaryPage />} />
        <Route path="/roundtable" element={<RoundTablePage />} />
        <Route path="/roundtable/:id" element={<RoundTableDetailPage />} />
        <Route path="/cognitive" element={<CognitivePage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

// Placeholder pages
function HomePage() {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  // 未登录用户显示欢迎页面
  if (!isAuthenticated) {
    return <WelcomeSection />
  }

  // 已登录用户显示主界面（日历 + 侧边栏）
  return (
    <div className="flex h-full gap-4">
      {/* 主日历区域 - 占 80% */}
      <div className="w-full lg:w-4/5 flex-shrink-0">
        <Calendar />
      </div>

      {/* 侧边栏 - 占 20%，移动端隐藏 */}
      <aside className="hidden lg:block w-1/5 min-w-[200px] max-w-[280px] border-l border-gray-200 pl-4">
        <div className="space-y-6">
          <QuickLinks />
          <div className="border-t border-gray-100 pt-4">
            <UpcomingEvents />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <GroupStatus />
          </div>
        </div>
      </aside>
    </div>
  )
}

// 欢迎页面 - 未登录用户显示
function WelcomeSection() {
  const navigate = useNavigate()

  const features = [
    {
      id: 'calendar',
      title: '日历',
      description: '查看和管理你的职业发展日程，追踪校招时间线',
      path: '/calendar',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      id: 'profile',
      title: '用户画像',
      description: '完善个人信息，获得更精准的职业建议',
      path: '/profile',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      id: 'cognitive',
      title: '认知图谱',
      description: '探索职业知识图谱，了解行业全貌',
      path: '/cognitive',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'bg-purple-500',
    },
    {
      id: 'roundtable',
      title: '我的群组',
      description: '参与话题讨论，分享经验和见解',
      path: '/roundtable',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      color: 'bg-orange-500',
    },
  ]

  const handleCardClick = (path: string) => {
    navigate('/login')
  }

  return (
    <div className="py-12">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">欢迎来到畅选日历</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          帮助大学生规划职业发展路径的智能日历平台
        </p>
      </div>

      {/* Login Prompt */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center max-w-2xl mx-auto">
        <p className="text-blue-800">
          登录后可使用完整功能
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => handleCardClick(feature.path)}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 text-left group cursor-pointer border border-gray-100 hover:border-gray-200"
          >
            <div className={`${feature.color} text-white rounded-lg w-14 h-14 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {feature.description}
            </p>
          </button>
        ))}
      </div>

      {/* Additional Info Section */}
      <div className="mt-16 text-center text-gray-500 text-sm">
        <p>更多功能正在开发中，敬请期待...</p>
      </div>
    </div>
  )
}

function CalendarPage() {
  return <Calendar />
}

function FilterPage() {
  return <FilterPageComponent />
}

function ProfilePage() {
  return <ProfilePageComponent />
}

function PreferencesPage() {
  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">个性化选择</h1>
      <p className="text-gray-600 mb-6">请选择您的职业偏好，我们将为您匹配合适的群组。</p>
      <PreferencesForm />
    </div>
  )
}

function CognitiveBoundaryPage() {
  return <CognitiveBoundaryPageComponent />
}

function RoundTablePage() {
  const navigate = useNavigate()
  return (
    <RoundTableList
      onViewDetail={(id) => navigate(`/roundtable/${id}`)}
    />
  )
}

function RoundTableDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) {
    return <div className="text-center py-12">群组ID不存在</div>
  }

  return (
    <RoundTableDetail
      id={id}
      onBack={() => navigate('/roundtable')}
    />
  )
}

function CognitivePage() {
  return <CognitivePageComponent />
}

function NotificationPage() {
  return <NotificationPageComponent />
}

function NotFoundPage() {
  return <div className="text-center py-12">404 - 页面未找到</div>
}

export default App