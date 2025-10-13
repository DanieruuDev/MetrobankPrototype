# Per-file summaries (observed source files)

This document summarizes source files found in the repository and links to their source. Use these summaries to orient new contributors.

- client/index.html
  - Description: Vite index HTML bootstrap. Loads `src/main.tsx` and sets fonts and favicon.

- client/README.md
  - Description: Client-specific README with React + Vite guidance and ESLint/TS configs.

- client/src/main.tsx
  - Description: App bootstrap — wraps App with BrowserRouter and AuthProvider, mounts to #root.

- client/src/components/shared/Loading.tsx
  - Description: Reusable loading spinner component with Metrobank logo.

- client/src/components/shared/Sidebar.tsx
  - Description: Sidebar UI with collapsed/expanded states, logo and navigation items.

- client/src/components/shared/Navbar.tsx
  - Description: Top navigation bar component; receives a pageName prop.

- client/src/components/approval/CreateApproval2.tsx
  - Description: Complex approval creation form; supports file dropzone, due-date distribution, axios requests, toast notifications. Uses AuthContext and Loading component.

- client/src/pages/Disbursement/Overview/DetailedOverview.tsx
  - Description: Page to show disbursement overview for a student; formats currency, fetches student info from `/api/disbursement/overview/student-info/:id`, can generate PDF.

- client/src/pages/Disbursement/Tracking/DetailedTracking.tsx
  - Description: Detailed tracking view including download/extract file flows and UI for tracking details.

- client/src/pages/Disbursement/Tracking/ScheduleTracking.tsx
  - Description: Tracking dashboard with KPI cards (Completed/In Progress/Overdue) and listing.

- client/src/pages/TuitionInvoiceUpload/TuitionInvoiceUpload.tsx
  - Description: UI to upload tuition invoices, list student disbursement files, display amounts and statuses, link to document downloads via `api/document/download/:file_name`.

- client/src/mock-data/mockdata.ts
  - Description: Mock workflow data used for development and UI testing (workflow items, statuses, sample docs).

- server/index.js
  - Description: Express server setup: cookie-parser, CORS config, route mounting for many APIs, static public folder, and a default "/" health route.

Notes:
- For complete function & type-level documentation, generate TypeDoc on client source and inspect route handler files in server/ to produce detailed API schemas.