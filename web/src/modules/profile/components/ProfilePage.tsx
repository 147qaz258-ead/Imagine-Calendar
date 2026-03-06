/**
 * 用户画像页面
 */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchProfile, updateProfile } from '../store/profileSlice'
import { fetchCurrentUser } from '@/modules/auth/store/authSlice'
import { PreferencesForm } from './PreferencesForm'

// 年级选项
const GRADE_OPTIONS = [
  { value: 'freshman', label: '大一' },
  { value: 'sophomore', label: '大二' },
  { value: 'junior', label: '大三' },
  { value: 'senior', label: '大四' },
  { value: 'master', label: '研一' },
  { value: 'master2', label: '研二' },
  { value: 'master3', label: '研三' },
  { value: 'phd', label: '博士' },
]

// 毕业年份选项
const generateGraduationYears = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = 0; i < 5; i++) {
    years.push(currentYear + i)
  }
  return years
}

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, loading, error, updateLoading, updateError } = useAppSelector((state) => state.profile)
  const { user: authUser, isAuthenticated } = useAppSelector((state) => state.auth)

  // 表单状态
  const [nickname, setNickname] = useState('')
  const [school, setSchool] = useState('')
  const [major, setMajor] = useState('')
  const [grade, setGrade] = useState('')
  const [graduationYear, setGraduationYear] = useState<number | ''>('')
  const [activeTab, setActiveTab] = useState<'basic' | 'preferences'>('basic')

  // 未登录跳转
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 如果已登录但没有用户数据，先获取当前用户
  useEffect(() => {
    if (isAuthenticated && !authUser) {
      dispatch(fetchCurrentUser())
    }
  }, [isAuthenticated, authUser, dispatch])

  // 加载用户画像
  useEffect(() => {
    if (authUser?.id) {
      dispatch(fetchProfile(authUser.id))
    }
  }, [authUser?.id, dispatch])

  // 同步表单数据
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '')
      setSchool(user.school || '')
      setMajor(user.major || '')
      setGrade(user.grade || '')
      setGraduationYear(user.graduationYear || '')
    }
  }, [user])

  // 保存基本信息
  const handleSaveBasic = async () => {
    if (!authUser?.id) return

    const result = await dispatch(
      updateProfile({
        userId: authUser.id,
        data: {
          nickname: nickname || undefined,
          school: school || undefined,
          major: major || undefined,
          grade: grade || undefined,
          graduationYear: graduationYear || undefined,
        },
      })
    ).unwrap()

    if (result) {
      alert('保存成功')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">用户画像</h1>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'basic'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('basic')}
        >
          基本信息
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preferences'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('preferences')}
        >
          求职偏好（13维度）
        </button>
      </div>

      {/* 基本信息表单 */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-lg shadow p-6">
          {/* 手机号（只读） */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="text"
              value={user?.phone || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {/* 昵称 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 学校 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">学校</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="请输入学校名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 专业 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="请输入专业名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 年级 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择年级</option>
              {GRADE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 毕业年份 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">毕业年份</label>
            <select
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择毕业年份</option>
              {generateGraduationYears().map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>

          {/* 更新错误 */}
          {updateError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {updateError}
            </div>
          )}

          {/* 保存按钮 */}
          <button
            onClick={handleSaveBasic}
            disabled={updateLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {updateLoading ? '保存中...' : '保存基本信息'}
          </button>
        </div>
      )}

      {/* 求职偏好表单 */}
      {activeTab === 'preferences' && <PreferencesForm />}
    </div>
  )
}

export default ProfilePage