'use client'

import { useEffect, useState } from 'react'

interface AnalyticsData {
  platformStats: {
    totalUsers: number
    totalPolls: number
    totalVotes: number
    activePolls: number
  }
  growthMetrics: {
    usersThisWeek: number
    pollsThisWeek: number
    votesThisWeek: number
  }
  topPolls: {
    id: string
    title: string
    totalVotes: number
    uniqueVoters: number
  }[]
  pollTypeDistribution: {
    type: string
    count: number
  }[]
  systemMetrics?: {
    responseTime: {
      avg: number
      p95: number
      p99: number
    }
    errorRate: {
      avg: number
      total: number
    }
    requestCount: {
      total: number
    }
    databaseStats: {
      avgQueryTime: number
      avgConnectionPoolSize: number
    }
  }
  systemMetricsTimeline?: {
    timestamp: string
    responseTime: number
    errorRate: number
    requestCount: number
    activeConnections: number
  }[]
  auditLogs?: {
    id: string
    userEmail?: string
    action: string
    resourceType: string
    resourceId?: string
    status: 'success' | 'failure'
    createdAt: string
    errorMessage?: string
  }[]
  auditStats?: {
    action: string
    total: number
    success: number
    failure: number
    successRate: number
  }[]
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/analytics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600 mt-2">
          View platform-wide statistics, system performance metrics, and audit logs
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.platformStats.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Polls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.platformStats.totalPolls || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.platformStats.totalVotes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Polls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.platformStats.activePolls || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Performance Metrics */}
      {analytics?.systemMetrics && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Performance (Last 24 Hours)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-blue-600">
                {analytics.systemMetrics.responseTime.avg.toFixed(0)}ms
              </p>
              <p className="text-xs text-gray-500">
                P95: {analytics.systemMetrics.responseTime.p95.toFixed(0)}ms
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {analytics.systemMetrics.errorRate.avg.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">
                {analytics.systemMetrics.errorRate.total} total errors
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-green-600">
                {analytics.systemMetrics.requestCount.total.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Avg Query Time</p>
              <p className="text-2xl font-bold text-purple-600">
                {analytics.systemMetrics.databaseStats.avgQueryTime.toFixed(0)}ms
              </p>
              <p className="text-xs text-gray-500">
                Pool: {analytics.systemMetrics.databaseStats.avgConnectionPoolSize.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Growth Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Growth</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">New Users</p>
            <p className="text-3xl font-bold text-blue-600">
              {analytics?.growthMetrics.usersThisWeek || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">New Polls</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics?.growthMetrics.pollsThisWeek || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">New Votes</p>
            <p className="text-3xl font-bold text-purple-600">
              {analytics?.growthMetrics.votesThisWeek || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Polls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Polls by Votes</h2>
          </div>
          <div className="p-6">
            {analytics?.topPolls && analytics.topPolls.length > 0 ? (
              <div className="space-y-4">
                {analytics.topPolls.map((poll, index) => (
                  <div key={poll.id} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-lg font-bold text-gray-400 w-8">
                        #{index + 1}
                      </span>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {poll.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {poll.uniqueVoters} unique voters
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="text-lg font-bold text-blue-600">
                        {poll.totalVotes}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">votes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No poll data available</p>
            )}
          </div>
        </div>

        {/* Poll Type Distribution */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Poll Type Distribution</h2>
          </div>
          <div className="p-6">
            {analytics?.pollTypeDistribution && analytics.pollTypeDistribution.length > 0 ? (
              <div className="space-y-4">
                {analytics.pollTypeDistribution.map((item) => (
                  <div key={item.type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (item.count /
                              analytics.pollTypeDistribution.reduce(
                                (sum, i) => sum + i.count,
                                0
                              )) *
                            100
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No poll type data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      {analytics?.auditLogs && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audit Statistics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Audit Statistics (Last 24 Hours)</h2>
            </div>
            <div className="p-6">
              {analytics.auditStats && analytics.auditStats.length > 0 ? (
                <div className="space-y-4">
                  {analytics.auditStats.map((stat) => (
                    <div key={stat.action} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {stat.action.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {stat.total} total
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Success: {stat.success}</span>
                        <span>Failed: {stat.failure}</span>
                        <span>Rate: {stat.successRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${stat.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No audit statistics available</p>
              )}
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Audit Logs</h2>
            </div>
            <div className="p-6">
              {analytics.auditLogs.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analytics.auditLogs.slice(0, 20).map((log) => (
                    <div key={log.id} className="border-l-4 border-gray-200 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {log.action}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">User:</span> {log.userEmail || 'System'}
                        {log.resourceType && (
                          <>
                            <span className="ml-3 font-medium">Resource:</span> {log.resourceType}
                            {log.resourceId && <span className="ml-1">({log.resourceId})</span>}
                          </>
                        )}
                      </div>
                      {log.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {log.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No audit logs available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
