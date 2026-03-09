/**
 * 关于我们页面
 */
import React from 'react'
import { Link } from 'react-router-dom'

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">关于我们</h1>

      {/* 产品介绍 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">畅选日历</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          畅选日历是一款帮助大学生规划职业发展路径的智能日历平台。我们致力于为大学生提供便捷的职业规划工具，帮助大家更好地追踪校招时间线、管理求职日程。
        </p>
        <p className="text-gray-600 leading-relaxed">
          通过智能群组匹配，我们帮助志同道合的同学组成学习小组，共同进步。认知图谱功能帮助大家了解职业发展的全貌，探索更多可能性。
        </p>
      </div>

      {/* 核心功能 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">核心功能</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">智能日历</h3>
              <p className="text-sm text-gray-500">查看和管理你的职业发展日程，追踪校招时间线</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">我的群组</h3>
              <p className="text-sm text-gray-500">参与话题讨论，分享经验和见解，与志同道合的同学交流</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">认知图谱</h3>
              <p className="text-sm text-gray-500">探索职业知识图谱，了解行业全貌，明确发展方向</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">用户画像</h3>
              <p className="text-sm text-gray-500">完善个人信息，获得更精准的职业建议和群组匹配</p>
            </div>
          </div>
        </div>
      </div>

      {/* 联系我们 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">联系我们</h2>
        <p className="text-gray-600 mb-4">
          如有任何问题或建议，欢迎通过以下方式联系我们：
        </p>
        <div className="space-y-2 text-gray-600">
          <p>邮箱：support@changxuan.com</p>
        </div>
      </div>

      {/* 返回链接 */}
      <div className="mt-6">
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          返回首页
        </Link>
      </div>
    </div>
  )
}

export default AboutPage