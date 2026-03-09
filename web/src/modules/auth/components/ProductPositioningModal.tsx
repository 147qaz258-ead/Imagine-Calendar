/**
 * 产品定位弹窗组件
 * 登录后首次进入时显示，展示产品定位说明
 */
import { useEffect, useState } from 'react'

const PRODUCT_POSITIONING_KEY = 'productPositioningShown'

// 产品定位内容 - 来源于日历项目demo想法.md第13-33行
const positioningData = {
  cannot: [
    '替你学习思考判断',
    '给你刷短视频般的即时快感与奖励',
    '直接给你任何人生或职业的建议',
    '哄劝、督促你',
    '用刻板印象评判你',
  ],
  can: [
    '帮助你学习如何正确使用AI工具学习、思考及判断，避免被AI替代',
    '学习使用AI工具做自我探索',
    '提供每天2小时以内的自主学习和深入思考的引导活动',
    '提供摸索认知边界的问题清单',
    '提供客观真实反馈',
    '推荐与你职业兴趣相近的学生社群',
    '模拟真实工作场景',
    '提供方法论',
    '培训思维方式',
    '由你决定你是谁',
  ],
}

interface ProductPositioningModalProps {
  isOpen?: boolean
  onClose?: () => void
}

export function ProductPositioningModal({ isOpen, onClose }: ProductPositioningModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 检查是否已经显示过
    const hasShown = localStorage.getItem(PRODUCT_POSITIONING_KEY)

    // 如果是受控模式，使用isOpen；否则自动判断
    if (isOpen !== undefined) {
      setVisible(isOpen)
    } else if (!hasShown) {
      setVisible(true)
    }
  }, [isOpen])

  // 阻止背景滚动
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [visible])

  const handleClose = () => {
    setVisible(false)
    localStorage.setItem(PRODUCT_POSITIONING_KEY, 'true')
    onClose?.()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 text-center">
          <h2 className="text-xl font-semibold text-gray-900">欢迎使用畅选日历</h2>
          <p className="text-sm text-gray-500 mt-1">了解我们能为您做什么</p>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 左侧 - 我既不能也不会 */}
            <div className="space-y-4">
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-medium">
                  我既不能也不会
                </span>
              </div>
              <ul className="space-y-3">
                {positioningData.cannot.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 p-3 bg-red-50 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 右侧 - 我只能只会 */}
            <div className="space-y-4">
              <div className="text-center">
                <span className="inline-block px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                  我只能只会
                </span>
              </div>
              <ul className="space-y-3">
                {positioningData.can.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 p-3 bg-green-50 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            我已了解，开始使用
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductPositioningModal