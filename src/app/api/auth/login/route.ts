import { NextRequest, NextResponse } from 'next/server'
import AuthenticationService from '@/services/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Attempt login
    const result = await AuthenticationService.login({ email, password })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Login failed' },
        { status: 401 }
      )
    }

    // Return success response
    return NextResponse.json(
      {
        message: 'Login successful',
        user: result.user
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}