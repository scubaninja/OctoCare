---
name: review-infrastructure-change
description: Review OctoCare Terraform, deployment workflow, container, or environment changes for security and rollout risk. Use for infrastructure plans, deployment changes, and cloud configuration reviews.
---

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

- Deployed OctoCare infrastructure is defined under `infra/terraform/`
- The solution includes a web app, API, AI triage worker, and SLA worker
- Changes may also affect Docker configuration and deployment-time environment variables

Report findings by severity with the affected file or resource, impact, and a concrete remediation. Distinguish verified issues from assumptions.
