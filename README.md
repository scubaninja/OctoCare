# OctoCare Support Hub

A customer-facing support portal with an internal agent dashboard built for **Titan Limited**.

## Overview

OctoCare demonstrates how modern enterprises can reduce support load, improve customer experience, and bring AI into the software delivery process safely — using GitHub from idea to production.

## Architecture

```
support-hub/
├── .github/          # Workflows, prompts, issue templates, skills
├── apps/
│   ├── web/          # Customer portal + support dashboard
│   └── api/          # Case management API (ASP.NET Core)
├── services/
│   ├── ai-triage-worker/   # Background case summarization/categorization
│   └── sla-worker/         # Flags cases at risk of breaching SLA
├── db/
│   ├── migrations/
│   └── seed/
├── infra/
│   ├── bicep/
│   ├── docker/
│   └── terraform/
├── docs/
└── docker-compose.yml
```

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

### Prerequisites

- Docker + Docker Compose
- Node.js 20+ and npm (for local web development)
- .NET 8 SDK (for local API/worker development)

### Run with Docker (recommended)

```bash
docker compose up --build
```

Once running:

- Web app: http://localhost:3000
- API: http://localhost:8080
- PostgreSQL: localhost:5432 (`octocare` / `octocare_dev`)

### Local development (without Docker)

```bash
# Web app
cd apps/web
npm ci
npm run dev
```

```bash
# API
dotnet run --project apps/api/OctoCare.Api.csproj
```

```bash
# Workers
dotnet run --project services/ai-triage-worker/AiTriageWorker.csproj
dotnet run --project services/sla-worker/SlaWorker.csproj
```

### Common validation commands

```bash
cd apps/web && npm run lint && npm run build
dotnet build apps/api/OctoCare.Api.csproj
dotnet build services/ai-triage-worker/AiTriageWorker.csproj
dotnet build services/sla-worker/SlaWorker.csproj
```

## License

MIT
