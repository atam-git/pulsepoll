# PulsePoll Platform - Deployment Guide

## Overview

This guide covers the deployment of the PulsePoll platform to Vercel with MongoDB Atlas. The platform is production-ready with comprehensive security, performance optimizations, and monitoring.

## Prerequisites

- Node.js 18+ installed locally
- Vercel CLI installed (`npm i -g vercel`)
- MongoDB Atlas account
- Vercel account
- Domain name (optional, for custom domain)

## Environment Variables

Create the following environment variables in your Vercel project:

### Required Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pulsepoll?retryWrites=true&w=majority

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
NEXTAUTH_URL=https://your-domain.vercel.app

# Security
CSRF_SECRET=another-secret-key-for-csrf-protection

# Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel-blob-token-here

# Email (Optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
```

### Optional Variables

```bash
# Analytics
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Performance
CACHE_TTL=300
MAX_POLL_OPTIONS=20
MAX_POLL_TITLE_LENGTH=200
```

## Database Setup

### 1. MongoDB Atlas Configuration

1. Create a MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. Whitelist Vercel's IP ranges (or use 0.0.0.0/0 for all IPs)
4. Get your connection string

### 2. Database Indexes

The platform automatically creates necessary indexes on startup. Key indexes include:

```javascript
// Users
{ email: 1 } // unique
{ createdAt: -1 }

// Polls
{ creatorId: 1, createdAt: -1 }
{ privacy: 1, status: 1, createdAt: -1 }
{ 'metadata.totalVotes': -1 }
{ tags: 1 }
{ category: 1 }

// Votes
{ pollId: 1, ipAddress: 1 }
{ pollId: 1, userId: 1 }
{ pollId: 1, sessionId: 1 }
{ createdAt: -1 }

// Sessions
{ sessionId: 1 } // unique
{ expiresAt: 1 }
```

## Deployment Steps

### 1. Prepare the Application

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the application
npm run build

# Verify build works locally
npm start
```

### 2. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
# ... add all other environment variables
```

### 3. Configure Domain (Optional)

```bash
# Add custom domain
vercel domains add yourdomain.com

# Update NEXTAUTH_URL environment variable
vercel env add NEXTAUTH_URL production https://yourdomain.com
```

## Post-Deployment Configuration

### 1. Database Initialization

The application will automatically:
- Create necessary indexes
- Set up initial admin user (if ADMIN_EMAIL is provided)
- Initialize system metrics collection

### 2. Security Configuration

Verify these security measures are active:

- ✅ HTTPS enforcement
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Input validation and sanitization
- ✅ Secure session configuration
- ✅ Admin access controls

### 3. Performance Monitoring

Monitor these metrics:

- Response times (should be < 500ms average)
- Memory usage
- Database query performance
- Rate limit hit rates
- Error rates

## Monitoring and Maintenance

### 1. Health Checks

The platform includes built-in health monitoring:

- `/api/health` - Basic health check
- Database connectivity monitoring
- Performance metrics collection

### 2. Logging

Key events are logged:

- Authentication events
- Security incidents
- Performance issues
- Admin actions
- System errors

### 3. Backup Strategy

Recommended backup approach:

- MongoDB Atlas automatic backups (enabled by default)
- Export critical polls and user data regularly
- Store backups in separate cloud storage

## Scaling Considerations

### Current Limits

- 50 polls per page in directory
- 20 options per poll maximum
- 100 requests per 15 minutes per IP (rate limiting)
- 10MB file upload limit

### Scaling Options

1. **Database Scaling**: Upgrade MongoDB Atlas cluster
2. **CDN**: Use Vercel's built-in CDN for static assets
3. **Caching**: Redis cache for frequently accessed data
4. **Load Balancing**: Vercel handles this automatically

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify MongoDB URI format
   - Check IP whitelist in Atlas
   - Ensure database user has correct permissions

2. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches deployment URL
   - Ensure cookies are working (check browser settings)

3. **Rate Limiting Too Aggressive**
   - Adjust RATE_LIMIT_MAX_REQUESTS
   - Increase RATE_LIMIT_WINDOW_MS
   - Check for bot traffic

4. **Performance Issues**
   - Monitor database query performance
   - Check memory usage in Vercel dashboard
   - Verify indexes are being used

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=pulsepoll:*
```

## Security Checklist

Before going live, verify:

- [ ] All environment variables are set in production
- [ ] HTTPS is enforced
- [ ] Admin accounts use strong passwords
- [ ] Rate limiting is configured appropriately
- [ ] Input validation is working
- [ ] Error messages don't expose sensitive information
- [ ] Database access is restricted
- [ ] File uploads are validated and secured
- [ ] Session security is configured properly

## Performance Checklist

- [ ] Database indexes are created
- [ ] Images are optimized
- [ ] Caching headers are set
- [ ] Bundle size is optimized
- [ ] API responses are fast (< 500ms)
- [ ] Real-time updates work correctly
- [ ] Memory usage is stable

## Support and Maintenance

### Regular Tasks

1. **Weekly**:
   - Review error logs
   - Check performance metrics
   - Monitor user activity

2. **Monthly**:
   - Update dependencies
   - Review security logs
   - Backup critical data

3. **Quarterly**:
   - Security audit
   - Performance optimization
   - Feature usage analysis

### Emergency Procedures

1. **High Error Rate**:
   - Check Vercel function logs
   - Verify database connectivity
   - Review recent deployments

2. **Performance Degradation**:
   - Check database performance
   - Monitor memory usage
   - Review slow queries

3. **Security Incident**:
   - Review security logs
   - Check for unusual patterns
   - Update security measures if needed

## Contact and Support

For deployment issues or questions:

1. Check Vercel deployment logs
2. Review MongoDB Atlas metrics
3. Consult this deployment guide
4. Check the application's built-in monitoring

The PulsePoll platform is designed to be self-monitoring and self-healing where possible, with comprehensive logging and error handling to facilitate troubleshooting.