# 📡 API Documentation

## Base URL

```
Production: https://api.metrobank-scholarship.com
Development: http://localhost:5000
```

## Authentication

All API endpoints require authentication via JWT tokens, except for login and public endpoints.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 🔐 Authentication Endpoints

### POST /api/auth/login

User login endpoint.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "role_id": 3,
    "role_name": "Registrar"
  }
}
```

### POST /api/auth/logout

User logout endpoint.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/profile

Get current user profile.

**Response:**

```json
{
  "user_id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role_id": 3,
  "role_name": "Registrar",
  "campus": "Main Campus"
}
```

## 📚 Renewal Management Endpoints

### GET /api/renewal/fetch-renewals

Get all scholarship renewals with filtering options.

**Query Parameters:**

- `school_year` (string) - School year filter
- `semester` (string) - Semester filter
- `user_id` (number) - User ID filter
- `role_id` (number) - Role ID filter

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "renewal_id": 1,
      "student_id": "2023-001",
      "scholar_name": "John Doe",
      "scholarship_status": "Passed",
      "gpa": 1.5,
      "campus": "Main Campus",
      "year_level": "2nd Year",
      "is_validated": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/renewal/generate-renewal

Create new scholarship renewal batch.

**Request Body:**

```json
{
  "school_year": "2024-2025",
  "year_level": 2,
  "semester": 1,
  "user_id": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Renewal batch created successfully",
  "renewal_count": 150
}
```

### PUT /api/renewal/update-renewalV2

Update scholarship renewal records in batch.

**Request Body:**

```json
[
  {
    "renewal_id": 1,
    "changedFields": {
      "gpa": 1.8,
      "gpa_validation_stat": "Passed",
      "is_validated": true
    }
  }
]
```

**Response:**

```json
{
  "success": true,
  "message": "Renewals updated successfully",
  "updated_count": 1
}
```

### GET /api/renewal/count-renewal

Get renewal statistics.

**Query Parameters:**

- `school_year` (string) - School year
- `semester` (string) - Semester

**Response:**

```json
{
  "success": true,
  "data": {
    "total_renewals": 500,
    "passed": 350,
    "delisted": 50,
    "not_started": 100,
    "validated": 300
  }
}
```

### GET /api/renewal/audit-log

Get audit log for renewal changes.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "log_id": 1,
      "renewal_id": 1,
      "action": "UPDATE",
      "field": "gpa",
      "old_value": "1.5",
      "new_value": "1.8",
      "user_id": 1,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## 📄 Document Processing Endpoints

### POST /api/document/upload

Upload document for processing.

**Request:** Multipart form data

- `file` (File) - PDF or ZIP file
- `renewal_id` (number) - Associated renewal ID

**Response:**

```json
{
  "success": true,
  "jobId": "job_12345",
  "message": "Document uploaded successfully"
}
```

### POST /api/document/extract-grades

Extract grade data from uploaded document.

**Request:** Multipart form data

- `file` (File) - PDF file

**Response:**

```json
{
  "success": true,
  "jobId": "job_67890",
  "message": "Grade extraction started"
}
```

### GET /api/jobs/{jobId}

Check job processing status.

**Response:**

```json
{
  "status": "completed",
  "progress": 100,
  "result": {
    "student_id": "2023-001",
    "scholar_name": "John Doe",
    "gpa": 1.5,
    "grades": [
      {
        "course_code": "MATH101",
        "final_grade": 1.5
      }
    ]
  }
}
```

## 🔄 Workflow Management Endpoints

### GET /api/workflow/list

Get all workflow requests.

**Query Parameters:**

- `page` (number) - Page number
- `limit` (number) - Items per page
- `status` (string) - Filter by status

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "workflow_id": 1,
      "requester_id": 1,
      "title": "Scholarship Renewal Request",
      "status": "In Progress",
      "created_at": "2024-01-15T10:30:00Z",
      "approvers": [
        {
          "approver_id": 2,
          "name": "Jane Smith",
          "status": "Pending"
        }
      ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50
  }
}
```

