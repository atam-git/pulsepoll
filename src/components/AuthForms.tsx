'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
      <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">Sign In</h2>
      <p className="text-center text-slate-600 mb-8">Welcome back to PulsePoll</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          label="Email Address"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          type="password"
          label="Password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <Button
          type="submit"
          disabled={isLoading}
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        <p>
          <Link href="/auth/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
            Forgot your password?
          </Link>
        </p>
        <p className="text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
            Sign Up
          </Link>
        </p>
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
      <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">Create Account</h2>
      <p className="text-center text-slate-600 mb-8">Join PulsePoll to create amazing polls</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          label="Email Address"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          type="password"
          label="Password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          helperText="Minimum 8 characters required"
        />

        <Input
          type="password"
          label="Confirm Password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />

        <Button
          type="submit"
          disabled={isLoading}
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
          Sign In
        </Link>
      </p>
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
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Check Your Email</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          If an account exists for <strong className="font-semibold text-slate-900">{email}</strong>, we&apos;ve sent password reset instructions.
        </p>
        <Link href="/auth/login" className="inline-block text-green-600 hover:text-green-700 font-semibold transition-colors">
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">Forgot Password</h2>
      <p className="text-slate-600 text-center mb-8">
        Enter your email and we&apos;ll send you reset instructions.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          label="Email Address"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
        >
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
          Back to Sign In
        </Link>
      </p>
    </div>
  )
}
