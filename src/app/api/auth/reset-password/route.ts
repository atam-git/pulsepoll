import { NextRequest, NextResponse } from 'next/server'
import AuthenticationService from '@/services/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate password reset token
    const result = await AuthenticationService.generatePasswordResetToken(email)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate reset token' },
        { status: 500 }
      )
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}