### POST /api/workflow/create

Create new workflow request.

**Request Body:**

```json
{
  "title": "Scholarship Renewal Request",
  "description": "Request for scholarship renewal",
  "approvers": [2, 3, 4],
  "due_date": "2024-02-15",
  "file": "document.pdf"
}
```

**Response:**

```json
{
  "success": true,
  "workflow_id": 1,
  "message": "Workflow created successfully"
}
```

### PUT /api/workflow/approve

Approve or reject workflow request.

**Request Body:**

```json
{
  "workflow_id": 1,
  "action": "approve",
  "comments": "Approved by Registrar"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Workflow approved successfully"
}
```

## 💰 Disbursement Endpoints

### GET /api/disbursement/schedules

Get disbursement schedules.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "schedule_id": 1,
      "title": "1st Semester Disbursement",
      "due_date": "2024-02-15",
      "amount": 50000,
      "status": "Scheduled",
      "student_count": 150
    }
  ]
}
```

### POST /api/disbursement/create

Create new disbursement schedule.

**Request Body:**

```json
{
  "title": "1st Semester Disbursement",
  "due_date": "2024-02-15",
  "amount": 50000,
  "student_ids": [1, 2, 3, 4, 5]
}
```

## 🔔 Notification Endpoints

### GET /api/notification/list

Get user notifications.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "notification_id": 1,
      "title": "New Renewal Request",
      "message": "A new scholarship renewal requires your approval",
      "type": "approval",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PUT /api/notification/mark-read

Mark notification as read.

**Request Body:**

```json
{
  "notification_id": 1
}
```

## 📊 Analytics Endpoints

### GET /api/analytics/overview

Get system overview statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "total_students": 500,
    "active_renewals": 150,
    "pending_approvals": 25,
    "completed_this_month": 100
  }
}
```

### GET /api/analytics/renewal-trends

Get renewal trends over time.

**Query Parameters:**

- `period` (string) - Time period (monthly, yearly)
- `start_date` (string) - Start date
- `end_date` (string) - End date

**Response:**

```json
{
  "success": true,
  "data": {
    "periods": ["2024-01", "2024-02", "2024-03"],
    "renewals": [100, 120, 150],
    "approvals": [95, 115, 145]
  }
}
```

## 🚨 Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 6 characters"
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 🔄 Real-time Events (WebSocket)

### Connection

```javascript
const socket = io("http://localhost:5000");

// Register user
socket.emit("register_user", userId);

// Listen for updates
socket.on("renewal_updated", (data) => {
  console.log("Renewal updated:", data);
});
```

### Events

- `renewal_updated` - Renewal status changed
- `workflow_approved` - Workflow approved/rejected
- `notification_new` - New notification received
- `document_processed` - Document processing completed

## 📝 Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Document upload**: 10 requests per hour
- **General API**: 100 requests per hour

## 🔒 Security Headers

All responses include security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

## 📋 Request/Response Examples

### Complete Renewal Update Flow

1. **Get current renewals**

```bash
GET /api/renewal/fetch-renewals?school_year=2024-2025&semester=1
```

2. **Update renewal status**

```bash
PUT /api/renewal/update-renewalV2
Content-Type: application/json
Authorization: Bearer <token>

[
  {
    "renewal_id": 1,
    "changedFields": {
      "gpa": 1.8,
      "is_validated": true
    }
  }
]
```

3. **Real-time update sent to all connected clients**

```javascript
socket.emit("renewal_updated", {
  renewal_id: 1,
  status: "updated",
  timestamp: "2024-01-15T10:30:00Z",
});
```

## 🧪 Testing

### Postman Collection

Import the Postman collection for easy API testing:

- [Download Collection](docs/postman-collection.json)
- [Environment Variables](docs/postman-environment.json)

### cURL Examples

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get renewals
curl -X GET http://localhost:5000/api/renewal/fetch-renewals \
  -H "Authorization: Bearer <token>"
```

---

**Last Updated**: January 2024  
**API Version**: v1.0.0
