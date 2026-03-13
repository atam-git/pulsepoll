# Task 14.4: User Management Functionality Implementation

## Overview
Implemented comprehensive user management functionality for the admin panel, including user suspension, banning, and activity monitoring capabilities.

## Changes Made

### 1. User Model Enhancements (`src/models/User.ts`)

#### New Fields Added:
- **Status Management:**
  - `status`: Enum field ('active' | 'suspended' | 'banned')
  - `suspendedUntil`: Date when suspension expires
  - `suspensionReason`: Reason for suspension (max 500 chars)
  - `bannedAt`: Date when user was banned
  - `banReason`: Reason for ban (max 500 chars)

- **Activity Tracking:**
  - `activityLog.lastActive`: Last activity timestamp
  - `activityLog.pollsCreated`: Count of polls created
  - `activityLog.votesSubmitted`: Count of votes submitted
  - `activityLog.loginCount`: Count of login attempts

#### New Methods:
- `isSuspended()`: Check if user is currently suspended (auto-unsuspends if expired)
- `isBanned()`: Check if user is banned
- `canLogin()`: Check if user can login (not suspended or banned)
- `suspend(until, reason)`: Suspend user until specified date
- `ban(reason)`: Permanently ban user
- `unsuspend()`: Remove suspension
- `unban()`: Remove ban
- `recordActivity(type)`: Record user activity (login, poll_created, vote_submitted)

#### New Indexes:
- `status`: For filtering by user status
- `activityLog.lastActive`: For sorting by activity

### 2. Admin API Enhancements (`src/app/api/admin/users/route.ts`)

#### GET /api/admin/users
- Added `status` query parameter for filtering by user status
- Returns additional fields: status, suspension/ban details, activity log

#### PUT /api/admin/users
- Added support for suspension/banning actions:
  - `action: 'suspend'` - Suspend user with reason and expiration
  - `action: 'ban'` - Ban user with reason
  - `action: 'unsuspend'` - Remove suspension
  - `action: 'unban'` - Remove ban
- Maintains backward compatibility with role/emailVerified updates

### 3. Admin Users Page UI (`src/app/admin/users/page.tsx`)

#### New Features:
- **Status Filter:** Dropdown to filter by Active/Suspended/Banned
- **Activity Display:** Shows polls created, votes submitted, login count, and last active date
- **Status Column:** Displays user status with color-coded badges
  - Green for Active
  - Yellow for Suspended (with expiration date and reason)
  - Red for Banned (with reason)
- **Action Buttons:**
  - Suspend: Opens modal to set expiration date and reason
  - Ban: Opens modal to enter ban reason
  - Unsuspend: Quick action to remove suspension
  - Unban: Quick action to remove ban

#### New Modals:
- **Suspend User Modal:**
  - Date/time picker for suspension expiration
  - Text area for suspension reason (optional, max 500 chars)
- **Ban User Modal:**
  - Text area for ban reason (optional, max 500 chars)

### 4. Authentication Service Updates (`src/services/auth.ts`)

#### Login Enhancement:
- Added checks for suspended/banned users before allowing login
- Returns descriptive error messages:
  - For suspended users: Shows suspension expiration date and reason
  - For banned users: Shows ban reason
- Auto-unsuspends users if suspension has expired

### 5. Tests (`src/__tests__/api/admin-user-management.test.ts`)

#### Test Coverage:
- User status management (active, suspended, banned)
- Activity tracking initialization and updates
- Suspension management (suspend, unsuspend, auto-unsuspend)
- Ban management (ban, unban)
- Login prevention for suspended/banned users
- Admin queries with status filtering and pagination

**Test Results:** 16 tests passing

## Requirements Validated

### Requirement 9.3: User Management Functionality
✅ Admin panel provides user management capabilities
✅ User listing with search and filtering
✅ User status management (active, suspended, banned)

### Requirement 9.4: User Suspension and Banning
✅ Suspend users with expiration date and reason
✅ Ban users permanently with reason
✅ Unsuspend and unban functionality
✅ Prevent suspended/banned users from logging in
✅ Display suspension/ban details in admin panel

### Additional Features:
✅ Activity monitoring (polls created, votes submitted, login count)
✅ Last active timestamp tracking
✅ Auto-unsuspension when suspension expires
✅ Descriptive error messages for suspended/banned login attempts

## Database Schema Changes

New fields added to User collection:
```javascript
{
  status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  suspendedUntil: Date,
  suspensionReason: String,
  bannedAt: Date,
  banReason: String,
  activityLog: {
    lastActive: Date,
    pollsCreated: { type: Number, default: 0 },
    votesSubmitted: { type: Number, default: 0 },
    loginCount: { type: Number, default: 0 }
  }
}
```

New indexes:
- `status: 1`
- `activityLog.lastActive: -1`

## API Changes

### GET /api/admin/users
**New Query Parameters:**
- `status`: Filter by 'active', 'suspended', or 'banned'

**New Response Fields:**
```typescript
{
  status: string
  suspendedUntil?: string
  suspensionReason?: string
  bannedAt?: string
  banReason?: string
  activityLog: {
    lastActive?: string
    pollsCreated: number
    votesSubmitted: number
    loginCount: number
  }
  lastLoginAt?: string
}
```

### PUT /api/admin/users
**New Request Body Options:**
```typescript
{
  userId: string
  action?: 'suspend' | 'ban' | 'unsuspend' | 'unban'
  suspendedUntil?: string  // Required for 'suspend' action
  reason?: string          // Optional for 'suspend' and 'ban' actions
}
```

## Usage Examples

### Suspend a User
```typescript
await fetch('/api/admin/users', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    action: 'suspend',
    suspendedUntil: '2024-12-31T23:59:59',
    reason: 'Violation of terms of service'
  })
})
```

### Ban a User
```typescript
await fetch('/api/admin/users', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    action: 'ban',
    reason: 'Severe violation of community guidelines'
  })
})
```

### Check User Status in Code
```typescript
const user = await User.findById(userId)

if (!user.canLogin()) {
  if (user.isBanned()) {
    throw new Error(`Account banned: ${user.banReason}`)
  }
  if (user.isSuspended()) {
    throw new Error(`Account suspended until ${user.suspendedUntil}`)
  }
}
```

## Future Enhancements

Potential improvements for future iterations:
1. Email notifications for suspension/ban actions
2. Appeal system for suspended/banned users
3. Automated suspension based on activity patterns
4. Suspension/ban history tracking
5. Bulk suspension/ban operations
6. More granular activity tracking (specific poll/vote details)
7. Activity-based user scoring system

## Notes

- All existing functionality remains intact and backward compatible
- Suspended users are automatically unsuspended when their suspension expires
- Activity tracking is updated automatically through existing user methods
- The UI is fully responsive and works on mobile devices
- All changes follow the existing code style and patterns
