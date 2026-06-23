# OctoCare Support Hub

A customer-facing support portal with an internal agent dashboard built for **Titan Limited**.

## Overview

OctoCare demonstrates how modern enterprises can reduce support load, improve customer experience, and bring AI into the software delivery process safely — using GitHub from idea to production.

## Architecture

OctoCare is composed of five runtime components that share a single PostgreSQL database. The web frontend calls the REST API directly; the two background workers run independently on a polling loop.

```
support-hub/
├── .github/          # Workflows, prompts, issue templates, skills
├── apps/
│   ├── web/          # Customer portal + support dashboard  (Next.js / TypeScript)
│   └── api/          # Case management REST API             (ASP.NET Core / C#)
├── services/
│   ├── ai-triage-worker/   # Background AI summarization & categorisation (C#)
│   └── sla-worker/         # Background SLA breach detection              (C#)
├── db/
│   ├── migrations/   # SQL schema migrations
│   └── seed/         # Development seed data
├── infra/
│   ├── docker/       # Shared Docker configuration
│   └── terraform/    # Cloud infrastructure (IaC)
├── docs/
└── docker-compose.yml
```

### Components

| Component | Technology | Responsibility |
|---|---|---|
| **apps/web** | Next.js 14, TypeScript, Tailwind CSS | Customer-facing portal (submit cases, track status, knowledge base search, AI assistant) and internal agent dashboard (triage, SLA view, AI summaries). Talks to `apps/api` over HTTP. |
| **apps/api** | ASP.NET Core (.NET 8), Entity Framework Core | REST API for case management. Exposes endpoints for cases, customers, knowledge base articles, and the AI assistant. Reads and writes to PostgreSQL via EF Core. Calls Azure OpenAI for on-demand AI features. |
| **services/ai-triage-worker** | .NET 8 Worker Service | Background service that polls for new or unprocessed cases, calls Azure OpenAI to generate a summary, detect sentiment, classify priority, and suggest a next action, then writes the results back to the database. |
| **services/sla-worker** | .NET 8 Worker Service | Background service that periodically scans open cases and flags those approaching or exceeding their SLA deadline, updating case status so the dashboard can surface at-risk items. |
| **db** | PostgreSQL 16 | Single shared database. Schema is managed with SQL migration files. All four services connect using the `ConnectionStrings__DefaultConnection` environment variable. |

### Data Flow

```
Browser
  │
  ▼
apps/web  (Next.js, port 3000)
  │  REST over HTTP
  ▼
apps/api  (ASP.NET Core, port 8080)
  │                        │
  │  SQL (EF Core)         │  Azure OpenAI API
  ▼                        ▼
PostgreSQL ◄──── ai-triage-worker  (polls DB, calls OpenAI)
           ◄──── sla-worker        (polls DB, updates SLA flags)
```

### External Dependencies

| Dependency | Used by | Purpose |
|---|---|---|
| PostgreSQL 16 | All services | Primary data store |
| Azure OpenAI | `apps/api`, `ai-triage-worker` | Case summarization, sentiment analysis, priority classification, AI assistant responses |

## Customer Features

- Submit a support request
- Track case status
- Add comments or attachments
- Search a knowledge base
- Use an AI assistant to find answers before opening a ticket

## Agent Dashboard Features

- Triage incoming cases
- Assign priority and categorize issues
- View AI-generated summaries
- Get suggested next steps
- Escalate issues
- Track SLA status

## Demo Storyline

1. A customer reports a damaged product through the website
2. The support dashboard shows the new case
3. AI summarizes the issue, classifies priority, and suggests the next action
4. A GitHub Issue is created for a missing feature: photo upload for damaged claims
5. Copilot helps implement the feature
6. Copilot Code Review catches missing validation or accessibility problems
7. CodeQL and dependency review run in the PR
8. GitHub Actions deploys the app
9. The live site now supports image upload and better case triage

## Getting Started

```bash
docker-compose up
```

## License

MIT
