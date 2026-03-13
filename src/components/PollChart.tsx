'use client'

import { useEffect, useState } from 'react'
import { ChartData } from '@/services/analytics'

interface PollChartProps {
  pollId: string
  chartData?: ChartData
  showLegend?: boolean
  height?: number
  onDataUpdate?: (data: ChartData) => void
}

/**
 * Chart component for displaying poll results
 * Uses CSS-based charts for simplicity (no external chart library dependency)
 */
export function PollChart({ 
  pollId, 
  chartData: initialChartData, 
  showLegend = true,
  height = 300,
  onDataUpdate 
}: PollChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(initialChartData || null)
  const [loading, setLoading] = useState(!initialChartData)
  const [error, setError] = useState<string | null>(null)

  // Fetch chart data if not provided
  useEffect(() => {
    if (!initialChartData) {
      fetchChartData()
    }
  }, [pollId, initialChartData])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/polls/${pollId}/analytics?format=chart`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }
      
      const data = await response.json()
      setChartData(data.chartData)
      onDataUpdate?.(data.chartData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-4" style={{ height }}>
        <p className="text-red-600 mb-2">Error loading chart</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchChartData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!chartData || chartData.datasets[0].data.every(value => value === 0)) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        <p>No data to display</p>
      </div>
    )
  }

  return (
    <div className="poll-chart">
      {chartData.type === 'pie' && (
        <PieChart data={chartData} height={height} showLegend={showLegend} />
      )}
      {chartData.type === 'bar' && (
        <BarChart data={chartData} height={height} showLegend={showLegend} />
      )}
      {chartData.type === 'ranking' && (
        <RankingChart data={chartData} height={height} showLegend={showLegend} />
      )}
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        Total votes: {chartData.metadata.totalVotes} • 
        Generated: {new Date(chartData.metadata.generatedAt).toLocaleTimeString()}
      </div>
    </div>
  )
}

/**
 * CSS-based Pie Chart Component
 */
function PieChart({ data, height, showLegend }: { data: ChartData; height: number; showLegend: boolean }) {
  const dataset = data.datasets[0]
  const total = dataset.data.reduce((sum, value) => sum + value, 0)
  
  if (total === 0) return null

  // Calculate angles for pie slices
  let currentAngle = 0
  const slices = dataset.data.map((value, index) => {
    const percentage = (value / total) * 100
    const angle = (value / total) * 360
    const slice = {
      value,
      percentage,
      angle,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: dataset.backgroundColor?.[index] || '#3B82F6',
      label: data.labels[index]
    }
    currentAngle += angle
    return slice
  })

  const chartSize = Math.min(height - 40, 250)
  const radius = chartSize / 2 - 10

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: chartSize, height: chartSize }}>
        <svg width={chartSize} height={chartSize} className="transform -rotate-90">
          <g transform={`translate(${chartSize/2}, ${chartSize/2})`}>
            {slices.map((slice, index) => {
              if (slice.value === 0) return null
              
              const startAngleRad = (slice.startAngle * Math.PI) / 180
              const endAngleRad = (slice.endAngle * Math.PI) / 180
              
              const x1 = radius * Math.cos(startAngleRad)
              const y1 = radius * Math.sin(startAngleRad)
              const x2 = radius * Math.cos(endAngleRad)
              const y2 = radius * Math.sin(endAngleRad)
              
              const largeArcFlag = slice.angle > 180 ? 1 : 0
              
              const pathData = [
                `M 0 0`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity"
                />
              )
            })}
          </g>
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-sm text-gray-500">votes</div>
          </div>
        </div>
      </div>
      
      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate">
                {slice.label} ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * CSS-based Bar Chart Component
 */
function BarChart({ data, height, showLegend }: { data: ChartData; height: number; showLegend: boolean }) {
  const dataset = data.datasets[0]
  const maxValue = Math.max(...dataset.data)
  
  if (maxValue === 0) return null

  const chartHeight = height - 80
  const barWidth = Math.min(60, (400 - 40) / data.labels.length - 10)

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end space-x-2 px-4" style={{ height: chartHeight }}>
        {dataset.data.map((value, index) => {
          const barHeight = (value / maxValue) * (chartHeight - 40)
          const color = dataset.backgroundColor?.[index] || '#3B82F6'
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs font-medium mb-1">{value}</div>
              <div
                className="transition-all duration-500 ease-out rounded-t"
                style={{
                  width: barWidth,
                  height: barHeight,
                  backgroundColor: color
                }}
              />
              <div className="text-xs text-center mt-2 max-w-16 truncate">
                {data.labels[index]}
              </div>
            </div>
          )
        })}
      </div>
      
      {showLegend && (
        <div className="mt-4 text-sm text-gray-600">
          Total responses: {dataset.data.reduce((sum, value) => sum + value, 0)}
        </div>
      )}
    </div>
  )
}

/**
 * Ranking Chart Component (shows average rankings)
 */
function RankingChart({ data, height, showLegend }: { data: ChartData; height: number; showLegend: boolean }) {
  const dataset = data.datasets[0]
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md space-y-3" style={{ height: height - 40 }}>
        {data.labels.map((label, index) => {
          const rank = index + 1
          const avgRank = dataset.data[index]
          const color = dataset.backgroundColor?.[index] || '#3B82F6'
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                   style={{ backgroundColor: color }}>
                {rank}
              </div>
              <div className="flex-1">
                <div className="font-medium truncate">{label}</div>
                <div className="text-sm text-gray-500">
                  Avg. rank: {avgRank.toFixed(1)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {showLegend && (
        <div className="mt-4 text-sm text-gray-600">
          Ranked by average position (lower is better)
        </div>
      )}
    </div>
  )
}