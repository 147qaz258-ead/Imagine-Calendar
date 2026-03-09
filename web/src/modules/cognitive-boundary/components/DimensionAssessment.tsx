/**
 * 维度评估组件
 * 展示单个维度的所有问题评估
 */
import React, { useState } from 'react'
import type { Question, QuestionLevel } from '@/data/cognitive-questions'
import { QuestionSlider } from './QuestionSlider'
import type { ProgressInfo } from '../types'

interface DimensionAssessmentProps {
  dimensionKey: string
  dimensionName: string
  questions: Question[]
  assessments: Record<string, QuestionLevel>
  onAssessmentChange: (questionId: string, level: QuestionLevel) => void
  progress?: ProgressInfo
}

export const DimensionAssessment: React.FC<DimensionAssessmentProps> = ({
  dimensionKey,
  dimensionName,
  questions,
  assessments,
  onAssessmentChange,
  progress,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  // 按子分类分组问题
  const groupedQuestions = questions.reduce<Record<string, Question[]>>((acc, q) => {
    const key = q.subCategory || 'default'
    if (!acc[key]) acc[key] = []
    acc[key].push(q)
    return acc
  }, {})

  // 计算当前维度的进度
  const dimensionProgress = () => {
    const total = questions.length
    const completed = questions.filter((q) => assessments[q.id]).length
    return { total, completed, percentage: Math.round((completed / total) * 100) }
  }

  const dp = progress || dimensionProgress()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 头部 */}
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* 展开/收起图标 */}
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          <div>
            <h3 className="font-medium text-gray-900">{dimensionName}</h3>
            <p className="text-sm text-gray-500">
              {questions.length} 个问题
            </p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${dp.percentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 min-w-[3rem] text-right">
            {dp.completed}/{dp.total}
          </span>
        </div>
      </div>

      {/* 问题列表 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {Object.entries(groupedQuestions).map(([subCategory, qs]) => (
            <div key={subCategory}>
              {/* 子分类标题 */}
              {subCategory !== 'default' && (
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-400 rounded" />
                  {subCategory}
                </h4>
              )}

              {/* 问题滑动条 */}
              <div className="space-y-4">
                {qs.map((question) => (
                  <QuestionSlider
                    key={question.id}
                    question={question}
                    value={assessments[question.id]}
                    onChange={onAssessmentChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DimensionAssessment