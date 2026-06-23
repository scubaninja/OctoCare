# 🐙 OctoCare Support Hub

Welcome to **OctoCare**, a colorful demo support platform for **Titan Limited**. It combines a customer-facing portal, an internal agent dashboard, a case management API, and background workers for AI triage and SLA monitoring.

## 🌈 What this repo does

OctoCare shows how a modern support experience can work from end to end:

- **Customers** can search a knowledge base, ask an AI assistant for help, and open support cases.
- **Agents** can triage cases, review AI-generated summaries, manage priorities, and watch SLA risk.
- **Developers** can use the repo to demonstrate how GitHub, Copilot, Actions, and security tooling fit into an AI-enabled product workflow.

In short: **this repo is both an application and a demo story about building support software safely with AI.**

## 🧭 Repo map

```text
OctoCare/
├── apps/
│   ├── web/                  # Next.js customer portal + support dashboard
│   └── api/                  # ASP.NET Core case management API
├── services/
│   ├── ai-triage-worker/     # AI summaries, categorization, suggested actions
│   └── sla-worker/           # SLA monitoring and breach detection
├── db/                       # Database migrations and seed data
├── docs/                     # Architecture, governance, demo, security docs
├── infra/                    # Deployment and infrastructure assets
├── .github/
│   ├── prompts/              # Versioned AI prompts
│   └── workflows/            # CI, security, deployment automation
└── docker-compose.yml        # Local multi-service startup
```

## ✨ Core capabilities

### 🧑‍💼 Customer experience

- Submit and track support cases
- Search self-service knowledge base content
- Ask an AI assistant for answers before opening a ticket

### 🛠️ Agent experience

- Review incoming cases in a support dashboard
- See AI-generated summaries and classifications
- Manage priority, category, escalation, and next steps
- Monitor SLA health for active cases

### 🤖 AI and platform story

- AI prompts are versioned in source control
- Background workers process triage and SLA workflows
- GitHub Actions, CodeQL, and dependency review support safer delivery

## 🧰 What you need

### Required tools

- **Git**
- **Docker** with Compose support
- **Node.js 20+** and **npm** for web app development
- **.NET 8 SDK** for the API and worker services

### Access you may need

- **Azure OpenAI access** if you want AI-powered flows to work locally
  - `AZURE_OPENAI_ENDPOINT`
  - `AZURE_OPENAI_API_KEY`
- **Azure access** if you plan to work with deployment or infrastructure assets
- **GitHub repository access** if you need to run CI/CD workflows or contribute through pull requests

> ⚠️ AI-related features depend on Azure OpenAI configuration. Without those values, core app structure can still be explored, but AI paths may not function fully.

## 🚀 Getting started

### Option 1: Quick start with Docker

From the repository root:

```bash
docker compose up --build
```

This starts:

- **Web app** on `http://localhost:3000`
- **API** on `http://localhost:8080`
- **PostgreSQL** on `localhost:5432`
- **AI triage worker**
- **SLA worker**

If your Docker setup still uses the legacy command, `docker-compose up --build` should also work.

### Option 2: Work on services individually

Useful when you want faster feedback while changing a specific area:

```bash
# Web app
cd apps/web
npm install
npm run lint
npm run build
```

```bash
# API
dotnet build apps/api/OctoCare.Api.csproj

# Workers
dotnet build services/ai-triage-worker/AiTriageWorker.csproj
dotnet build services/sla-worker/SlaWorker.csproj
```

## 🔐 Configuration notes

- Local Docker setup uses PostgreSQL credentials defined in `docker-compose.yml`
- Production secrets should stay out of source control
- AI prompt assets live in `.github/prompts/` and should be treated like production code

## 📚 Important docs for onboarding

Start here if you want the bigger picture:

- [`docs/architecture.md`](docs/architecture.md) — system layout, components, and data flow
- [`docs/ai-governance.md`](docs/ai-governance.md) — how prompts are versioned, reviewed, and governed
- [`docs/security-model.md`](docs/security-model.md) — auth, authorization, secrets, and supply chain controls
- [`docs/demo-script.md`](docs/demo-script.md) — walkthrough for presenting the product and GitHub workflow story

## 🎬 Suggested first tour

If you're new to the repo, this is a good path:

1. Read the [architecture doc](docs/architecture.md)
2. Start the stack with Docker
3. Open the web app and API locally
4. Review `.github/prompts/` to see how AI assets are managed
5. Use the [demo script](docs/demo-script.md) if you're presenting the project

## 📄 License

MIT
