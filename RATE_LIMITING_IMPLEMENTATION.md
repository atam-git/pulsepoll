# Rate Limiting System Implementation

## Overview

The PulsePoll platform implements a comprehensive rate limiting system to protect against abuse and ensure fair usage across different types of endpoints. The system uses different rate limits for different endpoint categories and provides proper error handling and user feedback.

## Architecture

### Core Components

1. **RateLimitService** (`src/services/rateLimit.ts`)
   - Core rate limiting logic
   - In-memory storage with automatic cleanup
   - Configurable key generators
   - Support for different rate limit configurations

2. **Rate Limiting Middleware** (`src/middleware/rateLimit.ts`)
   - Express-style middleware for API routes
   - Automatic header injection
   - Error handling and graceful degradation
   - Specialized middleware for different endpoint types

3. **Rate Limit Configurations**
   - Predefined configurations for different endpoint categories
   - Pattern-based endpoint matching
   - Customizable limits and messages

## Rate Limit Categories

### 1. Voting Endpoints
- **Limit**: 10 requests per minute
- **Endpoints**: `/api/polls/*/vote`
- **Key Strategy**: IP + Poll ID for granular control
- **Purpose**: Prevent spam voting while allowing legitimate participation

### 2. Authentication Endpoints
- **Limit**: 5 requests per minute
- **Endpoints**: `/api/auth/signin`, `/api/auth/signout`
- **Key Strategy**: IP + Endpoint
- **Purpose**: Prevent brute force attacks

### 3. Registration Endpoint
- **Limit**: 3 requests per minute
- **Endpoints**: `/api/auth/register`
- **Key Strategy**: IP-based
- **Purpose**: Prevent spam account creation

### 4. Password Reset
- **Limit**: 3 requests per 15 minutes
- **Endpoints**: `/api/auth/reset-password`
- **Key Strategy**: IP-based
- **Purpose**: Prevent abuse of password reset functionality

### 5. Admin Endpoints
- **Limit**: 50 requests per minute
- **Endpoints**: `/api/admin/*`
- **Key Strategy**: IP + User ID
- **Purpose**: Moderate limits for administrative operations

### 6. Poll Creation
- **Limit**: 20 requests per minute
- **Endpoints**: `/api/polls` (POST)
- **Key Strategy**: User ID or IP
- **Purpose**: Prevent spam poll creation

### 7. Export Endpoints
- **Limit**: 5 requests per minute
- **Endpoints**: `/api/polls/*/export*`
- **Key Strategy**: User ID or IP
- **Purpose**: Limit resource-intensive export operations

### 8. Public Directory
- **Limit**: 60 requests per minute
- **Endpoints**: `/api/polls/public`
- **Key Strategy**: IP-based
- **Purpose**: Allow reasonable browsing while preventing scraping

### 9. Real-time Connections
- **Limit**: 200 requests per minute
- **Endpoints**: `/api/polls/*/events`
- **Key Strategy**: IP-based
- **Purpose**: Allow frequent reconnections for SSE

### 10. General API
- **Limit**: 100 requests per minute
- **Endpoints**: All other endpoints
- **Key Strategy**: IP-based
- **Purpose**: Default protection for unlisted endpoints

## Implementation Details

### Key Generation Strategies

1. **IP-based**: `ip:192.168.1.1`
   - Default strategy for anonymous endpoints
   - Uses first IP from x-forwarded-for header

2. **User-based**: `user:user123`
   - For authenticated endpoints
   - Provides per-user rate limiting

3. **Combined**: `ip:192.168.1.1:user:user123`
   - Combines IP and user for enhanced security
   - Prevents account sharing abuse

4. **Endpoint-specific**: `ip:192.168.1.1:endpoint:vote`
   - Adds endpoint context to the key
   - Allows different limits per endpoint type

5. **Poll-specific**: `ip:192.168.1.1:poll:poll123:vote`
   - For voting endpoints
   - Prevents concentrated attacks on single polls

### Rate Limit Headers

All responses include standard rate limiting headers:

- `X-RateLimit-Limit`: Maximum requests allowed in the window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when the window resets
- `Retry-After`: Seconds to wait before retrying (when rate limited)

### Error Responses

When rate limits are exceeded, the system returns:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many vote attempts. Please wait before voting again.",
  "retryAfter": 45
}
```

HTTP Status: `429 Too Many Requests`

## Usage Examples

### Applying Rate Limiting to API Routes

```typescript
// Basic rate limiting
export const POST = withRateLimit(handler, {
  maxRequests: 10,
  windowMs: 60000,
  message: "Custom rate limit message"
})

