# PulsePoll Platform

A comprehensive polling platform built with Next.js 14, MongoDB, and TypeScript. Features real-time updates, advanced analytics, admin panel, and enterprise-grade security.

## 🚀 Features

### Core Functionality
- **Multiple Poll Types**: Single choice, multiple choice, ranking, yes/no, and survey polls
- **Real-time Updates**: Live vote counting with Server-Sent Events
- **Advanced Analytics**: Comprehensive charts, demographics, and engagement metrics
- **Public Directory**: Discover and browse public polls with advanced filtering
- **Data Export**: CSV, Excel, and JSON export with customizable options

### User Experience
- **Anonymous & Authenticated Voting**: Support for both user types
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Poll Sharing**: Social media integration, QR codes, and embeddable widgets
- **User Dashboard**: Manage polls, view analytics, and track performance

### Security & Performance
- **Enterprise Security**: Rate limiting, CSRF protection, input validation, XSS prevention
- **Duplicate Prevention**: IP, session, user, and fingerprint-based protection
- **Performance Optimized**: Database indexing, caching, and efficient queries
- **Admin Panel**: User management, poll moderation, and system analytics

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with custom providers
- **Real-time**: Server-Sent Events (SSE)
- **Charts**: Chart.js with React integration
- **Testing**: Jest, Property-based testing with fast-check
- **Deployment**: Vercel with MongoDB Atlas

## 📋 Requirements

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd pulsepoll
npm install
```

### 2. Environment Setup

Create `.env.local`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/pulsepoll

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Security
CSRF_SECRET=your-csrf-secret

# Optional: Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### 3. Database Setup

```bash
# Start MongoDB locally or use MongoDB Atlas
# The app will automatically create indexes on startup
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Categories

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: End-to-end workflow testing
- **Property Tests**: Property-based testing for correctness validation
- **Performance Tests**: Load testing and performance validation
- **Security Tests**: Vulnerability assessment and security validation

### Property-Based Testing

The platform includes comprehensive property-based tests using fast-check:

```bash
# Run property tests specifically
npm test -- --testPathPattern=properties
```

## 📊 API Documentation

### Core Endpoints

#### Polls
- `GET /api/polls/public` - List public polls with filtering
- `POST /api/polls` - Create new poll (authenticated)
- `GET /api/polls/[id]` - Get poll details
- `PUT /api/polls/[id]` - Update poll (owner only)
- `DELETE /api/polls/[id]` - Delete poll (owner only)

#### Voting
- `POST /api/polls/[id]/vote` - Submit vote
- `GET /api/polls/[id]/analytics` - Get poll analytics
- `GET /api/polls/[id]/events` - Real-time updates (SSE)

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset

#### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/polls` - Poll moderation
- `GET /api/admin/users` - User management

### Query Parameters

#### Public Polls (`/api/polls/public`)
- `search` - Text search in title/description
- `category` - Filter by category
- `tags` - Filter by tags (comma-separated)
- `type` - Poll type filter
- `sortBy` - Sort order (newest, popular, trending, etc.)
- `page` - Page number
- `limit` - Results per page (max 50)

## 🏗️ Architecture

### Directory Structure

```
pulsepoll/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin panel pages
│   │   ├── auth/           # Authentication pages
│   │   └── poll/           # Poll pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── middleware/         # Custom middleware
│   ├── models/             # MongoDB models
│   └── services/           # Business logic services
├── __tests__/              # Test files
└── public/                 # Static assets
```

### Key Services

- **AuthService**: User authentication and session management
- **PollService**: Poll CRUD operations and validation
- **VotingService**: Vote processing and duplicate prevention
- **AnalyticsEngine**: Real-time analytics calculation
- **ExportService**: Data export in multiple formats
- **RealTimeEngine**: Server-Sent Events management

## 🔒 Security Features

### Input Validation
- Comprehensive input sanitization
- XSS prevention
- SQL/NoSQL injection protection
- File upload validation

### Authentication & Authorization
- Secure session management
- Role-based access control
- CSRF protection
- Rate limiting

### Data Protection
- Password hashing with bcrypt
- Secure cookie configuration
- Data encryption in transit
- Privacy controls

## 📈 Performance Features

### Database Optimization
- Strategic indexing for common queries
- Connection pooling
- Query optimization
- Aggregation pipelines for complex analytics

### Caching Strategy
- In-memory caching for frequently accessed data
- Browser caching for static assets
- API response caching

### Real-time Updates
- Efficient Server-Sent Events
- Connection management
- Automatic reconnection

## 🚀 Deployment

### Vercel Deployment

1. **Prepare Environment Variables**:
   ```bash
   MONGODB_URI=mongodb+srv://...
   NEXTAUTH_SECRET=production-secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Configure Domain** (optional):
   ```bash
   vercel domains add yourdomain.com
   ```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_SECRET` | Authentication secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `CSRF_SECRET` | CSRF protection secret | Yes |
| `ADMIN_EMAIL` | Default admin email | No |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit threshold | No |
| `SMTP_*` | Email configuration | No |

### Customization

The platform supports extensive customization:

- **Themes**: Modify Tailwind CSS configuration
- **Poll Types**: Add new poll types in the poll service
- **Analytics**: Extend analytics calculations
- **Export Formats**: Add new export formats
- **Authentication**: Add OAuth providers

## 📝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run the test suite
5. Submit a pull request

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing
- Property-based testing for critical functions

### Testing Requirements

- Unit tests for all services
- Integration tests for API endpoints
- Property tests for business logic
- Security tests for vulnerabilities

## 📊 Monitoring

### Built-in Monitoring

- Performance metrics collection
- Error tracking and logging
- Security event monitoring
- User activity analytics

### Health Checks

- Database connectivity
- API response times
- Memory usage
- Error rates

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Check MongoDB URI and network access
2. **Authentication**: Verify NEXTAUTH_SECRET and URL configuration
3. **Rate Limiting**: Adjust limits for your use case
4. **Performance**: Monitor database queries and indexes

### Debug Mode

Enable detailed logging:

```bash
NODE_ENV=development
DEBUG=pulsepoll:*
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

- Documentation: Check the `/docs` directory
- Issues: Use GitHub Issues for bug reports
- Discussions: Use GitHub Discussions for questions

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced poll templates
- [ ] Integration with external services
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Webhook support for integrations

---

Built with ❤️ using Next.js, MongoDB, and TypeScript.