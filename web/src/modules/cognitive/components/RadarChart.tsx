/**
 * 认知雷达图组件
 */
import React from 'react'

interface Dimension {
  name: string
  score: number
}

interface RadarChartProps {
  dimensions: Dimension[]
}

export const RadarChart: React.FC<RadarChartProps> = ({ dimensions }) => {
  const size = 300
  const center = size / 2
  const radius = 120
  const levels = 5

  // 计算点的位置
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  // 生成网格路径
  const generateGridPath = (level: number) => {
    const points = dimensions.map((_, i) => {
      const point = getPoint(i, level * 20)
      return `${point.x},${point.y}`
    })
    return `M${points.join('L')}Z`
  }

  // 生成数据路径
  const generateDataPath = () => {
    const points = dimensions.map((dim, i) => {
      const point = getPoint(i, dim.score)
      return `${point.x},${point.y}`
    })
    return `M${points.join('L')}Z`
  }

  // 生成数据点
  const dataPoints = dimensions.map((dim, i) => ({
    ...getPoint(i, dim.score),
    label: getPoint(i, 115),
    name: dim.name,
    score: dim.score,
  }))

  // 颜色
  const primaryColor = '#3b82f6'
  const gridColor = '#e5e7eb'
  const labelColor = '#374151'

  return (
    <div className="flex justify-center">
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
        {dimensions.map((_, i) => {
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

        {/* 数据区域 */}
        <path
          d={generateDataPath()}
          fill={`${primaryColor}33`}
          stroke={primaryColor}
          strokeWidth="2"
        />

        {/* 数据点 */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={primaryColor}
          />
        ))}

        {/* 标签 */}
        {dataPoints.map((point, i) => (
          <text
            key={i}
            x={point.label.x}
            y={point.label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={labelColor}
            fontSize="12"
            fontWeight="500"
          >
            {point.name}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default RadarChart