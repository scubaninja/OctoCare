---
applyTo: "services/**"
description: Reliability guidance for OctoCare AI triage and SLA background workers.
---

# Background workers

- Respect the host cancellation token in loops, delays, database calls, and HTTP or AI calls.
- Make processing idempotent and safe under retries, restarts, and concurrent worker instances.
- Claim work atomically or use database concurrency controls; do not rely on a read followed by an unguarded update.
- Bound retries with backoff and distinguish transient failures from invalid data or permanent failures.
- Log structured case and operation identifiers without customer messages, secrets, or unnecessary PII.
- Persist enough audit state to explain model decisions, SLA calculations, retries, and failures.
- Validate prompt inputs and model outputs before updating case priority, category, summary, or next action.
- Use UTC and explicit evaluation timestamps for SLA calculations.
- Run `dotnet build` for the affected worker project and relevant existing tests.
