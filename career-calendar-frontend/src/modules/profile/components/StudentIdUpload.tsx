/**
 * 学生证上传组件
 * 支持图片预览和上传状态显示
 */
import React, { useState, useRef } from 'react'
import { profileApi } from '../services/profileApi'

interface StudentIdUploadProps {
  userId: string
  studentIdImageUrl?: string
  isStudentVerified?: boolean
  onUploadSuccess: (studentIdImageUrl: string) => void
}

export const StudentIdUpload: React.FC<StudentIdUploadProps> = ({
  userId,
  studentIdImageUrl,
  isStudentVerified = false,
  onUploadSuccess,
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('仅支持 JPG、PNG、WEBP 格式的图片')
      return
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB')
      return
    }

    setError(null)

    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 自动上传
    handleUpload(file)
  }

  // 处理上传
  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const response = await profileApi.uploadStudentIdImage(userId, file)
      if (response.success) {
        onUploadSuccess(response.data.studentIdImageUrl)
        setPreviewUrl(null)
      } else {
        setError('上传失败，请重试')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上传失败，请重试'
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  // 点击上传按钮
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // 获取显示的图片 URL
  const displayImageUrl = previewUrl || studentIdImageUrl

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">学生证认证</h3>
        {isStudentVerified ? (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            已认证
          </span>
        ) : studentIdImageUrl ? (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            待审核
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            未上传
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        上传学生证照片可验证学生身份，获得更多群组参与机会。支持 JPG、PNG、WEBP 格式，最大 5MB。
      </p>

      {/* 图片预览区域 */}
      {displayImageUrl ? (
        <div className="mb-4 relative">
          <img
            src={displayImageUrl}
            alt="学生证预览"
            className="w-full max-w-sm mx-auto rounded-lg border border-gray-200"
          />
          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
                <span className="text-gray-600">上传中...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500">点击选择学生证照片</p>
          <p className="text-gray-400 text-sm mt-1">或将照片拖拽到此处</p>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleClick}
          disabled={uploading}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? '上传中...' : studentIdImageUrl ? '更换照片' : '上传学生证'}
        </button>
        {studentIdImageUrl && !uploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            重新上传
          </button>
        )}
      </div>

      {/* 说明 */}
      <p className="text-xs text-gray-400 mt-4">
        学生证信息仅用于身份验证，我们承诺保护您的隐私安全。
      </p>
    </div>
  )
}

export default StudentIdUpload