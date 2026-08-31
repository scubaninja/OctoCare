---
name: triage-support-case
description: Triage an OctoCare support case into priority, category, SLA risk, and next action. Use when asked to assess, classify, route, or prioritize an incoming case.
---

# Triage Support Case

## Description

Help triage an incoming support case by analyzing the customer's message and recommending priority, category, and next steps.

## Instructions

When asked to triage a support case:

1. Read the customer's message carefully
2. Identify the core issue and any urgency signals
3. Classify the priority (Critical, High, Medium, Low)
4. Suggest a category (Billing, Technical, Shipping, Account, Product Feedback)
5. Recommend an initial response or next action
6. Flag if SLA is at risk based on the customer tier

Do not invent missing customer, account, or timing data. Clearly label assumptions and request the specific missing fields needed for a reliable decision.

## Output

Return the summary, priority with rationale, category, SLA assessment, recommended next action, and any missing information.

## Context

- OctoCare handles support for Titan Limited customers
- SLA targets: Critical = 1hr response, High = 4hr, Medium = 8hr, Low = 24hr
- Premium customers have tighter SLAs (halved response times)
