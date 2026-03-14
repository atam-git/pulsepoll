'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { WelcomeSection } from '@/components/dashboard/WelcomeSection'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { FeatureGrid } from '@/components/dashboard/FeatureGrid'
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  FireIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalUsers: number
  totalPolls: number
  totalVotes: number
  activePolls: number
  recentActivity: {
    type: 'user' | 'poll' | 'vote'
    description: string
    timestamp: Date
  }[]
}

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }

      const data = await response.json()
      setStats(data.stats)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    )
  }

  const statsData = [
    {
      id: 'users',
      icon: UsersIcon,
      iconBgColor: 'bg-blue-500',
      label: 'Total Users',
      value: stats?.totalUsers || 0,
    },
    {
      id: 'polls',
      icon: ClipboardDocumentListIcon,
      iconBgColor: 'bg-green-500',
      label: 'Total Polls',
      value: stats?.totalPolls || 0,
    },
    {
      id: 'votes',
      icon: CheckCircleIcon,
      iconBgColor: 'bg-purple-500',
      label: 'Total Votes',
      value: stats?.totalVotes || 0,
    },
    {
      id: 'active',
      icon: FireIcon,
      iconBgColor: 'bg-orange-500',
      label: 'Active Polls',
      value: stats?.activePolls || 0,
    },
  ]

  const features = [
    {
      id: 'polls',
      icon: ClipboardDocumentListIcon,
      title: 'Manage Polls',
      description: 'View, moderate, and manage all polls on the platform.',
      linkText: 'Go to Polls',
      linkHref: '/admin/polls',
    },
    {
      id: 'users',
      icon: Cog6ToothIcon,
      title: 'Manage Users',
      description: 'View user accounts, manage roles, and handle suspensions.',
      linkText: 'Go to Users',
      linkHref: '/admin/users',
    },
    {
      id: 'analytics',
      icon: ChartBarIcon,
      title: 'View Analytics',
      description: 'Access platform-wide analytics and performance metrics.',
      linkText: 'View Analytics',
      linkHref: '/admin/analytics',
    },
  ]

  return (
    <div className="space-y-8">
      <WelcomeSection
        userName={session?.user?.name || session?.user?.email || 'Admin'}
        subtitle="Here's an overview of your platform."
        ctaTitle="Admin Panel"
        ctaDescription="Manage users, polls, and view analytics."
        ctaButtonText="View Analytics"
        ctaButtonHref="/admin/analytics"
      />

      <StatsGrid stats={statsData} />

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">
                    {activity.type === 'user' && '👤'}
                    {activity.type === 'poll' && '📋'}
                    {activity.type === 'vote' && '✅'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      <FeatureGrid features={features} />
    </div>
  )
}
