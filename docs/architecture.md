# Architecture

## Overview

OctoCare is a monorepo containing a customer support portal, API, and background workers. It demonstrates a modern cloud-native architecture with AI integration.

## Components

### Apps

#### Web (`apps/web/`)
- Customer-facing portal for submitting and tracking support cases
- Internal agent dashboard for case management
- Built with TypeScript, Next.js, and React
- Communicates with the API via REST

#### API (`apps/api/`)
- ASP.NET Core 8 Web API
- Handles case CRUD, knowledge base, and AI orchestration
- PostgreSQL database via Entity Framework Core
- Exposes RESTful endpoints for both customer and agent interfaces

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
- Schema and demo data managed through checked-in SQL migration and seed scripts
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

- All AI prompts versioned and reviewed in source control
- Terraform stores deployed application secrets in Azure Key Vault
- Managed identities are configured for Azure workloads to read Key Vault secrets and pull container images

Authentication, role-based authorization, tenant isolation, upload scanning, and
browser security headers are target-state controls rather than fully implemented
features. See [Security Model](security-model.md) for the current-state gaps.
