# 🐙 OctoCare Support Hub

> **The AI-powered customer support portal built for Titan Limited — and a showcase of GitHub from idea to production.**

[![CI](https://github.com/scubaninja/OctoCare/actions/workflows/tests.yml/badge.svg)](https://github.com/scubaninja/OctoCare/actions/workflows/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌊 What Is OctoCare?

OctoCare is a **full-stack customer support platform** that demonstrates how modern engineering teams can:

- 🤖 Integrate **AI-powered case triage** directly into their support workflow
- 🔒 Ship features safely with **GitHub's security toolchain** (CodeQL, Dependabot, secret scanning)
- 🚀 Automate deployments with **GitHub Actions** from PR to production
- 📋 Govern AI prompts as **first-class production assets** — versioned, reviewed, and audited

It ships as a complete monorepo with a customer-facing web portal, a REST API, two background workers, database migrations, infrastructure-as-code, and a library of AI prompts.

---

## 🗺️ Repository Layout

```
OctoCare/
├── .github/                  # 🤖 Workflows, Copilot prompts, issue templates
├── apps/
│   ├── web/                  # 🌐 Next.js customer portal + agent dashboard
│   └── api/                  # ⚙️  ASP.NET Core 8 case management API
├── services/
│   ├── ai-triage-worker/     # 🧠 Background worker: case summarization & classification
│   └── sla-worker/           # ⏱️  Background worker: SLA breach detection
├── db/
│   ├── migrations/           # 🗄️  EF Core migrations
│   └── seed/                 # 🌱 Demo seed data
├── infra/
│   ├── docker/               # 🐳 Container configuration
│   └── terraform/            # ☁️  Azure infrastructure (App Service, Container Apps, OpenAI)
├── docs/                     # 📚 Architecture, security, AI governance, demo script
└── docker-compose.yml        # 🛠️  One-command local environment
```

---

## ✨ Features at a Glance

### 👤 Customer Portal
| Feature | Description |
|---------|-------------|
| 📝 Submit a case | File a new support request with category and description |
| 🔍 Track status | See real-time status updates on open cases |
| 💬 Add comments | Collaborate with agents directly on the case thread |
| 📎 Attachments | Upload files or photos to support your request |
| 🔎 Knowledge base | Search self-service articles before opening a ticket |
| 🤖 AI assistant | Get an instant AI-generated answer before submitting |

### 🧑‍💼 Agent Dashboard
| Feature | Description |
|---------|-------------|
| 📥 Triage queue | Review incoming cases with AI-generated summaries |
| 🏷️ Priority & category | AI pre-classifies cases; agents confirm or override |
| 💡 Suggested actions | AI recommends the next best step per case |
| ⬆️ Escalation | One-click escalation with audit trail |
| 📊 SLA tracker | Live view of cases at risk of breaching SLA |

---

## 🏗️ Architecture Overview

```
Customer → Web App (Next.js)
               │
               ▼
           REST API (ASP.NET Core 8)
               │
        ┌──────┴──────┐
        ▼             ▼
   PostgreSQL   AI Triage Worker
                      │
                      ▼
               Azure OpenAI (GPT-4o)

SLA Worker polls the database independently
and triggers notifications when deadlines approach.
```

Full architecture details: [`docs/architecture.md`](docs/architecture.md)

---

## 🛠️ Tools & Access You'll Need

### Local Development

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Run the full stack locally |
| [Node.js](https://nodejs.org/) | 20+ | Build and run the web app |
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0+ | Build the API and workers |
| [Git](https://git-scm.com/) | Any recent | Clone and contribute |

### Cloud / Azure (for full AI features)

| Service | Why it's needed |
|---------|----------------|
| [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) | GPT-4o model for case summarization and triage |
| [Azure Database for PostgreSQL](https://azure.microsoft.com/en-us/products/postgresql) | Production database |
| [Azure App Service](https://azure.microsoft.com/en-us/products/app-service) | Hosts the web app and API |
| [Azure Container Apps](https://azure.microsoft.com/en-us/products/container-apps) | Runs the background workers |
| [Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault) | Secrets management |
| [Microsoft Entra ID](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id) | Authentication (SSO for agents) |

> 💡 **You don't need an Azure subscription to run OctoCare locally.** Docker Compose wires everything up for you — just bring your own Azure OpenAI credentials if you want live AI features.

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/scubaninja/OctoCare.git
cd OctoCare
```

### 2. Configure environment variables

Copy the example env file and fill in your Azure OpenAI details:

```bash
cp .env.example .env   # if present, otherwise create .env manually
```

At minimum, set these two values in `.env`:

```env
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-api-key>
```

> The app will start without these values, but AI triage features will be disabled.

### 3. Start the full stack

```bash
docker-compose up
```

| Service | URL |
|---------|-----|
| 🌐 Web portal | http://localhost:3000 |
| ⚙️ API | http://localhost:8080 |
| 🗄️ PostgreSQL | localhost:5432 |

### 4. Run services individually (optional)

**Web app:**
```bash
cd apps/web
npm install
npm run dev
```

**API:**
```bash
dotnet run --project apps/api/OctoCare.Api.csproj
```

**AI Triage Worker:**
```bash
dotnet run --project services/ai-triage-worker/AiTriageWorker.csproj
```

**SLA Worker:**
```bash
dotnet run --project services/sla-worker/SlaWorker.csproj
```

---

## 🧪 Running Tests & Linting

**Web (lint + build):**
```bash
cd apps/web
npm run lint
npm run build
```

**API and workers (.NET):**
```bash
dotnet build apps/api/OctoCare.Api.csproj
dotnet build services/ai-triage-worker/AiTriageWorker.csproj
dotnet build services/sla-worker/SlaWorker.csproj
```

CI runs automatically on every pull request via [`.github/workflows/tests.yml`](.github/workflows/tests.yml).

---

## 🎬 Demo Storyline

> Walk through this end-to-end scenario to see the full GitHub platform in action:

1. 🛒 A customer reports a **damaged product** through the web portal
2. 📋 The agent dashboard receives the new case
3. 🧠 AI **summarizes** the issue, classifies priority, and suggests the next action
4. 🐙 A **GitHub Issue** is created for a missing feature: photo upload for damage claims
5. 🤖 **Copilot** helps implement the photo upload feature
6. 👀 **Copilot Code Review** catches missing validation and accessibility problems
7. 🔐 **CodeQL** and dependency review run in the PR pipeline
8. 🚀 **GitHub Actions** deploys the updated app to Azure
9. ✅ The live site now supports image upload and improved case triage

Full walkthrough: [`docs/demo-script.md`](docs/demo-script.md)

---

## 📚 Important Documents

| Document | What's in it |
|----------|-------------|
| [`docs/architecture.md`](docs/architecture.md) | Component breakdown, data flow, and infrastructure details |
| [`docs/ai-governance.md`](docs/ai-governance.md) | How AI prompts are versioned, reviewed, tested, and governed |
| [`docs/security-model.md`](docs/security-model.md) | Auth, roles, data protection, and supply-chain security |
| [`docs/demo-script.md`](docs/demo-script.md) | Step-by-step demo walkthrough for Titan Limited |
| [`docker-compose.yml`](docker-compose.yml) | Full local environment definition |
| [`.github/workflows/tests.yml`](.github/workflows/tests.yml) | CI pipeline definition |

---

## 🔐 Security Highlights

- 🔑 **Authentication**: Microsoft Entra ID — corporate SSO for agents, email/social for customers
- 🛡️ **Authorization**: Role-based (Customer / Agent / Admin), enforced at the API layer
- 🔍 **CodeQL**: Static analysis on every push
- 📦 **Dependabot**: Automated dependency updates
- 🤫 **Secret scanning**: Push protection enabled; no secrets in source code ever
- 🏦 **Key Vault**: All production secrets stored in Azure Key Vault

Details: [`docs/security-model.md`](docs/security-model.md)

---

## 🤖 AI Governance

All AI prompts are treated as **production assets**:
- Stored in `.github/prompts/` alongside the code that uses them
- Reviewed via pull requests — diffs show exactly what changed
- Tested against known inputs before merging
- Every AI call is logged with the prompt version and output for audit

Details: [`docs/ai-governance.md`](docs/ai-governance.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following the existing code style
4. Open a pull request — CI will run automatically

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
