/**
 * 问题滑动条组件
 * 用于评估对问题的了解程度
 */
import React from 'react'
import type { Question, QuestionLevel } from '@/data/cognitive-questions'
import { ASSESSMENT_LEVELS } from '@/data/cognitive-questions'

interface QuestionSliderProps {
  question: Question
  value?: QuestionLevel
  onChange: (questionId: string, level: QuestionLevel) => void
  disabled?: boolean
}

export const QuestionSlider: React.FC<QuestionSliderProps> = ({
  question,
  value,
  onChange,
  disabled = false,
}) => {
  const currentLevel = value || 1

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const level = parseInt(e.target.value, 10) as QuestionLevel
    onChange(question.id, level)
  }

  const getLevelColor = (level: QuestionLevel) => {
    const colors = {
      1: 'bg-red-100 text-red-700 border-red-200',
      2: 'bg-orange-100 text-orange-700 border-orange-200',
      3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      4: 'bg-blue-100 text-blue-700 border-blue-200',
      5: 'bg-green-100 text-green-700 border-green-200',
    }
    return colors[level]
  }

  const getSliderGradient = () => {
    const percentage = ((currentLevel - 1) / 4) * 100
    return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${disabled ? 'opacity-60' : ''}`}>
      {/* 问题编号和子分类 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
          {question.questionNumber}
        </span>
        {question.subCategory && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {question.subCategory}
          </span>
        )}
      </div>

      {/* 问题内容 */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {question.questionText}
      </p>

      {/* 滑动条 */}
      <div className="space-y-3">
        {/* 滑动条输入 */}
        <div className="relative">
          <input
            type="range"
            min={1}
            max={5}
            value={currentLevel}
            onChange={handleSliderChange}
            disabled={disabled}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
            style={{ background: getSliderGradient() }}
          />
          {/* 刻度标记 */}
          <div className="flex justify-between mt-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className="w-1 h-1 rounded-full bg-gray-300"
              />
            ))}
          </div>
        </div>

        {/* 当前等级显示 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">当前评估:</span>
            <span
              className={`text-xs px-2 py-1 rounded border ${getLevelColor(currentLevel)}`}
            >
              {ASSESSMENT_LEVELS[currentLevel].label}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {currentLevel}/5
          </span>
        </div>

        {/* 等级描述提示 */}
        <div className="grid grid-cols-5 gap-1 text-xs">
          {([1, 2, 3, 4, 5] as QuestionLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => !disabled && onChange(question.id, level)}
              disabled={disabled}
              className={`p-1 rounded text-center transition-colors ${
                currentLevel === level
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuestionSlider