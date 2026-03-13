'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const result = await login({ email, password })
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-black)',
            marginBottom: '8px'
          }}
        >
          Welcome Back
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-mid-gray)' }}>
          Sign in to your ConnectNigeria account
        </p>
      </div>

      {error && (
        <div 
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#fff5f5',
            border: '1px solid #DC3545',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            gap: '12px',
            alignItems: 'start'
          }}
        >
          <AlertCircle size={20} style={{ color: '#DC3545', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: '#DC3545' }}>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label 
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-dark-gray)',
              marginBottom: '6px'
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field"
            style={{ width: '100%' }}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label 
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-dark-gray)'
              }}
            >
              Password
            </label>
            <Link 
              href="/auth/forgot-password"
              style={{
                fontSize: '13px',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            style={{ width: '100%' }}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: 600,
            marginTop: '8px',
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div 
        style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--color-light-gray)',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--color-mid-gray)'
        }}
      >
        Don&apos;t have an account?{' '}
        <Link 
          href="/auth/register"
          style={{
            color: 'var(--color-primary)',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Create one now
        </Link>
      </div>
    </div>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const { register, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const result = await register({ email, password })
    if (result.success) {
      router.push('/auth/login?registered=true')
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-black)',
            marginBottom: '8px'
          }}
        >
          List Your Business
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-mid-gray)' }}>
          Create your ConnectNigeria account to get started
        </p>
      </div>

      {error && (
        <div 
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#fff5f5',
            border: '1px solid #DC3545',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            gap: '12px',
            alignItems: 'start'
          }}
        >
          <AlertCircle size={20} style={{ color: '#DC3545', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: '#DC3545' }}>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label 
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-dark-gray)',
              marginBottom: '6px'
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field"
            style={{ width: '100%' }}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label 
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-dark-gray)',
              marginBottom: '6px'
            }}
          >
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            style={{ width: '100%' }}
            placeholder="At least 8 characters"
          />
          <p style={{ fontSize: '12px', color: 'var(--color-mid-gray)', marginTop: '4px' }}>
            Use a combination of letters, numbers, and symbols
          </p>
        </div>

        <div>
          <label 
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-dark-gray)',
              marginBottom: '6px'
            }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="input-field"
            style={{ width: '100%' }}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: 600,
            marginTop: '8px',
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div 
        style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--color-light-gray)',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--color-mid-gray)'
        }}
      >
        Already have an account?{' '}
        <Link 
          href="/auth/login"
          style={{
            color: 'var(--color-primary)',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Sign in here
        </Link>
      </div>
    </div>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setLoading(true)
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Request failed')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div 
          style={{
            width: '64px',
            height: '64px',
            background: '#e6f4ea',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: 'var(--color-primary)'
          }}
        >
          <Mail size={32} />
        </div>
        <h2 
          style={{
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-black)',
            marginBottom: '12px'
          }}
        >
          Check Your Email
        </h2>
        <p 
          style={{
            fontSize: '14px',
            color: 'var(--color-mid-gray)',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}
        >
          If an account exists for <strong style={{ color: 'var(--color-black)' }}>{email}</strong>, we&apos;ve sent password reset instructions.
        </p>
        <Link 
          href="/auth/login"
          style={{
            fontSize: '14px',
            color: 'var(--color-primary)',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          ← Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-black)',
            marginBottom: '8px'
          }}
        >
          Forgot Password?
        </h2>
        <p 
          style={{
            fontSize: '14px',
            color: 'var(--color-mid-gray)',
            lineHeight: '1.5'
          }}
        >
          Enter your email and we&apos;ll send you reset instructions.
        </p>
      </div>

      {error && (
        <div 
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#fff5f5',
            border: '1px solid #DC3545',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            gap: '12px',
            alignItems: 'start'
          }}
        >
          <AlertCircle size={20} style={{ color: '#DC3545', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: '#DC3545' }}>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label 
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-dark-gray)',
              marginBottom: '6px'
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field"
            style={{ width: '100%' }}
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: 600,
            marginTop: '8px',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p 
        style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--color-light-gray)',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--color-mid-gray)'
        }}
      >
        <Link 
          href="/auth/login"
          style={{
            color: 'var(--color-primary)',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          ← Back to Sign In
        </Link>
      </p>
    </div>
  )
}
