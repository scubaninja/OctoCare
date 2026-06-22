<div align="center">

# 🐙 OctoCare Support Hub

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-8-512BD4?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Azure](https://img.shields.io/badge/Azure-OpenAI-0078D4?style=for-the-badge&logo=microsoft-azure)](https://azure.microsoft.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen?style=for-the-badge)](LICENSE)

**A customer-facing support portal with an internal agent dashboard built for Titan Limited.**

*From idea to production — with GitHub, Copilot, and AI-powered triage.*

</div>

---

## 🌊 What is OctoCare?

OctoCare is a **full-stack, cloud-native customer support platform** that demonstrates how modern enterprises can:

- 🤖 **Reduce support load** with AI-powered self-service and smart triage
- 🚀 **Improve developer velocity** using GitHub Copilot from feature request to deployed code
- 🛡️ **Ship securely** with continuous code review, CodeQL scanning, and dependency review built into every PR
- 📊 **Stay on top of SLAs** with automated monitoring and breach detection

OctoCare is a **showcase application for Titan Limited** — illustrating the full GitHub platform journey from customer issue to live feature.

---

## 🗺️ Repository Structure

```
OctoCare/
├── 🐙 .github/
│   ├── workflows/        # CI/CD pipelines (build, test, deploy)
│   ├── prompts/          # Versioned AI prompts (treated as production assets)
│   └── ISSUE_TEMPLATE/   # Structured issue templates
├── 🌐 apps/
│   ├── web/              # Customer portal + agent dashboard (Next.js 14 + TypeScript)
│   └── api/              # Case management REST API (ASP.NET Core 8)
├── ⚙️ services/
│   ├── ai-triage-worker/ # Background AI summarization & categorization
│   └── sla-worker/       # SLA monitoring & breach detection
├── 🗄️ db/
│   ├── migrations/       # Entity Framework Core migrations
│   └── seed/             # Demo data for realistic scenarios
├── 🏗️ infra/
│   ├── bicep/            # Azure Bicep templates
│   ├── docker/           # Docker configurations
│   └── terraform/        # Terraform infrastructure as code
├── 📚 docs/              # Architecture, security, AI governance, demo scripts
└── 🐳 docker-compose.yml # One-command local environment
```

---

## ✨ Features

### 👤 Customer Portal

| Feature | Description |
|---------|-------------|
| 🎫 **Case Submission** | Submit detailed support requests with attachments |
| 🔍 **Status Tracking** | Monitor case progress, updates, and conversation history |
| 💬 **Comments** | Add follow-up information directly to a case |
| 📖 **Knowledge Base** | Browse and search self-service articles |
| 🤖 **AI Assistant** | Get instant AI-powered answers before opening a ticket |

### 🧑‍💼 Agent Dashboard

| Feature | Description |
|---------|-------------|
| 📥 **Case Queue** | Triage and manage all incoming support cases |
| 🏷️ **AI Triage** | Auto-generated summaries, priority classification, and category tagging |
| ⚡ **Next-Action Suggestions** | AI recommends the best next step for each case |
| ⏱️ **SLA Monitoring** | Real-time visibility into response and resolution deadlines |
| 🔺 **Escalation Workflows** | Escalate critical cases with a single action |

---

## 🛠️ Prerequisites

Before getting started, make sure you have the following tools and access:

### 🔧 Required Tools

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| **Docker Desktop** | Latest | Run the full stack locally | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Node.js** | 20+ | Frontend development | [nodejs.org](https://nodejs.org/) |
| **.NET SDK** | 8.0+ | API and worker services | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| **Git** | Latest | Source control | [git-scm.com](https://git-scm.com/) |

### ☁️ Optional (for full AI features)

| Requirement | Details |
|-------------|---------|
| **Azure Subscription** | Required for Azure OpenAI Service and cloud deployment |
| **Azure OpenAI Resource** | GPT-4o deployment for AI triage and assistant features |
| **GitHub Copilot** | Recommended for development — used throughout this project |

### 🔑 Environment Variables

Create a `.env` file in the root (see `.env.example` if present) or export:

```bash
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-api-key>
```

> 💡 **Don't have Azure OpenAI?** The app runs without it — AI features will show a graceful fallback message.

---

## 🚀 Getting Started

### ⚡ Quick Start (Docker)

The fastest way to run everything locally:

```bash
# 1. Clone the repository
git clone https://github.com/scubaninja/OctoCare.git
cd OctoCare

# 2. (Optional) Set Azure OpenAI credentials
export AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
export AZURE_OPENAI_API_KEY=<your-api-key>

# 3. Start all services
docker-compose up
```

Once running, open:
- 🌐 **Customer Portal & Agent Dashboard** → http://localhost:3000
- 🔌 **API + Swagger UI** → http://localhost:8080/swagger

### 💻 Local Development Setup

For active development, run each service independently:

#### Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

> Runs at http://localhost:3000

#### API (ASP.NET Core)

```bash
# Start the database first
docker-compose up db -d

cd apps/api
dotnet run
```

> Runs at http://localhost:8080

#### AI Triage Worker

```bash
cd services/ai-triage-worker
dotnet run
```

#### SLA Worker

```bash
cd services/sla-worker
dotnet run
```

### 🗄️ Database

Migrations are managed with Entity Framework Core. When the API starts, it automatically applies pending migrations. To run manually:

```bash
cd apps/api
dotnet ef database update
```

To seed demo data, check the scripts in `db/seed/`.

---

## 🏗️ Architecture Overview

```
Customer → Web App (Next.js) → REST API (ASP.NET Core)
                                        │
                               ┌────────┴────────┐
                               │                 │
                          PostgreSQL       Azure OpenAI
                               │
                    ┌──────────┴──────────┐
                    │                     │
             AI Triage Worker       SLA Worker
          (summarize, classify)   (breach detection)
                    │
             Agent Dashboard ← API ← Database
```

For a deeper dive, see [📐 Architecture Documentation](docs/architecture.md).

---

## 🧪 Running Tests & Linting

```bash
# Lint and build the frontend
cd apps/web
npm run lint
npm run build

# Build the API
dotnet build apps/api/OctoCare.Api.csproj

# Build the workers
dotnet build services/ai-triage-worker/AiTriageWorker.csproj
dotnet build services/sla-worker/SlaWorker.csproj
```

---

## 📚 Important Documentation

| Document | Description |
|----------|-------------|
| [📐 Architecture](docs/architecture.md) | System components, data flow, and infrastructure |
| [🤖 AI Governance](docs/ai-governance.md) | How AI prompts are versioned, reviewed, and governed |
| [🛡️ Security Model](docs/security-model.md) | Auth, authorization, data protection, and supply chain security |
| [🎬 Demo Script](docs/demo-script.md) | Step-by-step walkthrough of the full OctoCare story |

---

## 🐙 Demo Storyline

Here's the end-to-end journey OctoCare demonstrates:

1. 📦 A customer reports a **damaged product** through the portal
2. 🔔 The support dashboard shows the **new case in the queue**
3. 🤖 AI automatically **summarizes** the issue, classifies **priority as High**, and suggests the next action
4. 🐛 A GitHub Issue is created: *"Customers need to upload photos for damaged item claims"*
5. 💡 **GitHub Copilot** helps implement the file-upload feature
6. 🔍 **Copilot Code Review** catches missing validation and accessibility problems
7. 🔒 **CodeQL** and **dependency review** run in the PR
8. 🚀 **GitHub Actions** deploys the updated app to Azure
9. ✅ The live site now supports image upload and smarter triage

---

## 🤝 Contributing

1. Fork the repo and create a feature branch
2. Make your changes and write tests
3. Open a PR — Copilot Code Review will provide automated feedback
4. Ensure CodeQL and all CI checks pass

---

## 📄 License

[MIT](LICENSE) — Built with 🐙 and ❤️ for Titan Limited.
