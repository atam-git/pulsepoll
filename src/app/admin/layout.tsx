'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, FileText, Users, TrendingUp, LogOut } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin')
      return
    }

    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized')
      return
    }

    setLoading(false)
  }, [status, session, router])

  if (loading || status === 'loading') {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
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
          <p style={{ color: 'var(--color-mid-gray)' }}>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Polls', href: '/admin/polls', icon: FileText },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Top Navigation Bar */}
      <nav 
        style={{
          background: '#FFFFFF',
          boxShadow: 'var(--shadow-sm)',
          borderBottom: '1px solid #E9ECEF',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div className="container mx-auto" style={{ padding: '0 16px' }}>
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '64px'
            }}
          >
            <Link 
              href="/admin" 
              style={{
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                C
              </div>
              Admin
            </Link>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
              }}
            >
              <Link
                href="/dashboard"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-dark-gray)',
                  textDecoration: 'none'
                }}
              >
                User Dashboard
              </Link>
              <div style={{ fontSize: '14px', color: 'var(--color-mid-gray)' }}>
                {session.user.email}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar Navigation */}
        <aside 
          style={{
            width: '256px',
            background: '#FFFFFF',
            boxShadow: 'var(--shadow-sm)',
            borderRight: '1px solid #E9ECEF',
            overflowY: 'auto'
          }}
        >
          <nav style={{ padding: '20px 8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-dark-gray)',
                      background: isActive ? 'var(--color-primary-light)' : 'transparent',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main 
          style={{
            flex: 1,
            padding: '32px 32px',
            background: '#F8F9FA',
            overflowY: 'auto'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
