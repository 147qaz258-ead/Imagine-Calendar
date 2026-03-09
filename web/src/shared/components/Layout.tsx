/**
 * Layout组件
 * 全局布局包装器，包含Header、主内容区域和BottomNav
 * 同时处理新用户引导流程
 */
import { ReactNode, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setOnboardingStep } from '@/modules/auth/store/authSlice'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { FilterDrawer } from '@/modules/filter'
import { useFilterPanel } from '@/modules/filter'
import { ProductPositioningModal } from '@/modules/auth/components/ProductPositioningModal'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isOpen, close } = useFilterPanel()
  const { isAuthenticated, isNewUser, onboardingStep } = useAppSelector((state) => state.auth)

  const [showPositioningModal, setShowPositioningModal] = useState(false)

  // 检查是否需要显示产品定位弹窗
  useEffect(() => {
    const token = localStorage.getItem('token')
    const hasShown = localStorage.getItem('productPositioningShown')

    // 已登录且未显示过弹窗且引导步骤在welcome阶段
    if (token && !hasShown && onboardingStep === 'welcome') {
      setShowPositioningModal(true)
    }
  }, [onboardingStep])

  // 新用户引导流程
  useEffect(() => {
    if (!isAuthenticated) return

    // 如果是登录页面或已经在引导流程页面，不需要重定向
    const isAuthPage = location.pathname === '/login'
    const isOnboardingPage = ['/cognitive-boundary', '/profile/preferences'].includes(location.pathname)

    if (isAuthPage || isOnboardingPage) return

    // 根据引导步骤决定跳转
    switch (onboardingStep) {
      case 'welcome':
        // 等待产品定位弹窗确认
        break
      case 'preferences':
        // 跳转到个性化选择页面
        navigate('/profile/preferences', { replace: true })
        break
      case 'completed':
        // 引导完成，正常使用
        break
    }
  }, [isAuthenticated, onboardingStep, location.pathname, navigate])

  // 产品定位弹窗确认后
  const handlePositioningModalClose = () => {
    setShowPositioningModal(false)
    // 更新引导步骤到preferences
    dispatch(setOnboardingStep('preferences'))
    // 跳转到个性化选择页面
    navigate('/profile/preferences', { replace: true })
  }

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

      {/* 产品定位弹窗 */}
      <ProductPositioningModal
        isOpen={showPositioningModal}
        onClose={handlePositioningModalClose}
      />
    </div>
  )
}