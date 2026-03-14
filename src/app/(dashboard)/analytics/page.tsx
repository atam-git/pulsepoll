'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChartBarIcon,
  EyeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface UserAnalytics {
  overview: {
    totalPolls: number
    activePolls: number
    totalVotes: number
    totalViews: number
    engagementRate: number
  }
  growth: {
    pollsThisWeek: number
    pollsThisMonth: number
    votesThisWeek: number
    votesThisMonth: number
    pollGrowth: number
    voteGrowth: number
  }
  topPolls: {
    id: string
    title: string
    totalVotes: number
    viewCount: number
    engagementRate: number
    createdAt: string
    status: string
  }[]
  pollTypeDistribution: {
    type: string
    count: number
  }[]
  recentActivity: {
    id: string
    title: string
    totalVotes: number
    viewCount: number
    createdAt: string
    status: string
  }[]
  trends: {
    thisMonth: {
      polls: number
      votes: number
    }
    lastMonth: {
      polls: number
      votes: number
    }
    growth: {
      polls: number
      votes: number
    }
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/analytics')
      
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    )
  }

  const formatGrowth = (growth: number) => {
    if (growth === 0) return { text: '0%', color: 'text-gray-600', icon: null }
    if (growth > 0) return { 
      text: `+${growth}%`, 
      color: 'text-green-600', 
      icon: <ArrowUpIcon className="h-4 w-4" />
    }
    return { 
      text: `${growth}%`, 
      color: 'text-red-600', 
      icon: <ArrowDownIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track your poll performance and engagement metrics
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Total Polls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.overview.totalPolls}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Active Polls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.overview.activePolls}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <UsersIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Total Votes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.overview.totalVotes.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <EyeIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.overview.totalViews.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Engagement</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.overview.engagementRate}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Growth Metrics */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Growth Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-2">Polls This Month</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.growth.pollsThisMonth}
            </p>
            <div className={`flex items-center justify-center gap-1 text-sm ${formatGrowth(analytics.growth.pollGrowth).color}`}>
              {formatGrowth(analytics.growth.pollGrowth).icon}
              <span>{formatGrowth(analytics.growth.pollGrowth).text}</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-700 mb-2">Votes This Month</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.growth.votesThisMonth.toLocaleString()}
            </p>
            <div className={`flex items-center justify-center gap-1 text-sm ${formatGrowth(analytics.growth.voteGrowth).color}`}>
              {formatGrowth(analytics.growth.voteGrowth).icon}
              <span>{formatGrowth(analytics.growth.voteGrowth).text}</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-700 mb-2">Polls This Week</p>
            <p className="text-3xl font-bold text-blue-600">
              {analytics.growth.pollsThisWeek}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-700 mb-2">Votes This Week</p>
            <p className="text-3xl font-bold text-purple-600">
              {analytics.growth.votesThisWeek.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Polls */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Performing Polls</h2>
          </div>
          <div className="p-6">
            {analytics.topPolls.length > 0 ? (
              <div className="space-y-4">
                {analytics.topPolls.map((poll, index) => (
                  <div key={poll.id} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-lg font-bold text-gray-600 w-8">
                        #{index + 1}
                      </span>
                      <div className="ml-3 flex-1">
                        <Link 
                          href={`/polls/${poll.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors line-clamp-1"
                        >
                          {poll.title}
                        </Link>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                          <span>{poll.viewCount} views</span>
                          <span>{poll.engagementRate}% engagement</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            poll.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {poll.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <span className="text-lg font-bold text-green-600">
                        {poll.totalVotes}
                      </span>
                      <span className="text-xs text-gray-600 ml-1">votes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No polls created yet</p>
            )}
          </div>
        </Card>

        {/* Poll Type Distribution */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Poll Type Distribution</h2>
          </div>
          <div className="p-6">
            {analytics.pollTypeDistribution.length > 0 ? (
              <div className="space-y-4">
                {analytics.pollTypeDistribution.map((item) => {
                  const total = analytics.pollTypeDistribution.reduce((sum, i) => sum + i.count, 0)
                  const percentage = total > 0 ? (item.count / total) * 100 : 0
                  
                  return (
                    <div key={item.type}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No poll type data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity (Last 30 Days)</h2>
          <Link
            href="/polls"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View All Polls
          </Link>
        </div>
        <div className="p-6">
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {analytics.recentActivity.map((poll) => (
                <div key={poll.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <Link 
                      href={`/polls/${poll.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors"
                    >
                      {poll.title}
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                      <span>{poll.totalVotes} votes</span>
                      <span>{poll.viewCount} views</span>
                      <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        poll.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {poll.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No recent activity</p>
              <Button
                href="/poll/create"
                variant="primary"
                size="md"
              >
                Create Your First Poll
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
