# API Reference (summary)

This file summarizes the backend endpoints mounted in server/index.js. Use the server route handlers' source code for exact request/response schemas.

Base: <backend-root>/api/

Endpoints (observed wiring)
- /api/auth
  - Authentication and user admin routes. Likely operations: login, logout, register, user management.
- /api/document
  - Document upload/download endpoints:
    - GET /api/document/download/:filename
    - POST /api/document/upload
- /api/disbursement
  - Disbursement operations (list, create, update, delete).
- /api/disbursement/overview
  - GET /api/disbursement/overview/student-info/:id — fetch student basic info (used by client).
  - Other overview endpoints to aggregate disbursement KPIs.
- /api/disbursement/tracking
  - Tracking operations for disbursement requests/schedules.
- /api/maintenance
  - Maintenance-related endpoints (requests, status updates).
- /api/renewal
  - Contract renewal or recurring workflow endpoints.
- /api/workflow
  - Workflow-related endpoints (upload, download, approvals, status).
  - Example: GET /api/workflow/download/:filePath (client constructs filePath via encodeURIComponent)
- /api/notification
  - Notification push/fetch endpoints.
- /api/approvals
  - Approval creation/listing/decision endpoints.
- /api/jobs
  - Upload status and background job status endpoints.
- /api/invoice
  - Tuition invoice operations (create, list, download).
- /api/process
  - Process progress reporting endpoints.

Static assets:
- /public — static files served by Express

Authentication & cookies:
- The server uses cookie-parser and CORS with credentials allowed. Client likely uses cookies for session/auth.

CORS:
- Origins allowed (observed): https://metrobank-prototype.vercel.app, http://localhost:5173
- Ensure environment-specific CORS is configured for staging/production.

How to create accurate API docs:
1. Inspect each router file (e.g., server/routes/<router>.js) and list endpoints, params, body schema, responses.
2. Produce example requests (curl) and sample responses (JSON).
3. Optionally add an OpenAPI (Swagger) YAML derived from route handlers.