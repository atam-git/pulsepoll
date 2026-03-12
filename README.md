# PulsePoll Platform

A comprehensive web-based polling and survey platform built with Next.js 14 App Router, MongoDB, and Tailwind CSS.

## Features

- Multi-type poll creation (single choice, multiple choice, ranking, yes/no, survey)
- Real-time results with live updates
- Comprehensive duplicate vote prevention
- Advanced analytics and data export
- Public poll discovery directory
- Administrative controls and moderation
- Responsive design with embed capabilities

## Tech Stack

- **Frontend/Backend**: Next.js 14 App Router (full-stack)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js (Auth.js)
- **Styling**: Tailwind CSS
- **Real-time**: Server-Sent Events (SSE)
- **Testing**: Jest + fast-check for property-based testing
- **Deployment**: Vercel

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.local` and update with your values:
- `MONGODB_URI`: Your MongoDB connection string
- `NEXTAUTH_SECRET`: A secure random string for NextAuth
- `NEXTAUTH_URL`: Your application URL

3. Run the development server:
```bash
npm run dev
```

4. Run tests:
```bash
npm test
npm run test:coverage
npm run test:property  # Property-based tests
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries and configurations
├── models/          # MongoDB/Mongoose models
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── __tests__/       # Test files
```

## Development

This project follows a spec-driven development approach with comprehensive requirements, design documentation, and property-based testing for correctness validation.

See the `.kiro/specs/pulsepoll-platform/` directory for detailed specifications and implementation tasks.