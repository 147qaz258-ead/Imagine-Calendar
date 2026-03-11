/**
 * 认知版本对比组件
 * 支持选择两个版本进行对比，显示雷达图和维度差异
 */
import React, { useEffect, useState } from 'react'
import { cognitiveApi } from '../services/cognitiveApi'
import type {
  CognitiveVersionListItem,
  VersionComparison,
  DimensionDiff,
  CognitiveDimension,
} from '../types'

interface ComparisonRadarChartProps {
  dimensionsV1: CognitiveDimension[]
  dimensionsV2: CognitiveDimension[]
  labelV1: string
  labelV2: string
}

/**
 * 对比雷达图组件 - 显示两个版本的数据叠加
 */
const ComparisonRadarChart: React.FC<ComparisonRadarChartProps> = ({
  dimensionsV1,
  dimensionsV2,
  labelV1,
  labelV2,
}) => {
  const size = 350
  const center = size / 2
  const radius = 140
  const levels = 5

  // 合并两个版本的维度名称
  const allDimensionNames = Array.from(
    new Set([...dimensionsV1.map((d) => d.name), ...dimensionsV2.map((d) => d.name)])
  )

  // 获取维度分数
  const getScore = (dimensions: CognitiveDimension[], name: string): number => {
    const dim = dimensions.find((d) => d.name === name)
    return dim?.score ?? 0
  }

  // 计算点的位置
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / allDimensionNames.length - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  // 生成网格路径
  const generateGridPath = (level: number) => {
    const points = allDimensionNames.map((_, i) => {
      const point = getPoint(i, level * 20)
      return `${point.x},${point.y}`
    })
    return `M${points.join('L')}Z`
  }

  // 生成数据路径
  const generateDataPath = (dimensions: CognitiveDimension[]) => {
    const points = allDimensionNames.map((name, i) => {
      const point = getPoint(i, getScore(dimensions, name))
      return `${point.x},${point.y}`
    })
    return `M${points.join('L')}Z`
  }

  // 生成数据点
  const dataPointsV1 = allDimensionNames.map((name, i) => ({
    ...getPoint(i, getScore(dimensionsV1, name)),
    name,
    score: getScore(dimensionsV1, name),
  }))

  const dataPointsV2 = allDimensionNames.map((name, i) => ({
    ...getPoint(i, getScore(dimensionsV2, name)),
    name,
    score: getScore(dimensionsV2, name),
  }))

  // 颜色
  const colorV1 = '#3b82f6' // 蓝色
  const colorV2 = '#10b981' // 绿色
  const gridColor = '#e5e7eb'
  const labelColor = '#374151'

  // 生成标签位置
  const labelPoints = allDimensionNames.map((name, i) => ({
    ...getPoint(i, 115),
    name,
  }))

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 网格层 */}
        {Array.from({ length: levels }).map((_, i) => (
          <path
            key={i}
            d={generateGridPath(i + 1)}
            fill="none"
            stroke={gridColor}
            strokeWidth="1"
          />
        ))}

        {/* 轴线 */}
        {allDimensionNames.map((_, i) => {
          const point = getPoint(i, 100)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke={gridColor}
              strokeWidth="1"
            />
          )
        })}

        {/* 版本1数据区域 */}
        <path
          d={generateDataPath(dimensionsV1)}
          fill={`${colorV1}22`}
          stroke={colorV1}
          strokeWidth="2"
        />

        {/* 版本2数据区域 */}
        <path
          d={generateDataPath(dimensionsV2)}
          fill={`${colorV2}22`}
          stroke={colorV2}
          strokeWidth="2"
        />

        {/* 版本1数据点 */}
        {dataPointsV1.map((point, i) => (
          <circle key={`v1-${i}`} cx={point.x} cy={point.y} r="4" fill={colorV1} />
        ))}

        {/* 版本2数据点 */}
        {dataPointsV2.map((point, i) => (
          <circle key={`v2-${i}`} cx={point.x} cy={point.y} r="4" fill={colorV2} />
        ))}

        {/* 标签 */}
        {labelPoints.map((point, i) => (
          <text
            key={i}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={labelColor}
            fontSize="11"
            fontWeight="500"
          >
            {point.name.length > 6 ? point.name.slice(0, 6) + '...' : point.name}
          </text>
        ))}
      </svg>

      {/* 图例 */}
      <div className="flex items-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorV1 }} />
          <span className="text-sm text-gray-600">{labelV1}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorV2 }} />
          <span className="text-sm text-gray-600">{labelV2}</span>
        </div>
      </div>
    </div>
  )
}

interface DimensionDiffCardProps {
  diff: DimensionDiff
}

/**
 * 维度差异卡片
 */
