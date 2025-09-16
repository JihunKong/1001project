# Text Submission API Documentation

The unified text submission API provides endpoints for creating, managing, and reviewing text-based story submissions across all user roles (LEARNER, TEACHER, VOLUNTEER).

## Endpoints Overview

### 1. Main Text Submissions API
- **POST /api/submissions/text** - Create new text submission
- **GET /api/submissions/text** - List text submissions

### 2. Individual Submission Management
- **GET /api/submissions/text/[id]** - Get specific submission details
- **PUT /api/submissions/text/[id]** - Update specific submission
- **DELETE /api/submissions/text/[id]** - Delete specific submission

### 3. Submit for Review
- **POST /api/submissions/text/[id]/submit** - Submit for review
- **GET /api/submissions/text/[id]/submit** - Check submission readiness

### 4. Draft Management
- **POST /api/submissions/text/draft** - Save or update draft
- **GET /api/submissions/text/draft** - List user's drafts

---

## Detailed Endpoints

### POST /api/submissions/text
Create a new text submission.

**Authentication:** Required  
**Allowed Roles:** LEARNER, TEACHER, VOLUNTEER

**Request Body:**
```json
{
  "title": "string (required, max 200 chars)",
  "contentMd": "string (required, min 10 chars, max 100,000 chars)",
  "chaptersJson": "string (optional)",
  "source": "individual | classroom (optional, default: individual)",
  "classId": "string (required if source=classroom)",
  "language": "string (optional, default: en)",
  "ageRange": "string (optional, max 20 chars)",
  "category": ["string"] (optional, array of strings max 50 chars each)",
  "tags": ["string"] (optional, array of strings max 30 chars each)",
  "summary": "string (optional, max 1000 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "submission": {
    "id": "string",
    "title": "string",
    "status": "DRAFT",
    "source": "string",
    "language": "string",
    "ageRange": "string",
    "category": ["string"],
    "tags": ["string"],
    "summary": "string",
    "revisionNo": 0,
    "createdAt": "ISO string",
    "updatedAt": "ISO string",
    "author": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "UserRole"
    },
    "class": {
      "id": "string",
      "name": "string"
    }
  }
}
```

**Special Rules:**
- Only TEACHERs can create classroom submissions
- Classroom submissions require a valid classId
- Teacher must own the specified class

---

### GET /api/submissions/text
List text submissions based on user role and permissions.

**Authentication:** Required  
**Query Parameters:**
- `status` - Filter by PublishingWorkflowStatus (optional)
- `source` - Filter by "individual" or "classroom" (optional)
- `page` - Page number (default: 1)
- `limit` - Results per page (max 100, default: 20)
- `authorId` - Filter by author ID (managers/admins only)

**Role-based Access:**
- **LEARNER/VOLUNTEER:** Only own submissions
- **TEACHER:** Own submissions + classroom submissions from their classes
- **STORY_MANAGER/BOOK_MANAGER/CONTENT_ADMIN/ADMIN:** All submissions

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "string",
      "title": "string",
      "status": "PublishingWorkflowStatus",
      "source": "string",
      "language": "string",
      "ageRange": "string",
      "category": ["string"],
      "tags": ["string"],
      "summary": "string",
      "revisionNo": 0,
      "createdAt": "ISO string",
      "updatedAt": "ISO string",
      "author": {},
      "class": {},
      "lastTransition": {
        "id": "string",
        "fromStatus": "string",
        "toStatus": "string",
        "reason": "string",
        "createdAt": "ISO string",
        "performedBy": {}
      },
      "transitionCount": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### GET /api/submissions/text/[id]
Get detailed information about a specific text submission.

**Authentication:** Required  
**Access Control:** Authors, classroom teachers, and managers can access

