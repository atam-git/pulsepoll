'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserPollDashboard } from '@/components/UserPollDashboard'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/dashboard')
      return
    }

    setLoading(false)
  }, [status, router])

  if (loading || status === 'loading') {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8F9FA'
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
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '14px' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8F9FA'
        }}
      >
        <div 
          style={{
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 32px',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <h1 
            style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-black)',
              marginBottom: '12px'
            }}
          >
            Access Denied
          </h1>
          <p 
            style={{
              fontSize: '14px',
              color: 'var(--color-mid-gray)',
              marginBottom: '24px'
            }}
          >
            You need to be logged in to access the dashboard.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn btn-primary"
            style={{ padding: '12px 32px' }}
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <div className="container mx-auto" style={{ padding: '32px 16px' }}>
        {/* Header */}
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
            Dashboard
          </h1>
          <p 
            style={{
              fontSize: '16px',
              color: 'var(--color-mid-gray)'
            }}
          >
            Welcome back, <strong style={{ color: 'var(--color-black)' }}>{session.user.name || session.user.email}</strong>
          </p>
        </div>

        {/* User Poll Dashboard */}
        <UserPollDashboard userId={session.user.id} />
      </div>
    </div>
  )
}