// Voting-specific rate limiting
export const POST = withVotingRateLimit(handler)

// Admin rate limiting
export const GET = combineWithRateLimit(
  withAdminRateLimit,
  withAdminAuth
)(handler)

// Registration rate limiting
export const POST = withRegistrationRateLimit(handler)
```

### Custom Rate Limiting

```typescript
// Custom configuration
export const POST = withRateLimit(handler, {
  maxRequests: 5,
  windowMs: 30000,
  keyGenerator: (req) => `custom:${req.headers.get('user-id')}`,
  message: "Custom rate limit exceeded"
})
```

## Configuration

### Endpoint Pattern Matching

The system uses pattern matching to determine rate limits:

```typescript
const EndpointRateLimits = {
  '/api/auth/register': RateLimitConfigs.registration,
  '/api/polls/*/vote': RateLimitConfigs.voting,
  '/api/admin/*': RateLimitConfigs.admin,
  '*': RateLimitConfigs.general // Default
}
```

### Environment-based Configuration

Rate limits can be adjusted based on environment:

```typescript
// Development: More lenient limits
// Production: Stricter limits
// Load testing: Very high limits
```

## Monitoring and Analytics

### Rate Limit Metrics

The system tracks:
- Request counts per endpoint
- Rate limit violations
- Top rate-limited IPs
- Endpoint-specific patterns

### Logging

Rate limit events are logged for monitoring:
- Successful requests with remaining quota
- Rate limit violations with client information
- Configuration changes
- System errors

## Production Considerations

### Redis Integration

For production deployment, replace the in-memory store with Redis:

```typescript
// Example Redis integration
class RedisRateLimitStore {
  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    // Redis INCR with TTL
  }
}
```

### Distributed Systems

For multi-instance deployments:
- Use Redis for shared rate limit state
- Consider sticky sessions for user-based limits
- Implement rate limit synchronization

### Performance Optimization

- Use Redis pipelining for bulk operations
- Implement rate limit caching
- Consider sliding window algorithms for smoother limits

## Security Features

### DDoS Protection

- IP-based rate limiting prevents basic DDoS attacks
- Exponential backoff for repeated violations
- Automatic IP blocking for severe abuse

### Brute Force Prevention

- Authentication endpoints have strict limits
- Progressive delays for failed attempts
- Account lockout integration

### Resource Protection

- Export endpoints have low limits to prevent resource exhaustion
- Real-time connections are monitored and limited
- Database query rate limiting

## Testing

### Unit Tests

Comprehensive test coverage includes:
- Rate limit enforcement
- Key generation strategies
- Configuration matching
- Error handling
- Header injection

### Integration Tests

- End-to-end API testing with rate limits
- Multi-user scenarios
- Time-based window testing
- Error response validation

### Load Testing

- High-volume request testing
- Rate limit effectiveness under load
- Performance impact measurement
- Memory usage monitoring

## Troubleshooting

### Common Issues

1. **Rate limits too strict**: Adjust configuration based on usage patterns
2. **False positives**: Review key generation strategy
3. **Memory leaks**: Ensure proper cleanup of expired entries
4. **Performance impact**: Consider Redis migration

### Debugging

- Enable detailed logging for rate limit events
- Monitor rate limit headers in responses
- Track rate limit store size and cleanup frequency
- Analyze rate limit violation patterns

## Future Enhancements

### Planned Features

1. **Dynamic Rate Limiting**: Adjust limits based on system load
2. **User Tier Limits**: Different limits for premium users
3. **Geographic Limits**: Region-based rate limiting
4. **Machine Learning**: Anomaly detection for abuse patterns
5. **Rate Limit Dashboard**: Real-time monitoring interface

### API Improvements

1. **Rate Limit Negotiation**: Allow clients to request rate limit info
2. **Burst Allowances**: Short-term higher limits for legitimate use
3. **Rate Limit Tokens**: Pre-paid request tokens for high-volume users
4. **Webhook Notifications**: Alert on rate limit violations

## Compliance and Legal

### Privacy Considerations

- IP addresses are used only for rate limiting
- No personal data is stored in rate limit records
- Automatic cleanup of expired data

### GDPR Compliance

- Rate limit data is not considered personal data
- No user consent required for abuse prevention
- Data retention limited to rate limit windows

## Conclusion

The rate limiting system provides comprehensive protection against abuse while maintaining good user experience. The flexible configuration system allows for fine-tuning based on specific needs, and the modular architecture supports easy extension and customization.

The system successfully implements Requirement 11.1: "THE Poll_System SHALL implement rate limiting to prevent abuse" with different limits for different endpoint types, proper error handling, and comprehensive monitoring capabilities.