**Response:**
```json
{
  "success": true,
  "submission": {
    "id": "string",
    "title": "string",
    "contentMd": "string",
    "chaptersJson": "string",
    "source": "string",
    "status": "PublishingWorkflowStatus",
    "language": "string",
    "ageRange": "string",
    "category": ["string"],
    "tags": ["string"],
    "summary": "string",
    "revisionNo": 0,
    "reviewNotes": "string",
    "lastReviewedAt": "ISO string",
    "createdAt": "ISO string",
    "updatedAt": "ISO string",
    "author": {},
    "class": {},
    "transitions": [
      {
        "id": "string",
        "fromStatus": "string",
        "toStatus": "string",
        "reason": "string",
        "createdAt": "ISO string",
        "performedBy": {}
      }
    ],
    "transitionCount": 0
  }
}
```

---

### PUT /api/submissions/text/[id]
Update a specific text submission.

**Authentication:** Required  
**Access Control:** Authors, classroom teachers, and managers can update  
**Status Restrictions:** Only DRAFT and NEEDS_REVISION submissions can be edited

**Request Body:** (All fields optional)
```json
{
  "title": "string",
  "contentMd": "string",
  "chaptersJson": "string",
  "language": "string",
  "ageRange": "string",
  "category": ["string"],
  "tags": ["string"],
  "summary": "string"
}
```

**Special Behavior:**
- Content changes increment revision number
- Content changes reset review notes and lastReviewedAt
- Creates workflow transition for significant updates

---

### DELETE /api/submissions/text/[id]
Delete a specific text submission.

**Authentication:** Required  
**Access Control:** Authors, classroom teachers, and managers can delete  
**Restrictions:** Cannot delete PUBLISHED submissions

**Response:**
```json
{
  "success": true,
  "message": "Text submission deleted successfully"
}
```

---

### POST /api/submissions/text/[id]/submit
Submit a text submission for review.

**Authentication:** Required  
**Access Control:** Authors, classroom teachers, and managers can submit  
**Status Requirements:** Only DRAFT and NEEDS_REVISION submissions can be submitted

**Request Body:**
```json
{
  "message": "string (optional, max 1000 chars)",
  "requestedReviewers": ["string"] (optional, max 5 reviewer IDs)
}
```

**Validation:**
- Title must not be empty
- Content must be at least 10 characters
- Status must be DRAFT or NEEDS_REVISION

**Response:**
```json
{
  "success": true,
  "submission": {
    "id": "string",
    "title": "string",
    "status": "PENDING",
    "source": "string",
    "revisionNo": 0,
    "updatedAt": "ISO string",
    "author": {},
    "class": {}
  },
  "notifications": {
    "sent": true,
    "count": 3,
    "error": null
  },
  "message": "Text submission successfully submitted for review"
}
```

**Side Effects:**
- Status changes to PENDING
- Clears previous review notes
- Creates workflow transition
- Sends notifications to story managers

---

### GET /api/submissions/text/[id]/submit
Check if a submission can be submitted for review.

**Authentication:** Required  
**Access Control:** Authors, classroom teachers, and managers can check

**Response:**
```json
{
  "success": true,
  "canSubmit": true,
  "status": "DRAFT",
  "validationErrors": [],
  "statusMessage": "Ready to submit for review"
}
```

---

### POST /api/submissions/text/draft
Save or update a draft submission.

**Authentication:** Required  
**Allowed Roles:** LEARNER, TEACHER, VOLUNTEER

**Request Body:**
```json
{
  "id": "string (optional - if provided, updates existing draft)",
  "title": "string (required)",
  "contentMd": "string (required, min 1 char)",
  "chaptersJson": "string (optional)",
  "source": "individual | classroom (optional)",
  "classId": "string (optional, required if source=classroom)",
  "language": "string (optional, default: en)",
  "ageRange": "string (optional)",
  "category": ["string"] (optional)",
  "tags": ["string"] (optional)",
  "summary": "string (optional)",
  "autoSave": "boolean (optional, default: false)"
}
```

