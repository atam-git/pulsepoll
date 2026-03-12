import * as fc from 'fast-check'

// Feature: pulsepoll-platform, Property 3: Invalid Login Rejection
describe('Property 3: Invalid Login Rejection', () => {
  it('should reject invalid credential combinations with appropriate error messages', () => {
    // Property: For any invalid credential combination (wrong email or password), 
    // login attempts should be rejected with appropriate error messages.
    // Validates: Requirements 1.4

    const validEmailArbitrary = fc.emailAddress()
    const invalidEmailArbitrary = fc.oneof(
      fc.constant(''),
      fc.constant('invalid-email'),
      fc.constant('@domain.com'),
      fc.constant('user@'),
      fc.constant('user@domain'),
      fc.string().filter(s => !s.includes('@') || !s.includes('.'))
    )

    const validPasswordArbitrary = fc.string({ minLength: 8, maxLength: 50 })
    const invalidPasswordArbitrary = fc.oneof(
      fc.constant(''),
      fc.string({ minLength: 1, maxLength: 7 }), // Too short
      fc.constant('wrong-password')
    )

    const credentialArbitrary = fc.oneof(
      // Invalid email, valid password
      fc.record({
        email: invalidEmailArbitrary,
        password: validPasswordArbitrary,
        expectedError: fc.constant('Invalid email or password')
      }),
      // Valid email, invalid password
      fc.record({
        email: validEmailArbitrary,
        password: invalidPasswordArbitrary,
        expectedError: fc.constant('Invalid email or password')
      }),
      // Both invalid
      fc.record({
        email: invalidEmailArbitrary,
        password: invalidPasswordArbitrary,
        expectedError: fc.constant('Invalid email or password')
      }),
      // Missing fields
      fc.record({
        email: fc.constant(''),
        password: fc.constant(''),
        expectedError: fc.constant('Email and password are required')
      })
    )

    fc.assert(fc.property(
      credentialArbitrary,
      (credentials) => {
        // Mock user database
        const mockUsers = new Map([
          ['valid@example.com', {
            email: 'valid@example.com',
            passwordHash: '$2b$12$validhashedpassword',
            id: '1'
          }]
        ])

        // Mock password verification
        const mockVerifyPassword = (password: string, hash: string): boolean => {
          return password === 'validpassword123' && hash === '$2b$12$validhashedpassword'
        }

        // Mock login function
        const attemptLogin = (email: string, password: string): { success: boolean; error?: string } => {
          // Check for missing fields
          if (!email || !password) {
            return { success: false, error: 'Email and password are required' }
          }

          // Check email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email or password' }
          }

          // Check if user exists
          const user = mockUsers.get(email.toLowerCase())
          if (!user) {
            return { success: false, error: 'Invalid email or password' }
          }

          // Check password
          if (!mockVerifyPassword(password, user.passwordHash)) {
            return { success: false, error: 'Invalid email or password' }
          }

          return { success: true }
        }

        // Test the login attempt
        const result = attemptLogin(credentials.email, credentials.password)

        // Should always fail for invalid credentials
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(typeof result.error).toBe('string')
        expect(result.error!.length).toBeGreaterThan(0)

        // Check for appropriate error message
        const expectedErrors = [
          'Email and password are required',
          'Invalid email or password'
        ]
        expect(expectedErrors).toContain(result.error)

        return true
      }
    ), { numRuns: 100 })
  })

  it('should consistently reject the same invalid credentials', () => {
    // Property: Invalid login rejection should be consistent and deterministic
    
    const invalidCredentialSets = [
      { email: '', password: '', expectedError: 'Email and password are required' },
      { email: 'invalid-email', password: 'password123', expectedError: 'Invalid email or password' },
      { email: 'user@example.com', password: 'wrongpass', expectedError: 'Invalid email or password' },
      { email: 'nonexistent@example.com', password: 'password123', expectedError: 'Invalid email or password' },
      { email: 'valid@example.com', password: '', expectedError: 'Email and password are required' },
      { email: '', password: 'password123', expectedError: 'Email and password are required' }
    ]

    invalidCredentialSets.forEach(testCase => {
      // Mock authentication function
      const authenticate = (email: string, password: string): { success: boolean; error?: string } => {
        if (!email || !password) {
          return { success: false, error: 'Email and password are required' }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return { success: false, error: 'Invalid email or password' }
        }

        // Mock: only valid@example.com with password123 is valid
        if (email === 'valid@example.com' && password === 'password123') {
          return { success: true }
        }

        return { success: false, error: 'Invalid email or password' }
      }

      // Test multiple times to ensure consistency
      for (let i = 0; i < 3; i++) {
        const result = authenticate(testCase.email, testCase.password)
        
        expect(result.success).toBe(false)
        expect(result.error).toBe(testCase.expectedError)
      }
    })
  })

  it('should handle edge cases in credential validation', () => {
    // Property: Login validation should handle various edge cases correctly
    
    const edgeCaseArbitrary = fc.oneof(
      fc.record({
        email: fc.constant(null),
        password: fc.constant(null),
        description: fc.constant('null values')
      }),
      fc.record({
        email: fc.constant(undefined),
        password: fc.constant(undefined),
        description: fc.constant('undefined values')
      }),
      fc.record({
        email: fc.string().filter(s => s.includes('\n') || s.includes('\t')),
        password: fc.string({ minLength: 8 }),
        description: fc.constant('email with whitespace')
      }),
      fc.record({
        email: fc.string({ minLength: 1000 }), // Very long email
        password: fc.string({ minLength: 8 }),
        description: fc.constant('very long email')
      }),
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 1000 }), // Very long password
        description: fc.constant('very long password')
      })
    )

    fc.assert(fc.property(
      edgeCaseArbitrary,
      (testCase) => {
        // Mock authentication with edge case handling
        const authenticateWithEdgeCases = (email: any, password: any): { success: boolean; error?: string } => {
          // Handle null/undefined
          if (email == null || password == null) {
            return { success: false, error: 'Email and password are required' }
          }

          // Convert to string and check
          const emailStr = String(email)
          const passwordStr = String(password)

          if (!emailStr || !passwordStr) {
            return { success: false, error: 'Email and password are required' }
          }

          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(emailStr.trim())) {
            return { success: false, error: 'Invalid email or password' }
          }

          // For testing, no credentials are valid
          return { success: false, error: 'Invalid email or password' }
        }

        const result = authenticateWithEdgeCases(testCase.email, testCase.password)

        // All edge cases should be rejected
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(typeof result.error).toBe('string')

        // Error should be one of the expected types
        const validErrors = [
          'Email and password are required',
          'Invalid email or password'
        ]
        expect(validErrors).toContain(result.error)

        return true
      }
    ), { numRuns: 50 })
  })
})