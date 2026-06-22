# OctoCare Support Hub

A customer-facing support portal with an internal agent dashboard built for **Titan Limited**. OctoCare demonstrates how modern enterprises can reduce support load, improve customer experience, and bring AI into the software delivery lifecycle safely — using GitHub from idea to production.

![CI](https://github.com/scubaninja/OctoCare/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/scubaninja/OctoCare/actions/workflows/codeql.yml/badge.svg)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running Individual Services](#running-individual-services)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

OctoCare is a monorepo containing a customer support portal, a case management API, and background AI/SLA workers. It is designed as a showcase for GitHub platform capabilities including:

- **GitHub Copilot** for AI-assisted development
- **GitHub Advanced Security** (CodeQL, dependency review, secret scanning)
- **GitHub Actions** for CI/CD
- **Governed AI prompts** versioned and reviewed in source control

---

## Features

### Customer Portal

- Submit a support request
- Track case status in real time
- Add comments or attachments to a case
- Search the knowledge base for self-service answers
- Use an AI assistant to find answers before opening a ticket

### Agent Dashboard

- Triage incoming cases from a unified queue
- View AI-generated case summaries, priority classifications, and suggested next actions
- Assign, escalate, and categorize cases
- Monitor SLA timers and at-risk cases

---

## Architecture

```
OctoCare/
├── .github/                  # Workflows, Copilot prompts, issue templates
├── apps/
│   ├── web/                  # Next.js 14 customer portal + agent dashboard
│   └── api/                  # ASP.NET Core 8 case management API
├── services/
│   ├── ai-triage-worker/     # Background worker: AI summarization & categorization
│   └── sla-worker/           # Background worker: SLA breach detection
├── db/
│   ├── migrations/           # SQL migration scripts
│   └── seed/                 # Demo seed data
├── infra/
│   ├── docker/
│   └── terraform/            # Azure infrastructure (App Service, Container Apps, PostgreSQL, OpenAI)
├── docs/                     # Architecture, security, AI governance, demo script
└── docker-compose.yml
```

**Data flow:**

```
Customer → Web App → API → PostgreSQL
                      ↓
           AI Triage Worker → Azure OpenAI
                      ↓
              SLA Worker → Notifications
                      ↓
         Agent Dashboard ← API ← PostgreSQL
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Docker](https://docs.docker.com/get-docker/) | 24+ | Required for the full stack via `docker-compose` |
| [Docker Compose](https://docs.docker.com/compose/) | 2.x | Bundled with Docker Desktop |
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0+ | Required only for running API/workers outside Docker |
| [Node.js](https://nodejs.org/) | 20 LTS | Required only for running the web app outside Docker |
| Azure OpenAI resource | — | Required for AI triage features; can be omitted to run without AI |

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/scubaninja/OctoCare.git
cd OctoCare
```

### 2. Configure environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) for details. At minimum you need `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY` to enable AI features (the app runs without them, but triage will be skipped).

### 3. Start all services

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Web portal | http://localhost:3000 |
| API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

The database is automatically initialized with migrations and seed data on first startup.

### 4. Stop all services

```bash
docker-compose down
```

To also remove the database volume:

```bash
docker-compose down -v
```

---

## Environment Variables

The following variables are read by `docker-compose.yml`. Create a `.env` file in the repository root:

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | For AI features | Azure OpenAI resource endpoint URL |
| `AZURE_OPENAI_API_KEY` | For AI features | Azure OpenAI API key |

The PostgreSQL credentials used in development are hard-coded in `docker-compose.yml` (`octocare` / `octocare_dev`) and are **not** suitable for production. In production, all secrets are stored in Azure Key Vault and injected via managed identity.

---

## Running Individual Services

### Web app (Next.js)

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

### API (ASP.NET Core)

```bash
cd apps/api
dotnet run         # http://localhost:8080
```

Ensure a PostgreSQL instance is accessible and `ConnectionStrings__DefaultConnection` is set (see `appsettings.json`).

### AI Triage Worker

```bash
cd services/ai-triage-worker
dotnet run
```

### SLA Worker

```bash
cd services/sla-worker
dotnet run
```

---

## Project Structure

```
apps/web/src/
├── app/            # Next.js App Router pages
├── components/     # Shared UI components
└── lib/            # API clients and utilities

apps/api/
├── Controllers/    # REST API controllers
├── Data/           # EF Core DbContext and repositories
├── Dtos/           # Request/response data transfer objects
├── Models/         # Domain entities
├── Services/       # Business logic and AI orchestration
└── Program.cs      # Application entry point and DI configuration

services/ai-triage-worker/
└── TriageWorker.cs # Hosted service: polls for new cases, calls Azure OpenAI

services/sla-worker/
└── SlaMonitorWorker.cs  # Hosted service: monitors SLA timers, raises alerts

.github/prompts/    # Versioned AI prompt definitions (YAML)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | Component overview and data flow |
| [docs/security-model.md](docs/security-model.md) | Authentication, authorisation, and data protection |
| [docs/ai-governance.md](docs/ai-governance.md) | Prompt management, audit trail, and safety guardrails |
| [docs/demo-script.md](docs/demo-script.md) | Step-by-step demo narrative |

---

## Contributing

1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and write or update tests as needed.
3. Open a pull request — Copilot Code Review, CodeQL, and dependency review will run automatically.
4. Address any review feedback before requesting a merge.

Please keep prompts in `.github/prompts/` versioned: treat changes to prompt files the same as code changes and include them in your PR for review.

---

## License

MIT
