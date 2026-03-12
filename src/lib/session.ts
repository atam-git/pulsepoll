import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import User from '@/models/User'
import connectDB from './mongodb'

export interface SessionUser {
  id: string
  email: string
  role: 'user' | 'admin'
  emailVerified: boolean
}

/**
 * Get the current user session on the server side
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return null
    }

    // Connect to database and get full user details
    await connectDB()
    const user = await User.findByEmail(session.user.email)
    
    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Require authentication for server components/pages
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Require admin role for server components/pages
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return user
}

/**
 * Require email verification for server components/pages
 */
export async function requireEmailVerified(): Promise<SessionUser> {
  const user = await requireAuth()
  
  if (!user.emailVerified) {
    throw new Error('Email verification required')
  }
  
  return user
}

/**
 * Check if user has permission to access a resource
 */
export async function checkPermission(
  resourceOwnerId?: string,
  requiredRole?: 'user' | 'admin'
): Promise<{ user: SessionUser; hasPermission: boolean }> {
  const user = await getCurrentUser()
  
  if (!user) {
    return { user: user as any, hasPermission: false }
  }

  // Admin has access to everything
  if (user.role === 'admin') {
    return { user, hasPermission: true }
  }

  // Check role requirement
  if (requiredRole && user.role !== requiredRole) {
    return { user, hasPermission: false }
  }

  // Check resource ownership
  if (resourceOwnerId && user.id !== resourceOwnerId) {
    return { user, hasPermission: false }
  }

  return { user, hasPermission: true }
}

/**
 * Validate session token manually (for API routes)
 */
export async function validateSessionToken(token: string): Promise<SessionUser | null> {
  try {
    // This would typically decode and validate a JWT token
    // For now, we'll use NextAuth's built-in token validation
    // In a real implementation, you might want to add additional validation
    
    if (!token || token.length < 10) {
      return null
    }

    // Token validation would happen here
    // For now, return null as we're using NextAuth's built-in validation
    return null
  } catch (error) {
    console.error('Error validating session token:', error)
    return null
  }
}

/**
 * Create audit log entry for user actions
 */
export async function createAuditLog(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    // In a real implementation, this would save to an audit log collection
    const auditEntry = {
      userId,
      action,
      resource,
      details,
      timestamp: new Date(),
      ip: 'unknown', // Would get from request
      userAgent: 'unknown' // Would get from request
    }

    console.log('Audit log entry:', auditEntry)
    
    // TODO: Save to database when audit log model is implemented
  } catch (error) {
    console.error('Error creating audit log:', error)
  }
}

/**
 * Check if user account is active and not suspended
 */
export async function checkAccountStatus(userId: string): Promise<{
  isActive: boolean
  isSuspended: boolean
  suspensionReason?: string
}> {
  try {
    await connectDB()
    const user = await User.findById(userId)
    
    if (!user) {
      return { isActive: false, isSuspended: false }
    }

    // Check if account is suspended (would be a field on user model)
    const isSuspended = false // user.suspended || false
    const suspensionReason = undefined // user.suspensionReason
    
    return {
      isActive: true,
      isSuspended,
      suspensionReason
    }
  } catch (error) {
    console.error('Error checking account status:', error)
    return { isActive: false, isSuspended: false }
  }
}