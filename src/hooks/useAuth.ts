import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name?: string
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
  emailVerified: boolean
}

export interface UseAuthReturn {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAdmin: boolean
}

/**
 * Custom hook for authentication
 * Provides user state and authentication methods
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || undefined,
    role: session.user.role,
    emailVerified: session.user.emailVerified
  } : null

  const isAuthenticated = !!session?.user
  const isAdmin = user?.role === 'admin'

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        return { success: false, error: 'Invalid email or password' }
      }

      if (result?.ok) {
        return { success: true }
      }

      return { success: false, error: 'Login failed' }

    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Registration failed' }
      }

      return { success: true }

    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      await signOut({ redirect: false })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    isLoading: status === 'loading' || isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    isAdmin
  }
}

export default useAuth