'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Users, FileText, BarChart3, Zap } from 'lucide-react'

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
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '256px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid var(--color-light-gray)',
              borderTop: '3px solid var(--color-primary)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }}
          />
          <p style={{ color: 'var(--color-mid-gray)' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        style={{
          background: 'rgba(220, 53, 69, 0.1)',
          border: '1px solid #DC3545',
          borderRadius: 'var(--radius-lg)',
          padding: '16px'
        }}
      >
        <p style={{ color: '#DC3545' }}>Error: {error}</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 
          style={{
            fontSize: '32px',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-black)',
            marginBottom: '8px'
          }}
        >
          Admin Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-mid-gray)' }}>
          Welcome back, <strong style={{ color: 'var(--color-black)' }}>{session?.user?.email}</strong>
        </p>
      </div>

      {/* Stats Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        {[
          { icon: Users, label: 'Total Users', value: stats?.totalUsers || 0, color: 'var(--color-primary)' },
          { icon: FileText, label: 'Total Polls', value: stats?.totalPolls || 0, color: 'var(--color-success)' },
          { icon: BarChart3, label: 'Total Votes', value: stats?.totalVotes || 0, color: 'var(--color-accent)' },
          { icon: Zap, label: 'Active Polls', value: stats?.activePolls || 0, color: '#17A2B8' }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div 
              key={idx}
              className="card"
              style={{ padding: '24px', background: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    background: stat.color,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}
                >
                  <Icon size={28} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-mid-gray)', marginBottom: '4px' }}>
                    {stat.label}
                  </p>
                  <p 
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'var(--color-black)',
                      lineHeight: '1'
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div 
        className="card"
        style={{ padding: '24px', background: '#FFFFFF', marginBottom: '32px' }}
      >
        <h2 
          style={{
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-black)',
            marginBottom: '20px'
          }}
        >
          Recent Activity
        </h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.recentActivity.map((activity, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--color-light-gray)' }}>
                <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>
                  {activity.type === 'user' && '👤'}
                  {activity.type === 'poll' && '📋'}
                  {activity.type === 'vote' && '✅'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-black)', marginBottom: '4px' }}>
                    {activity.description}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-mid-gray)' }}>
                    {new Date(activity.timestamp).toLocaleString('en-NG')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p 
            style={{
              color: 'var(--color-mid-gray)',
              textAlign: 'center',
              padding: '32px 16px',
              fontSize: '14px'
            }}
          >
            No recent activity
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}
      >
        <a
          href="/admin/polls"
          className="card"
          style={{
            padding: '32px',
            background: '#FFFFFF',
            textDecoration: 'none',
            display: 'block',
            cursor: 'pointer'
          }}
        >
          <div 
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--color-primary)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              marginBottom: '16px'
            }}
          >
            <FileText size={24} />
          </div>
          <h3 
            style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-black)',
              marginBottom: '8px'
            }}
          >
            Manage Polls
          </h3>
          <p 
            style={{
              fontSize: '14px',
              color: 'var(--color-mid-gray)',
              lineHeight: '1.6'
            }}
          >
            View, moderate, and manage all polls on the platform
          </p>
        </a>

        <a
          href="/admin/users"
          className="card"
          style={{
            padding: '32px',
            background: '#FFFFFF',
            textDecoration: 'none',
            display: 'block',
            cursor: 'pointer'
          }}
        >
          <div 
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--color-success)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              marginBottom: '16px'
            }}
          >
            <Users size={24} />
          </div>
          <h3 
            style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-black)',
              marginBottom: '8px'
            }}
          >
            Manage Users
          </h3>
          <p 
            style={{
              fontSize: '14px',
              color: 'var(--color-mid-gray)',
              lineHeight: '1.6'
            }}
          >
            View user accounts, manage roles, and handle suspensions
          </p>
        </a>

        <a
          href="/admin/analytics"
          className="card"
          style={{
            padding: '32px',
            background: '#FFFFFF',
            textDecoration: 'none',
            display: 'block',
            cursor: 'pointer'
          }}
        >
          <div 
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--color-accent)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              marginBottom: '16px'
            }}
          >
            <BarChart3 size={24} />
          </div>
          <h3 
            style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-black)',
              marginBottom: '8px'
            }}
          >
            View Analytics
          </h3>
          <p 
            style={{
              fontSize: '14px',
              color: 'var(--color-mid-gray)',
              lineHeight: '1.6'
            }}
          >
            Access platform-wide analytics and performance metrics
          </p>
        </a>
      </div>
    </div>
  )
}