const DimensionDiffCard: React.FC<DimensionDiffCardProps> = ({ diff }) => {
  const isPositive = diff.change > 0
  const isNeutral = diff.change === 0

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{diff.name}</span>
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            isPositive
              ? 'bg-green-100 text-green-800'
              : isNeutral
                ? 'bg-gray-100 text-gray-600'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {isPositive ? '+' : ''}
          {diff.change}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span>V1: {diff.scoreV1}</span>
        </div>
        <div className="text-gray-300">→</div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>V2: {diff.scoreV2}</span>
        </div>
      </div>

      {/* 进度条对比 */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${diff.scoreV1}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-8">{diff.scoreV1}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${diff.scoreV2}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-8">{diff.scoreV2}%</span>
        </div>
      </div>
    </div>
  )
}

interface CognitiveComparisonProps {
  className?: string
}

export const CognitiveComparison: React.FC<CognitiveComparisonProps> = ({ className }) => {
  const [versions, setVersions] = useState<CognitiveVersionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedV1, setSelectedV1] = useState<string>('')
  const [selectedV2, setSelectedV2] = useState<string>('')

  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [comparing, setComparing] = useState(false)

  // 加载版本列表
  useEffect(() => {
    loadVersions()
  }, [])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const response = await cognitiveApi.getCognitiveVersions()
      if (response.success) {
        setVersions(response.data)
        // 默认选择最新的两个版本
        if (response.data.length >= 2) {
          setSelectedV1(response.data[1].id)
          setSelectedV2(response.data[0].id)
        } else if (response.data.length === 1) {
          setSelectedV1(response.data[0].id)
        }
      }
    } catch (err) {
      setError('加载版本列表失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    if (!selectedV1 || !selectedV2) {
      setError('请选择两个版本进行对比')
      return
    }

    if (selectedV1 === selectedV2) {
      setError('请选择不同的版本进行对比')
      return
    }

    try {
      setComparing(true)
      setError(null)
      const response = await cognitiveApi.compareVersions(selectedV1, selectedV2)
      if (response.success) {
        setComparison(response.data)
      } else {
        setError(response.message || '对比失败')
      }
    } catch (err) {
      setError('对比请求失败')
      console.error(err)
    } finally {
      setComparing(false)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    )
  }

  if (versions.length < 2) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500 mb-4">需要至少 2 个认知版本才能进行对比</p>
        <p className="text-sm text-gray-400">
          当前有 {versions.length} 个版本，请在参加群组讨论或认知测试后保存新版本
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">版本对比</h2>

      {/* 版本选择 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">版本 1 (较早)</label>
            <select
              value={selectedV1}
              onChange={(e) => setSelectedV1(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">选择版本</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionName || `版本 ${v.versionNumber}`} - {formatDate(v.createdAt)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">版本 2 (较新)</label>
            <select
              value={selectedV2}
              onChange={(e) => setSelectedV2(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">选择版本</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionName || `版本 ${v.versionNumber}`} - {formatDate(v.createdAt)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompare}
            disabled={comparing || !selectedV1 || !selectedV2}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {comparing ? '对比中...' : '开始对比'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* 对比结果 */}
      {comparison && (
        <div className="space-y-6">
          {/* 整体变化摘要 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">整体变化</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {comparison.overallChange > 0 ? '+' : ''}
                  {comparison.overallChange}
                </div>
                <div className="text-sm text-gray-500 mt-1">总分变化</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {comparison.improvedDimensions.length}
                </div>
                <div className="text-sm text-gray-500 mt-1">进步维度</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {comparison.declinedDimensions.length}
                </div>
                <div className="text-sm text-gray-500 mt-1">退步维度</div>
              </div>
            </div>
          </div>

          {/* 对比雷达图 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">认知雷达图对比</h3>
            <ComparisonRadarChart
              dimensionsV1={comparison.v1.dimensions}
              dimensionsV2={comparison.v2.dimensions}
              labelV1={comparison.v1.versionName || `版本 ${comparison.v1.versionNumber}`}
              labelV2={comparison.v2.versionName || `版本 ${comparison.v2.versionNumber}`}
            />
          </div>

          {/* 维度差异列表 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">维度变化详情</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparison.diffs.map((diff, index) => (
                <DimensionDiffCard key={index} diff={diff} />
              ))}
            </div>
          </div>

          {/* 改进建议 */}
          {(comparison.improvedDimensions.length > 0 ||
            comparison.declinedDimensions.length > 0) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">分析总结</h3>

              {comparison.improvedDimensions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-green-700 mb-2">进步维度</h4>
                  <div className="flex flex-wrap gap-2">
                    {comparison.improvedDimensions.map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {comparison.declinedDimensions.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">需要关注的维度</h4>
                  <div className="flex flex-wrap gap-2">
                    {comparison.declinedDimensions.map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    建议通过参加相关主题的群组讨论或案例分析来提升这些维度。
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CognitiveComparison