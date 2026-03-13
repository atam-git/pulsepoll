import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User, { IUser } from '@/models/User'

export interface RegisterUserData {
  email: string
  password: string
  name?: string
}

export interface RegisterUserResult {
  success: boolean
  user?: {
    id: string
    email: string
    name?: string
    emailVerified: boolean
    role: string
    createdAt: Date
  }
  error?: string
}

export interface LoginUserData {
  email: string
  password: string
}

export interface LoginUserResult {
  success: boolean
  user?: {
    id: string
    email: string
    name?: string
    role: string
    emailVerified: boolean
    lastLoginAt?: Date
  }
  error?: string
}

/**
 * Authentication Service
 * Handles user registration, login, and password operations
 */
export class AuthenticationService {
  /**
   * Register a new user
   */
  static async register(userData: RegisterUserData): Promise<RegisterUserResult> {
    try {
      const { email, password, name } = userData

      // Validate input
      const validation = this.validateRegistrationData(userData)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Connect to database
      await connectDB()

      // Check if user already exists
      const existingUser = await User.findByEmail(email)
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' }
      }

      // Hash password
      const passwordHash = await this.hashPassword(password)

      // Create user
      const user = new User({
        email: email.toLowerCase().trim(),
        passwordHash,
        emailVerified: false,
        role: 'user',
        profile: {
          name: name?.trim() || undefined
        }
      })

      await user.save()

      // TODO: Send email verification
      await this.sendEmailVerification(user.email)

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.profile.name,
          emailVerified: user.emailVerified,
          role: user.role,
          createdAt: user.createdAt
        }
      }

    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  /**
   * Authenticate user login
   */
  static async login(loginData: LoginUserData): Promise<LoginUserResult> {
    try {
      const { email, password } = loginData

      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }

      // Connect to database
      await connectDB()

      // Find user
      const user = await User.findByEmail(email)
      if (!user) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Check if user can login (not suspended or banned)
      if (!user.canLogin()) {
        if (user.isBanned()) {
          return { 
            success: false, 
            error: `Account has been banned. Reason: ${user.banReason || 'No reason provided'}` 
          }
        }
        if (user.isSuspended()) {
          const suspendedUntil = user.suspendedUntil 
            ? new Date(user.suspendedUntil).toLocaleDateString() 
            : 'unknown date'
          return { 
            success: false, 
            error: `Account is suspended until ${suspendedUntil}. Reason: ${user.suspensionReason || 'No reason provided'}` 
          }
        }
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.passwordHash)
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Update last login and record activity
      await user.updateLastLogin()

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.profile.name,
          role: user.role,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt
        }
      }

    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  /**
   * Hash password securely
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Validate registration data
   */
  static validateRegistrationData(data: RegisterUserData): { isValid: boolean; error?: string } {
    const { email, password, name } = data

    // Check required fields
    if (!email || !password) {
      return { isValid: false, error: 'Email and password are required' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please provide a valid email address' }
    }

    // Validate password strength
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' }
    }

    // Validate name if provided
    if (name && name.length > 100) {
      return { isValid: false, error: 'Name cannot exceed 100 characters' }
    }

    return { isValid: true }
  }

  /**
   * Send email verification (mock implementation)
   */
  static async sendEmailVerification(email: string): Promise<void> {
    // TODO: Implement actual email sending
    console.log(`Email verification would be sent to: ${email}`)
    
    // Mock implementation - in production, this would:
    // 1. Generate a verification token
    // 2. Store it in database with expiration
    // 3. Send email with verification link
    // 4. Handle verification endpoint
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await connectDB()

      const user = await User.findByEmail(email)
      if (!user) {
        // Don't reveal if email exists for security
        return { success: true }
      }

      // TODO: Generate and store reset token
      console.log(`Password reset token would be generated for: ${email}`)
      
      return { success: true }

    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'Failed to generate reset token' }
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate new password
      if (newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long' }
      }

      // TODO: Validate token and update password
      console.log(`Password would be reset with token: ${token}`)
      
      return { success: true }

    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'Failed to reset password' }
    }
  }
}

export default AuthenticationService