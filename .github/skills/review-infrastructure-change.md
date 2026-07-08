# Review Infrastructure Change

## Description

Review a proposed infrastructure or deployment change for safety, completeness, and operational impact.

## Instructions

When asked to review an infrastructure change:

1. Identify the resources, parameters, and environments affected
2. Check for security, networking, identity, and configuration risks
3. Look for missing dependencies, rollout steps, or app setting changes
4. Highlight any breaking changes, migration needs, or drift risks
5. Recommend a safer implementation or rollout sequence when needed

## Context

- OctoCare infrastructure lives under `infra/`
- The solution includes a web app, API, AI triage worker, and SLA worker
- Changes may also affect Docker configuration and deployment-time environment variables
