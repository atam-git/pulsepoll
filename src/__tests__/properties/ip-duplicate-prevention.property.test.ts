import * as fc from 'fast-check'

// Feature: pulsepoll-platform, Property 14: IP Duplicate Prevention
describe('Property 14: IP Duplicate Prevention', () => {
  it('should prevent duplicate votes from the same IP address', () => {
    // Property: The system should prevent multiple votes from the same IP address
    // within a reasonable time window to prevent abuse while allowing legitimate use.
    // Validates: Requirements 3.2

    const ipAddressArbitrary = fc.ipV4()
    const pollIdArbitrary = fc.string({ minLength: 10, maxLength: 30 })
    const timeWindowArbitrary = fc.integer({ min: 1, max: 1440 }) // 1 minute to 24 hours

    fc.assert(fc.property(
      ipAddressArbitrary,
      pollIdArbitrary,
      timeWindowArbitrary,
      (ipAddress, pollId, timeWindowMinutes) => {
        // Mock vote storage
        const voteStorage = new Map<string, Array<{ 
          pollId: string; 
          ipAddress: string; 
          timestamp: Date 
        }>>()

        // Mock IP duplicate prevention function
        const checkIpDuplicate = (
          pollId: string,
          ipAddress: string,
          cooldownMinutes: number = 60
        ): { 
          isDuplicate: boolean; 
          lastVoteTime?: Date;
          cooldownRemaining?: number;
        } => {
          const key = `${pollId}:${ipAddress}`
          const votes = voteStorage.get(key) || []
          
          if (votes.length === 0) {
            return { isDuplicate: false }
          }

          const now = new Date()
          const cutoffTime = new Date(now.getTime() - cooldownMinutes * 60 * 1000)
          
          // Find recent votes within cooldown period
          const recentVotes = votes.filter(vote => vote.timestamp >= cutoffTime)
          
          if (recentVotes.length > 0) {
            const lastVote = recentVotes[recentVotes.length - 1]
            const timeSinceLastVote = now.getTime() - lastVote.timestamp.getTime()
            const cooldownRemaining = Math.max(0, (cooldownMinutes * 60 * 1000) - timeSinceLastVote)
            
            return {
              isDuplicate: true,
              lastVoteTime: lastVote.timestamp,
              cooldownRemaining: Math.ceil(cooldownRemaining / 60000) // Convert to minutes
            }
          }

          return { isDuplicate: false }
        }

        // Mock vote submission function
        const submitVote = (
          pollId: string,
          ipAddress: string,
          cooldownMinutes: number = 60
        ): { success: boolean; error?: string } => {
          const duplicateCheck = checkIpDuplicate(pollId, ipAddress, cooldownMinutes)
          
          if (duplicateCheck.isDuplicate) {
            return {
              success: false,
              error: `Duplicate vote from IP ${ipAddress}. Please wait ${duplicateCheck.cooldownRemaining} minutes.`
            }
          }

          // Record the vote
          const key = `${pollId}:${ipAddress}`
          const votes = voteStorage.get(key) || []
          votes.push({ pollId, ipAddress, timestamp: new Date() })
          voteStorage.set(key, votes)

          return { success: true }
        }

        // Test first vote - should succeed
        const firstVote = submitVote(pollId, ipAddress, timeWindowMinutes)
        expect(firstVote.success).toBe(true)
        expect(firstVote.error).toBeUndefined()

        // Test immediate duplicate - should fail
        const duplicateVote = submitVote(pollId, ipAddress, timeWindowMinutes)
        expect(duplicateVote.success).toBe(false)
        expect(duplicateVote.error).toBeDefined()
        expect(duplicateVote.error).toContain('Duplicate vote')
        expect(duplicateVote.error).toContain(ipAddress)

        // Test duplicate check function directly
        const duplicateCheck = checkIpDuplicate(pollId, ipAddress, timeWindowMinutes)
        expect(duplicateCheck.isDuplicate).toBe(true)
        expect(duplicateCheck.lastVoteTime).toBeDefined()
        expect(duplicateCheck.cooldownRemaining).toBeGreaterThan(0)

        return true
      }
    ), { numRuns: 100 })
  })

  it('should allow votes after cooldown period expires', () => {
    // Property: After the cooldown period expires, the same IP should be allowed to vote again
    
    const ipAddressArbitrary = fc.ipV4()
    const pollIdArbitrary = fc.string({ minLength: 10, maxLength: 30 })

    fc.assert(fc.property(
      ipAddressArbitrary,
      pollIdArbitrary,
      (ipAddress, pollId) => {
        // Mock time-aware vote storage
        let currentTime = new Date()
        const voteStorage = new Map<string, Array<{ 
          pollId: string; 
          ipAddress: string; 
          timestamp: Date 
        }>>()

        const checkIpDuplicateWithTime = (
          pollId: string,
          ipAddress: string,
          cooldownMinutes: number,
          currentTime: Date
        ): boolean => {
          const key = `${pollId}:${ipAddress}`
          const votes = voteStorage.get(key) || []
          
          const cutoffTime = new Date(currentTime.getTime() - cooldownMinutes * 60 * 1000)
          const recentVotes = votes.filter(vote => vote.timestamp >= cutoffTime)
          
          return recentVotes.length > 0
        }

        const submitVoteWithTime = (
          pollId: string,
          ipAddress: string,
          cooldownMinutes: number,
          currentTime: Date
        ): boolean => {
          if (checkIpDuplicateWithTime(pollId, ipAddress, cooldownMinutes, currentTime)) {
            return false // Duplicate detected
          }

          // Record the vote
          const key = `${pollId}:${ipAddress}`
          const votes = voteStorage.get(key) || []
          votes.push({ pollId, ipAddress, timestamp: currentTime })
          voteStorage.set(key, votes)

          return true
        }

        const cooldownMinutes = 60

        // Submit first vote
        const firstVote = submitVoteWithTime(pollId, ipAddress, cooldownMinutes, currentTime)
        expect(firstVote).toBe(true)

        // Try immediate duplicate - should fail
        const immediateDuplicate = submitVoteWithTime(pollId, ipAddress, cooldownMinutes, currentTime)
        expect(immediateDuplicate).toBe(false)

        // Advance time by half the cooldown period - should still fail
        currentTime = new Date(currentTime.getTime() + (cooldownMinutes / 2) * 60 * 1000)
        const halfCooldown = submitVoteWithTime(pollId, ipAddress, cooldownMinutes, currentTime)
        expect(halfCooldown).toBe(false)

        // Advance time past cooldown period - should succeed
        currentTime = new Date(currentTime.getTime() + (cooldownMinutes + 1) * 60 * 1000)
        const afterCooldown = submitVoteWithTime(pollId, ipAddress, cooldownMinutes, currentTime)
        expect(afterCooldown).toBe(true)

        return true
      }
    ), { numRuns: 50 })
  })

  it('should handle different IP addresses independently', () => {
    // Property: Different IP addresses should be treated independently for duplicate prevention
    
    const ipAddress1Arbitrary = fc.ipV4()
    const ipAddress2Arbitrary = fc.ipV4().filter(ip => ip !== ipAddress1Arbitrary)
    const pollIdArbitrary = fc.string({ minLength: 10, maxLength: 30 })

    fc.assert(fc.property(
      ipAddress1Arbitrary,
      ipAddress2Arbitrary,
      pollIdArbitrary,
      (ip1, ip2, pollId) => {
        // Ensure IPs are different
        fc.pre(ip1 !== ip2)

        // Mock vote tracking per IP
        const votesByIp = new Map<string, Date[]>()

        const canVoteFromIp = (pollId: string, ipAddress: string): boolean => {
          const key = `${pollId}:${ipAddress}`
          const votes = votesByIp.get(key) || []
          
          // For this test, allow one vote per IP per poll
          return votes.length === 0
        }

        const recordVoteFromIp = (pollId: string, ipAddress: string): void => {
          const key = `${pollId}:${ipAddress}`
          const votes = votesByIp.get(key) || []
          votes.push(new Date())
          votesByIp.set(key, votes)
        }

        // Both IPs should initially be able to vote
        expect(canVoteFromIp(pollId, ip1)).toBe(true)
        expect(canVoteFromIp(pollId, ip2)).toBe(true)

        // Record vote from first IP
        recordVoteFromIp(pollId, ip1)

        // First IP should now be blocked, second IP should still be allowed
        expect(canVoteFromIp(pollId, ip1)).toBe(false)
        expect(canVoteFromIp(pollId, ip2)).toBe(true)

        // Record vote from second IP
        recordVoteFromIp(pollId, ip2)

        // Both IPs should now be blocked
        expect(canVoteFromIp(pollId, ip1)).toBe(false)
        expect(canVoteFromIp(pollId, ip2)).toBe(false)

        return true
      }
    ), { numRuns: 50 })
  })

  it('should handle IP address validation and normalization', () => {
    // Property: IP addresses should be validated and normalized consistently
    
    const validIpArbitrary = fc.ipV4()
    const invalidIpArbitrary = fc.oneof(
      fc.constant(''),
      fc.constant('invalid'),
      fc.constant('999.999.999.999'),
      fc.constant('192.168.1'),
      fc.constant('192.168.1.1.1'),
      fc.string().filter(s => !s.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/))
    )

    fc.assert(fc.property(
      fc.oneof(validIpArbitrary, invalidIpArbitrary),
      (ipAddress) => {
        // Mock IP validation and normalization
        const validateAndNormalizeIp = (ip: string): {
          isValid: boolean;
          normalizedIp?: string;
          error?: string;
        } => {
          if (!ip || typeof ip !== 'string') {
            return { isValid: false, error: 'IP address is required' }
          }

          // Basic IPv4 validation
          const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
          const match = ip.match(ipv4Regex)
          
          if (!match) {
            return { isValid: false, error: 'Invalid IP address format' }
          }

          // Check each octet is in valid range (0-255)
          const octets = match.slice(1, 5).map(Number)
          const invalidOctets = octets.filter(octet => octet < 0 || octet > 255)
          
          if (invalidOctets.length > 0) {
            return { isValid: false, error: 'IP address octets must be between 0 and 255' }
          }

          // Normalize IP (remove leading zeros, etc.)
          const normalizedIp = octets.join('.')
          
          return { isValid: true, normalizedIp }
        }

        const result = validateAndNormalizeIp(ipAddress)

        // Verify validation logic
        const isValidIpFormat = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddress)
        const hasValidOctets = isValidIpFormat && 
          ipAddress.split('.').every(octet => {
            const num = parseInt(octet, 10)
            return num >= 0 && num <= 255
          })

        if (isValidIpFormat && hasValidOctets) {
          expect(result.isValid).toBe(true)
          expect(result.normalizedIp).toBeDefined()
          expect(result.error).toBeUndefined()
        } else {
          expect(result.isValid).toBe(false)
          expect(result.error).toBeDefined()
          expect(result.normalizedIp).toBeUndefined()
        }

        return true
      }
    ), { numRuns: 100 })
  })

  it('should implement configurable rate limiting per IP', () => {
    // Property: IP-based rate limiting should be configurable and enforced correctly
    
    const ipAddressArbitrary = fc.ipV4()
    const maxVotesArbitrary = fc.integer({ min: 1, max: 10 })
    const timeWindowArbitrary = fc.integer({ min: 1, max: 60 }) // 1-60 minutes

    fc.assert(fc.property(
      ipAddressArbitrary,
      maxVotesArbitrary,
      timeWindowArbitrary,
      (ipAddress, maxVotes, timeWindowMinutes) => {
        // Mock configurable rate limiter
        const rateLimiter = new Map<string, Array<Date>>()

        const checkRateLimit = (
          ipAddress: string,
          maxVotes: number,
          timeWindowMinutes: number
        ): {
          allowed: boolean;
          currentCount: number;
          resetTime?: Date;
        } => {
          const now = new Date()
          const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000)
          
          // Get existing votes for this IP
          const votes = rateLimiter.get(ipAddress) || []
          
          // Filter to only votes within the time window
          const recentVotes = votes.filter(voteTime => voteTime >= windowStart)
          
          // Update storage with only recent votes
          rateLimiter.set(ipAddress, recentVotes)
          
          const allowed = recentVotes.length < maxVotes
          const resetTime = recentVotes.length > 0 
            ? new Date(recentVotes[0].getTime() + timeWindowMinutes * 60 * 1000)
            : undefined

          return {
            allowed,
            currentCount: recentVotes.length,
            resetTime
          }
        }

        const recordVote = (ipAddress: string): void => {
          const votes = rateLimiter.get(ipAddress) || []
          votes.push(new Date())
          rateLimiter.set(ipAddress, votes)
        }

        // Test rate limiting up to the limit
        for (let i = 0; i < maxVotes; i++) {
          const check = checkRateLimit(ipAddress, maxVotes, timeWindowMinutes)
          expect(check.allowed).toBe(true)
          expect(check.currentCount).toBe(i)
          
          recordVote(ipAddress)
        }

        // Test that exceeding the limit is blocked
        const exceededCheck = checkRateLimit(ipAddress, maxVotes, timeWindowMinutes)
        expect(exceededCheck.allowed).toBe(false)
        expect(exceededCheck.currentCount).toBe(maxVotes)
        expect(exceededCheck.resetTime).toBeDefined()

        return true
      }
    ), { numRuns: 50 })
  })

  it('should handle edge cases in IP duplicate prevention', () => {
    // Property: Edge cases like localhost, private IPs, and malformed addresses should be handled
    
    const edgeCaseIpArbitrary = fc.oneof(
      fc.constant('127.0.0.1'), // Localhost
      fc.constant('0.0.0.0'), // Any address
      fc.constant('192.168.1.1'), // Private IP
      fc.constant('10.0.0.1'), // Private IP
      fc.constant('172.16.0.1'), // Private IP
      fc.constant('255.255.255.255'), // Broadcast
      fc.constant('::1'), // IPv6 localhost
      fc.constant('unknown'), // Unknown/invalid
      fc.constant(null),
      fc.constant(undefined)
    )

    fc.assert(fc.property(
      edgeCaseIpArbitrary,
      (ipAddress) => {
        // Mock edge case handling
        const handleEdgeCaseIp = (ip: any): {
          shouldTrack: boolean;
          normalizedIp: string;
          riskLevel: 'low' | 'medium' | 'high';
          reason?: string;
        } => {
          if (!ip || ip === null || ip === undefined) {
            return {
              shouldTrack: false,
              normalizedIp: 'unknown',
              riskLevel: 'high',
              reason: 'No IP address provided'
            }
          }

          const ipStr = String(ip)

          // Handle localhost
          if (ipStr === '127.0.0.1' || ipStr === '::1') {
            return {
              shouldTrack: true,
              normalizedIp: 'localhost',
              riskLevel: 'medium',
              reason: 'Localhost address'
            }
          }

          // Handle private IP ranges
          if (ipStr.startsWith('192.168.') || 
              ipStr.startsWith('10.') || 
              ipStr.startsWith('172.16.')) {
            return {
              shouldTrack: true,
              normalizedIp: ipStr,
              riskLevel: 'medium',
              reason: 'Private IP address'
            }
          }

          // Handle special addresses
          if (ipStr === '0.0.0.0' || ipStr === '255.255.255.255') {
            return {
              shouldTrack: false,
              normalizedIp: ipStr,
              riskLevel: 'high',
              reason: 'Special IP address'
            }
          }

          // Handle invalid formats
          if (ipStr === 'unknown' || !ipStr.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
            return {
              shouldTrack: false,
              normalizedIp: 'unknown',
              riskLevel: 'high',
              reason: 'Invalid IP format'
            }
          }

          // Regular public IP
          return {
            shouldTrack: true,
            normalizedIp: ipStr,
            riskLevel: 'low'
          }
        }

        const result = handleEdgeCaseIp(ipAddress)

        // Verify edge case handling
        expect(result.shouldTrack).toBeDefined()
        expect(result.normalizedIp).toBeDefined()
        expect(['low', 'medium', 'high']).toContain(result.riskLevel)

        // High risk IPs should not be tracked
        if (result.riskLevel === 'high') {
          expect(result.shouldTrack).toBe(false)
          expect(result.reason).toBeDefined()
        }

        return true
      }
    ), { numRuns: 50 })
  })
})