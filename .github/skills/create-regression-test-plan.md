# Create Regression Test Plan

## Description

Create a focused regression test plan for a feature, bug fix, or incident in OctoCare.

## Instructions

When asked to create a regression test plan:

1. Identify the changed or at-risk behavior
2. Cover the most relevant layers (`apps/web`, `apps/api`, worker services, and data/integration points as needed)
3. List high-value happy path, edge case, and failure case scenarios
4. Call out what should be automated versus what can remain manual
5. Note any observability or audit signals that should be checked after release

## Guidance

- Prefer risk-based coverage over exhaustive lists
- Include SLA, triage, and audit-history impacts when relevant
- Mention specific existing test suites or folders when known
- Flag dependencies on prompts, seeded data, or external services
