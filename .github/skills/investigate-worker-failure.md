# Investigate Worker Failure

## Description

Investigate a failure or degraded behavior in the AI triage worker or SLA worker and recommend next steps.

## Instructions

When asked to investigate a worker failure:

1. Identify which worker is affected and what symptom is being observed
2. Determine whether the issue is related to scheduling, input data, prompts, downstream APIs, or persistence
3. Check likely customer-facing impact such as missing summaries, stale priorities, or missed SLA escalations
4. Recommend the most likely root cause and the next debugging or remediation step
5. Note any audit, logging, or alerting gaps that made the issue harder to diagnose

## Worker Context

- `services/ai-triage-worker/` handles case summarization and categorization
- `services/sla-worker/` handles SLA monitoring and breach detection
- Prompt assets should remain versioned and governed when AI behavior is involved
