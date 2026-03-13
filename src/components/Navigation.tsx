'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationLinks = [
    { label: 'Businesses', href: '/' },
    { label: 'Articles', href: '/directory' },
    { label: 'Real Estate', href: '/' },
    { label: 'Jobs', href: '/' },
    { label: 'Events', href: '/' },
  ]

  return (
    <header 
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E9ECEF'
      }}
      className="shadow-sm"
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link 
            href="/" 
            style={{
              fontSize: '24px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--color-primary)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              C
            </span>
            ConnectNigeria
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" style={{ gap: '24px' }}>
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-dark-gray)',
                  transition: 'color 0.2s ease'
                }}
                className="hover:text-primary"
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-dark-gray)'}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div style={{ color: 'var(--color-mid-gray)', fontSize: '14px' }}>
                Loading...
              </div>
            ) : session ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/dashboard"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-dark-gray)',
                    transition: 'color 0.2s ease'
                  }}
                  className="hover:text-primary"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-dark-gray)'}
                >
                  Dashboard
                </Link>
                <Link
                  href="/poll/create"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                >
                  Create
                </Link>
                <button
                  onClick={() => signOut()}
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-dark-gray)',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease',
                    background: 'none',
                    border: 'none',
                    padding: '8px 12px'
                  }}
                  className="hover:text-primary"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-dark-gray)'}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="btn btn-ghost"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                >
                  List Your Business
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: 'var(--color-dark-gray)'
              }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          className="md:hidden"
          style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderBottom: '1px solid #E9ECEF',
            padding: '16px'
          }}
        >
          <nav className="flex flex-col gap-3" style={{ gap: '12px' }}>
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-dark-gray)',
                  padding: '8px 0'
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-dark-gray)',
                    padding: '8px 0'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/poll/create"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create
                </Link>
                <button
                  onClick={() => {
                    signOut()
                    setIsMenuOpen(false)
                  }}
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-dark-gray)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '8px 0',
                    textAlign: 'left'
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="btn btn-ghost"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  List Your Business
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
