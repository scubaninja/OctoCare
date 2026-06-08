# Copilot Instructions for OctoCare

## Project Context

OctoCare is a customer support portal with an internal agent dashboard. It is built as a demo application for Titan Limited to showcase GitHub's platform capabilities.

## Architecture

- **apps/web/**: Customer-facing portal and internal support dashboard (frontend)
- **apps/api/**: ASP.NET Core API for case management
- **services/ai-triage-worker/**: Background worker for AI-powered case summarization and categorization
- **services/sla-worker/**: Background worker for SLA monitoring and breach detection
- **db/**: Database migrations and seed data
- **infra/**: Infrastructure as code (Bicep) and Docker configuration

## Coding Standards

- Use C# for API and worker services (ASP.NET Core, .NET 8+)
- Use TypeScript for the web application
- Follow REST API conventions for the case management API
- Write unit tests for all business logic
- Use dependency injection throughout
- Keep prompts versioned in `.github/prompts/`

## Key Domain Concepts

- **Case**: A customer support request with status, priority, category, and audit history
- **Knowledge Base Article**: Self-service content customers can search before opening a case
- **SLA**: Service Level Agreement defining response and resolution time targets
- **Triage**: The process of categorizing, prioritizing, and assigning incoming cases

## AI Integration

- Prompts are treated as production assets: versioned, reviewed, tested, and governed
- AI features include: case summarization, sentiment detection, priority classification, suggested next action, knowledge base answer generation
- All AI interactions should be logged for audit purposes
