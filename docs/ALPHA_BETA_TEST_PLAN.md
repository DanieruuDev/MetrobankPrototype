# Alpha & Beta Test Plan — MetrobankPrototype

Alpha (internal)
- Duration: 1–3 weeks
- Participants: devs, QA, product
- Goals:
  - Verify core functional flows end-to-end
  - Find reliability issues and obvious UX blockers
  - Validate API surfaces used by the client (document endpoints, workflow endpoints)
- Activities:
  - Run unit + integration tests
  - Execute all TC-FUNC and TC-REL test cases
  - Quick security scans

Beta (external)
- Duration: 3–8 weeks
- Participants: selected external users
- Goals:
  - Validate real-world usability and performance
  - Collect user feedback and telemetry
  - Verify compatibility across devices and browsers
- Activities:
  - Release behind feature flag or to invited users
  - Monitor telemetry and error rates
  - Run load tests against production-like environment

Onboarding testers
- Provide ephemeral test accounts and instructions
- Provide seed data or mock flows (client mock-data exists and can be used)

Triage and reporting
- Alpha: daily triage of issues labeled `alpha`
- Beta: triage every 48–72 hrs for `beta` label issues
- Use bug report template in docs/BUG_REPORT_TEMPLATE.md

Roles
- Test lead, QA engineers, Product owner, Dev on-call, Support.