# Test Cases & Checklists (examples tailored to observed code)

Functional
- TC-FUNC-001: Signup / Login
  - Steps: Create account or use seeded account; login via UI; verify auth cookie and access to protected pages.
  - Expected: Login success, AuthProvider sets state.

- TC-FUNC-002: Create Approval (CreateApproval2)
  - Preconditions: Authenticated user.
  - Steps: Open Create Approval flow, upload file via dropzone, set due dates, submit.
  - Expected: POST to `/api/workflow` succeeds; item appears in workflow list.

- TC-FUNC-003: View Disbursement Overview
  - Steps: Navigate to disbursement overview page for a student; page requests `/api/disbursement/overview/student-info/:id`.
  - Expected: Student data renders; currency formatting uses "Php" prefix.

- TC-FUNC-004: Download Document
  - Steps: Click document link; client calls `/api/document/download/:filename` or `/api/workflow/download/:filePath`.
  - Expected: File download begins; response status 200 and correct Content-Disposition.

Performance & Reliability
- TC-PERF-001: 95th percentile latency of /api/disbursement endpoints under 50 concurrent clients.
- TC-REL-001: Simulate DB disconnect (if used). Verify backend recovers and no data loss.

Security
- TC-SEC-001: Attempt path traversal via /api/document/download => ensure server sanitizes and blocks.

Usability
- TC-USE-001: Onboarding completion time for a new user — measure and collect feedback.

Reporting & severity
- Use PASS / FAIL / BLOCKED; attach console logs and server correlation IDs on failure.