**Special Behavior:**
- If `id` provided: updates existing draft
- If no `id`: creates new draft
- Auto-save operations don't create workflow transitions
- Only drafts with DRAFT status can be updated

**Response:**
```json
{
  "success": true,
  "draft": {
    "id": "string",
    "title": "string",
    "status": "DRAFT",
    "source": "string",
    "language": "string",
    "ageRange": "string",
    "category": ["string"],
    "tags": ["string"],
    "summary": "string",
    "revisionNo": 0,
    "createdAt": "ISO string",
    "updatedAt": "ISO string",
    "author": {},
    "class": {}
  },
  "message": "Draft saved successfully"
}
```

---

### GET /api/submissions/text/draft
List user's draft submissions.

**Authentication:** Required  
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (max 50, default: 20)
- `source` - Filter by "individual" or "classroom" (optional)

**Role-based Access:**
- **LEARNER/VOLUNTEER:** Only own drafts
- **TEACHER:** Own drafts + classroom drafts from their classes
- **Managers/Admins:** All drafts (less common use case)

**Response:**
```json
{
  "success": true,
  "drafts": [
    {
      "id": "string",
      "title": "string",
      "source": "string",
      "language": "string",
      "ageRange": "string",
      "category": ["string"],
      "tags": ["string"],
      "summary": "string",
      "wordCount": 1234,
      "createdAt": "ISO string",
      "updatedAt": "ISO string",
      "author": {},
      "class": {}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": {} // Additional error details (for validation errors)
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error (server-side errors)

---

## Workflow States

**PublishingWorkflowStatus Values:**
- `DRAFT` - Initial state, being written
- `PENDING` - Submitted for review
- `NEEDS_REVISION` - Rejected, needs changes
- `APPROVED` - Approved but not published
- `PUBLISHED` - Live in library
- `ARCHIVED` - Removed from active workflow

**State Transitions:**
- `DRAFT` → `PENDING` (via submit for review)
- `PENDING` → `NEEDS_REVISION` (reviewer rejects)
- `PENDING` → `APPROVED` (reviewer approves)
- `NEEDS_REVISION` → `PENDING` (resubmit after changes)
- `APPROVED` → `PUBLISHED` (final publication)
- Any state → `ARCHIVED` (admin action)

---

## Role-Based Permissions Summary

| Action | LEARNER | TEACHER | VOLUNTEER | STORY_MANAGER+ |
|--------|---------|---------|-----------|----------------|
| Create individual submissions | ✅ | ✅ | ✅ | ✅ |
| Create classroom submissions | ❌ | ✅ | ❌ | ✅ |
| View own submissions | ✅ | ✅ | ✅ | ✅ |
| View classroom submissions | ❌ | ✅ (own classes) | ❌ | ✅ |
| View all submissions | ❌ | ❌ | ❌ | ✅ |
| Edit submissions | ✅ (own) | ✅ (own + classroom) | ✅ (own) | ✅ (all) |
| Delete submissions | ✅ (own, non-published) | ✅ (own + classroom, non-published) | ✅ (own, non-published) | ✅ (all) |
| Submit for review | ✅ (own) | ✅ (own + classroom) | ✅ (own) | ✅ (all) |
| Save drafts | ✅ | ✅ | ✅ | ✅ |

---

## Integration Notes

### Frontend Integration
The API uses standard HTTP methods and JSON payloads. All responses include a `success` boolean field for easy status checking.

### Authentication
All endpoints require valid NextAuth session. Authentication is handled via session cookies.

### Rate Limiting
Consider implementing rate limiting for draft save operations to prevent abuse of auto-save functionality.

### File Uploads
This API handles text content only. For file uploads (images, PDFs), use separate upload endpoints and reference uploaded files in the `chaptersJson` or `contentMd` fields.

### Notification System
The submit endpoint includes a notification system that alerts story managers of new submissions. This can be extended to support email notifications, webhooks, or in-app notifications.