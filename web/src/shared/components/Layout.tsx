/**
 * Layout组件
 * 全局布局包装器，包含Header、主内容区域和BottomNav
 */
import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { FilterDrawer } from '@/modules/filter'
import { useFilterPanel } from '@/modules/filter'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { isOpen, close } = useFilterPanel()

  // 登录页面使用独立布局
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <Header />

      {/* 主内容区域 - 添加底部padding以避免被BottomNav遮挡 */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* 移动端底部导航 */}
      <BottomNav />

      {/* 全局筛选抽屉 */}
      <FilterDrawer open={isOpen} onClose={close} />
    </div>
  )
}