/**
 * 使用帮助页面
 */
import React from 'react'
import { Link } from 'react-router-dom'

export const HelpPage: React.FC = () => {
  const faqItems = [
    {
      question: '如何注册账号？',
      answer: '点击首页右上角的"登录"按钮，在登录页面选择"注册"，输入手机号并获取验证码即可完成注册。',
    },
    {
      question: '如何加入群组？',
      answer: '完善你的用户画像和求职偏好后，系统会根据你的偏好智能匹配合适的群组。你也可以在"我的群组"页面浏览和加入感兴趣的群组。',
    },
    {
      question: '什么是认知图谱？',
      answer: '认知图谱帮助你了解在职业发展各维度的认知深度。通过填写认知报告，你可以发现自己的优势和待提升的领域。',
    },
    {
      question: '如何上传学生证？',
      answer: '进入"用户画像"页面，在学生证上传区域点击上传按钮，选择你的学生证照片即可。上传后等待审核通过。',
    },
    {
      question: '如何修改个人信息？',
      answer: '进入"用户画像"页面，在"基本信息"标签页中修改你的昵称、学校、专业、年级等信息，然后点击"保存基本信息"。',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">使用帮助</h1>

      {/* 快速入门 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速入门</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-medium">1</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">注册账号</h3>
              <p className="text-sm text-gray-500">使用手机号快速注册畅选日历账号</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-medium">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">完善画像</h3>
              <p className="text-sm text-gray-500">填写基本信息和求职偏好，获得更精准的推荐</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-medium">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">探索认知</h3>
              <p className="text-sm text-gray-500">填写认知报告，了解自己的职业发展认知边界</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-medium">4</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">加入群组</h3>
              <p className="text-sm text-gray-500">与志同道合的同学交流，共同进步</p>
            </div>
          </div>
        </div>
      </div>

      {/* 常见问题 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">常见问题</h2>
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
              <h3 className="font-medium text-gray-900 mb-2">{item.question}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 意见反馈 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <h2 className="text-lg font-semibold mb-3">意见反馈</h2>
        <p className="text-blue-100 mb-4">
          您的反馈对我们非常重要，帮助我们不断改进产品体验。
        </p>
        <a
          href="mailto:feedback@changxuan.com?subject=畅选日历反馈"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          发送反馈邮件
        </a>
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

export default HelpPage