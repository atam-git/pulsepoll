# Poll Moderation Implementation

## Overview
This document describes the poll moderation features implemented for the PulsePoll admin panel (Task 14.2).

## Features Implemented

### 1. Poll Flagging System
- **Flag Reasons**: Polls can be flagged with specific reasons:
  - Inappropriate Content
  - Spam
  - Offensive
  - Misleading
  - Other
- **Multiple Flags**: A single poll can receive multiple flags from different admins
- **Flag Details**: Each flag includes:
  - Reason (required)
  - Description (optional)
  - Flagged by (admin user ID)
  - Flagged at (timestamp)

### 2. Moderation Queue/Review Interface
- **Flagged Filter**: Filter polls to show only flagged or non-flagged polls
- **Visual Indicators**: Flagged polls are highlighted with red background
- **Flag Count Display**: Shows number of flags and primary flag reason
- **Review Tracking**: Records who reviewed the poll and when

### 3. Moderation Actions
- **Flag**: Mark a poll as inappropriate with a reason
- **Approve**: Clear flags and mark poll as reviewed
- **Reject**: Flag poll and close it (prevents further voting)
- **Unflag**: Remove all flags from a poll

### 4. Bulk Operations
Admins can select multiple polls and perform bulk actions:
- **Bulk Flag**: Flag multiple polls at once with the same reason
- **Bulk Unflag**: Clear flags from multiple polls
- **Bulk Status Change**: Change status (active/closed/draft) for multiple polls
- **Bulk Delete**: Delete multiple polls at once

### 5. Enhanced Admin Polls Page
- **Checkboxes**: Select individual polls or all polls
- **Bulk Action Bar**: Appears when polls are selected
- **Flag Column**: Shows flag status and count
- **Action Buttons**: Context-aware actions based on poll state
- **Moderation Dialogs**: Modal dialogs for flagging and bulk actions

## Database Schema Changes

### Poll Model Updates
Added `moderation` field to Poll schema:

```typescript
moderation: {
  isFlagged: boolean           // Whether poll is currently flagged
  flags: [{
    reason: string             // Flag reason (enum)
    description?: string       // Optional details
    flaggedBy: ObjectId        // Admin who flagged
    flaggedAt: Date           // When flagged
  }]
  reviewedBy?: ObjectId        // Admin who reviewed
  reviewedAt?: Date           // When reviewed
  reviewNotes?: string        // Review notes
}
```

### Database Indexes
Added indexes for efficient moderation queries:
- `moderation.isFlagged` + `createdAt` - For moderation queue
- `moderation.reviewedAt` - For reviewed polls

## API Endpoints

### GET /api/admin/polls
Enhanced with new query parameters:
- `flagged=true|false` - Filter by flag status

Response includes moderation data:
```json
{
  "moderation": {
    "isFlagged": true,
    "flagCount": 2,
    "flags": [...],
    "reviewedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/admin/polls
New actions supported:
- `action=flag` - Flag a single poll
- `action=unflag` - Unflag a single poll
- `action=approve` - Approve a poll (unflag + review)
- `action=reject` - Reject a poll (flag + close)
- `action=bulkFlag` - Flag multiple polls
- `action=bulkUnflag` - Unflag multiple polls
- `action=bulkStatusChange` - Change status for multiple polls
- `action=bulkDelete` - Delete multiple polls

### DELETE /api/admin/polls
Enhanced to support bulk deletion:
- `pollIds=id1,id2,id3` - Delete multiple polls

## UI Components

### Filters Section
- Search by title
- Filter by status (draft/active/expired/closed)
- Filter by flag status (all/flagged/not flagged)

### Bulk Actions Bar
Appears when polls are selected, showing:
- Number of selected polls
- "Bulk Actions" button to open dialog

### Poll Table
Enhanced with:
- Checkbox column for selection
- Flags column showing flag count and reason
- Context-aware action buttons
- Visual highlighting for flagged polls

### Moderation Dialogs

#### Flag Dialog
- Select flag reason (dropdown)
- Enter optional description (textarea)
- Cancel/Flag buttons

#### Bulk Actions Dialog
- Select bulk action (dropdown)
- Conditional fields based on action:
  - Flag reason + description (for bulk flag)
  - Review notes (for bulk unflag)
- Cancel/Apply buttons

## Requirements Validation

This implementation satisfies:
- **Requirement 9.1**: Poll moderation capabilities ✓
- **Requirement 9.2**: Poll removal functionality ✓
- **Requirement 9.8**: Bulk operations for poll management ✓

## Testing

Created comprehensive unit tests covering:
- Poll moderation schema structure
- Flagging/unflagging operations
- Multiple flags on same poll
- Approve/reject actions
- Bulk operations (flag, unflag, status change, delete)
- Moderation queries and filters
- API request validation

All 17 tests pass successfully.

## Usage Examples

### Flag a Single Poll
1. Navigate to Admin > Polls
2. Find the poll to flag
3. Click "Flag" button
4. Select reason and add description
5. Click "Flag Poll"

### Bulk Flag Multiple Polls
1. Select polls using checkboxes
2. Click "Bulk Actions"
3. Select "Flag Polls" action
4. Choose flag reason
5. Click "Apply"

### Review Flagged Polls
1. Filter by "Flagged Only"
2. Review each flagged poll
3. Click "Approve" to clear flags
4. Or click "Reject" to close the poll

### Bulk Operations
1. Select multiple polls
2. Click "Bulk Actions"
3. Choose action:
   - Set Status: Active/Closed/Draft
   - Flag Polls
   - Unflag Polls
   - Delete Polls
4. Click "Apply"

## Future Enhancements

Potential improvements for future iterations:
- Email notifications to poll creators when flagged
- Moderation history/audit log
- Flag appeal system
- Auto-moderation based on user reports
- Moderation dashboard with statistics
- Export moderation reports
