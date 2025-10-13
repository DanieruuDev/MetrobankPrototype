# ISO/IEC 25010 Test Plan — MetrobankPrototype (tailored)

This document maps ISO/IEC 25010 characteristics to test objectives and example test cases that match the MetrobankPrototype codebase (frontend + Express backend). Use the Test Cases file for runnable test steps and the Alpha/Beta runbook to coordinate test campaigns.

1) Functional suitability
- Objective: Verify core flows implemented by the client and backend:
  - Authentication and session flows (login, logout)
  - Workflow creation/approval (CreateApproval2 component → /api/workflow)
  - Disbursement overview and tracking (pages call `/api/disbursement/overview/*` and `/api/disbursement/tracking/*`)
  - Document upload/download (`/api/document/*` and `/api/workflow/download/:filePath`)
- Metrics: percent of core flows passing, open critical defects.

2) Performance efficiency
- Measure: Backend API median and 95th/99th percentile latencies under realistic concurrency (simulate frontend flows: list workflows, download documents, fetch student info).
- Tools: k6, Artillery, Lighthouse (frontend).
- Baseline scenarii: 50 concurrent active testers for beta; smaller ramp for alpha.

3) Reliability
- Soak test for 24–72 hours hitting commonly used APIs.
- Simulate DB interruptions if DB-backed (test reconnect & retry logic).
- Verify upload/download and long-polling or background job endpoints under intermittent failures.

4) Usability
- Alpha: product & designer walkthrough of onboarding and critical tasks (create approval, upload invoice, view tracking).
- Beta: recruit target users to perform tasks and gather SUS + task success.

5) Security
- SAST on both server and client (CodeQL, ESLint security plugins).
- DAST for public endpoints (OWASP ZAP), test `/api/document/download` for path traversal.
- Verify cookie-based auth and CORS settings (credentials: true).

6) Maintainability
- Enforce lint and type checks on PRs.
- Code coverage target for core modules (≥70% for important business logic).
- Document public modules and route handlers.

7) Portability & Compatibility
- Provide Dockerfile(s), ensure app builds and runs in container.
- Cross-browser checks: Chrome, Firefox, Safari for client UI pages involved in onboarding and disbursement flows.

8) Compatibility & Interoperability
- Validate integrations (if any) like payment gateway or external services in sandbox mode.

Acceptance criteria (example)
- No open critical defects.
- Core functionality test pass rate ≥95% in alpha; similar in beta with low user-reported critical issues.
- Performance: 95th percentile API latency within target SLA (project-specific).

Traceability
- Maintain a spreadsheet or issue labels mapping each test case (TC-*) to ISO25010 characteristic and owner.