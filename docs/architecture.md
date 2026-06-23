# Architecture

## Overview

OctoCare is a monorepo containing a customer support portal, API, and background workers. It demonstrates a modern cloud-native architecture with AI integration.

## Components

### Apps

#### Web (`apps/web/`)
- Customer-facing portal for submitting and tracking support cases
- Internal agent dashboard for case management
- Built with TypeScript and a modern frontend framework
- Communicates with the API via REST

#### API (`apps/api/`)
- ASP.NET Core 8 Web API
- Handles case CRUD, authentication, knowledge base, and AI orchestration
- PostgreSQL database via Entity Framework Core
- Exposes RESTful endpoints for both customer and agent interfaces
- Case list endpoint (`GET /api/cases`) supports filtering by `status`, `priority`, `assignedAgent`, and `slaRisk` (`low` | `medium` | `high`)

### Services

#### AI Triage Worker (`services/ai-triage-worker/`)
- Background worker that processes new cases
- Generates summaries using Azure OpenAI
- Classifies priority and category
- Suggests next actions for agents

#### SLA Worker (`services/sla-worker/`)
- Background worker that monitors case SLA status
- Flags cases approaching breach
- Triggers notifications and escalation workflows

### Infrastructure

#### Database (`db/`)
- PostgreSQL 16
- Migrations managed via EF Core
- Seed data for demo scenarios

#### Cloud Infrastructure (`infra/terraform/`)
- Azure App Service for the API and web frontend
- Azure Container Apps for background workers
- Azure Database for PostgreSQL Flexible Server
- Azure OpenAI Service with a GPT-4o deployment
- Azure Key Vault, Azure Storage, and Log Analytics for secrets, attachments, and monitoring

## Data Flow

```
Customer → Web App → API → Database
                      ↓
              AI Triage Worker → Azure OpenAI
                      ↓
              SLA Worker → Notifications
                      ↓
              Agent Dashboard ← API ← Database
```

## Security

- Authentication via Microsoft Entra ID
- Role-based access: Customer, Agent, Admin
- All AI prompts versioned and reviewed in source control
- Secrets managed via Azure Key Vault (never in code)
- Content Security Policy headers on web app
