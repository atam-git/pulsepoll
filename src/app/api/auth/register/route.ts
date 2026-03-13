import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { withRegistrationRateLimit } from '@/middleware/rateLimit'
import { AuthenticatedRequest } from '@/middleware/auth'

async function registerUser(request: AuthenticatedRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate name if provided
    if (name && name.length > 100) {
      return NextResponse.json(
        { error: 'Name cannot exceed 100 characters' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      emailVerified: false, // Will be true after email verification
      role: 'user',
      profile: {
        name: name?.trim() || undefined
      }
    })

    await user.save()

    // TODO: Send email verification (mock for now)
    console.log(`Email verification would be sent to: ${email}`)

    // Return success response (don't include sensitive data)
    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.profile.name,
          emailVerified: user.emailVerified,
          role: user.role,
          createdAt: user.createdAt
        }
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply rate limiting middleware
export const POST = withRegistrationRateLimit(registerUser)