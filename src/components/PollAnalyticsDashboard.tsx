'use client'

import { useEffect, useState } from 'react'
import { PollChart } from './PollChart'
import { PollExportDialog, ExportHistory } from './PollExportDialog'
import { PollAnalytics, ChartData } from '@/services/analytics'

interface PollAnalyticsDashboardProps {
  pollId: string
  showRealTimeUpdates?: boolean
  refreshInterval?: number
}

interface AnalyticsData {
  analytics: PollAnalytics
  chartData: ChartData
  poll: {
    id: string
    title: string
    type: string
    status: string
  }
}

export function PollAnalyticsDashboard({ 
  pollId, 
  showRealTimeUpdates = true,
  refreshInterval = 30000 // 30 seconds
}: PollAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'analytics' | 'exports'>('analytics')

  useEffect(() => {
    fetchAnalytics()
    
    let interval: NodeJS.Timeout | null = null
    if (showRealTimeUpdates) {
      interval = setInterval(fetchAnalytics, refreshInterval)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [pollId, showRealTimeUpdates, refreshInterval])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}/analytics`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const result = await response.json()
      setData(result)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatReferralSource = (source: string): string => {
    const sourceMap: { [key: string]: string } = {
      'direct': 'Direct Access',
      'google': 'Google Search',
      'bing': 'Bing Search',
      'yahoo': 'Yahoo Search',
      'duckduckgo': 'DuckDuckGo Search',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'linkedin': 'LinkedIn',
      'reddit': 'Reddit',
      'instagram': 'Instagram',
      'email': 'Email',
      'qr_code': 'QR Code',
      'embed': 'Embedded Widget',
      'mobile_app': 'Mobile App'
    }

    return sourceMap[source] || source.charAt(0).toUpperCase() + source.slice(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Error loading analytics</p>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center p-8 text-gray-600">
        No analytics data available
      </div>
    )
  }

  const { analytics, chartData, poll } = data

  return (
    <div className="poll-analytics-dashboard space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{poll.title || 'Untitled Poll'}</h2>
            <p className="text-gray-600">Analytics Dashboard</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowExportDialog(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Export Data</span>
            </button>
            <div className="text-right text-sm text-gray-600">
              <p>Status: <span className="capitalize font-medium">{poll.status}</span></p>
              {lastUpdated && (
                <p>Updated: {lastUpdated.toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Votes"
            value={analytics.totalVotes}
            icon="📊"
          />
          <MetricCard
            title="Unique Voters"
            value={analytics.uniqueVoters}
            icon="👥"
          />
          <MetricCard
            title="Response Rate"
            value={`${analytics.responseRate.toFixed(1)}%`}
            icon="📈"
          />
          <MetricCard
            title="Completion Rate"
            value={`${analytics.completionRate.toFixed(1)}%`}
            icon="✅"
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('exports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'exports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Exports
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <>
          {/* Chart Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Results Visualization</h3>
            <PollChart 
              pollId={pollId} 
              chartData={chartData}
              height={350}
            />
          </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Results</h3>
        <div className="space-y-3">
          {analytics.optionAnalytics.map((option, index) => (
            <div key={option.optionId} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{option.text}</span>
                <div className="text-right">
                  <span className="text-lg font-bold">{option.voteCount}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({option.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
              
              {/* Ranking info for ranking polls */}
              {option.averageRank && (
                <div className="mt-2 text-sm text-gray-600">
                  Average rank: {option.averageRank.toFixed(1)}
                  {option.rank && ` (Position #${option.rank})`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Demographics */}
      {(Object.keys(analytics.demographics.locations).length > 0 ||
        Object.keys(analytics.demographics.deviceTypes).length > 0 ||
        Object.keys(analytics.demographics.referralSources).length > 0) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Demographics</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Device Types */}
            {Object.keys(analytics.demographics.deviceTypes).length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Device Types</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.demographics.deviceTypes).map(([device, count]) => (
                    <div key={device} className="flex justify-between items-center">
                      <span className="capitalize">{device}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locations */}
            {Object.keys(analytics.demographics.locations).length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Locations</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.demographics.locations)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([location, count]) => (
                    <div key={location} className="flex justify-between items-center">
                      <span>{location}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referral Sources */}
            {Object.keys(analytics.demographics.referralSources).length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Referral Sources</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.demographics.referralSources)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([source, count]) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className="capitalize">{formatReferralSource(source)}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {analytics.timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Voting Timeline</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analytics.timeline.slice(-10).map((entry, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{entry.timestamp.toLocaleString()}</span>
                <span>Vote #{entry.cumulativeVotes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Insights */}
      {analytics.peakVotingTime && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Peak voting time:</span>
              <span className="font-medium">
                {analytics.peakVotingTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            
            {analytics.averageTimeToVote && (
              <div className="flex justify-between items-center">
                <span>Average time to vote:</span>
                <span className="font-medium">
                  {Math.round(analytics.averageTimeToVote / 1000)}s
                </span>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === 'exports' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Export History</h3>
            <button
              onClick={() => setShowExportDialog(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Export
            </button>
          </div>
          <ExportHistory pollId={pollId} />
        </div>
      )}

      {/* Export Dialog */}
      <PollExportDialog
        pollId={pollId}
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExportCreated={(exportData) => {
          console.log('Export created:', exportData)
          // Optionally refresh export history
        }}
      />
    </div>
  )
}

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  )
}