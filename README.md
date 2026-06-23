# OctoCare Support Hub

[![CI](https://github.com/scubaninja/OctoCare/actions/workflows/ci.yml/badge.svg)](https://github.com/scubaninja/OctoCare/actions/workflows/ci.yml)
[![Deploy](https://github.com/scubaninja/OctoCare/actions/workflows/deploy.yml/badge.svg)](https://github.com/scubaninja/OctoCare/actions/workflows/deploy.yml)
[![dev](https://img.shields.io/github/deployments/scubaninja/OctoCare/dev?label=dev)](https://github.com/scubaninja/OctoCare/deployments/dev)
[![test](https://img.shields.io/github/deployments/scubaninja/OctoCare/test?label=test)](https://github.com/scubaninja/OctoCare/deployments/test)
[![production](https://img.shields.io/github/deployments/scubaninja/OctoCare/production?label=production)](https://github.com/scubaninja/OctoCare/deployments/production)

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

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js 20+](https://nodejs.org/) — for running the web app outside Docker
- [.NET 8 SDK](https://dotnet.microsoft.com/download) — for running the API or workers outside Docker

### 1. Configure environment variables

The API and AI workers require Azure OpenAI credentials. Copy the example below into a `.env` file at the project root:

```bash
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-api-key>
```

Docker Compose reads this file automatically. The database credentials are pre-configured for local use and do not need to change.

### 2. Start all services with Docker Compose

```bash
docker-compose up --build
```

This starts:

| Service           | URL                      |
|-------------------|--------------------------|
| Web (Next.js)     | http://localhost:3000    |
| API (ASP.NET Core)| http://localhost:8080    |
| PostgreSQL        | localhost:5432           |

The AI triage worker and SLA worker run as background services with no HTTP port exposed.

### 3. Run services individually (without Docker)

**Web**

```bash
cd apps/web
npm install
npm run dev
```

The web app expects the API at `http://localhost:8080`. Override this by setting `API_URL` in your shell before running.

**API**

```bash
cd apps/api
dotnet run
```

The API reads connection string and Azure OpenAI settings from `appsettings.json` or environment variables. Update `appsettings.json` for local overrides.

**AI triage worker**

```bash
cd services/ai-triage-worker
dotnet run
```

**SLA worker**

```bash
cd services/sla-worker
dotnet run
```

### 4. Apply database migrations

The PostgreSQL schema is managed via plain SQL migrations in `db/migrations/`. When running with Docker Compose the database starts empty; apply migrations manually:

```bash
psql -h localhost -U octocare -d octocare -f db/migrations/001_initial.sql
```

Password: `octocare_dev`

## License

MIT
