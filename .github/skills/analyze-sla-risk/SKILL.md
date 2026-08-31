---
name: analyze-sla-risk
description: Calculate and explain OctoCare response or resolution SLA risk and recommend escalation. Use for approaching breaches, breached cases, workload rebalancing, and escalation decisions.
---

# Analyze SLA Risk

## Description

Analyze cases that are approaching or have breached their SLA targets and recommend actions.

## Instructions

When asked to analyze SLA risk:

1. Calculate time remaining before SLA breach
2. Identify blocking factors (waiting on customer, waiting on internal team, unassigned)
3. Recommend escalation path if breach is imminent
4. Suggest priority rebalancing if agent workload is the bottleneck

## SLA Targets

| Priority | First Response | Resolution |
|----------|---------------|------------|
| Critical | 1 hour | 4 hours |
| High | 4 hours | 24 hours |
| Medium | 8 hours | 72 hours |
| Low | 24 hours | 1 week |

Premium customers receive halved response and resolution times.

Use UTC timestamps and state the evaluation time. Do not calculate a deadline when priority, customer tier, SLA type, or the relevant start timestamp is missing.

## Escalation Path

1. Reassign to available agent with capacity
2. Escalate to team lead
3. Escalate to department manager
4. Executive escalation (Critical only)
