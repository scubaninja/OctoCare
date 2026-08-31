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
- Treat `infra/terraform/` as the source of truth for deployed Azure infrastructure
- Preserve public API contracts unless a requested change explicitly changes them
- Validate customer input and enforce case ownership and role boundaries at the API
- Use UTC for persisted timestamps and SLA calculations
- Propagate cancellation through workers, database operations, and external service calls
- Keep background processing idempotent and safe when multiple worker instances run

## Key Domain Concepts

- **Case**: A customer support request with status, priority, category, and audit history
- **Knowledge Base Article**: Self-service content customers can search before opening a case
- **SLA**: Service Level Agreement defining response and resolution time targets
- **Triage**: The process of categorizing, prioritizing, and assigning incoming cases

## AI Integration

- Prompts are treated as production assets: versioned, reviewed, tested, and governed
- AI features include: case summarization, sentiment detection, priority classification, suggested next action, knowledge base answer generation
- All AI interactions should be logged for audit purposes
- Treat customer content as untrusted prompt input and defend against prompt injection
- Do not place secrets or unnecessary PII in prompts, logs, traces, or model outputs
- Validate model output before persistence or display; use human review when confidence is insufficient
- When prompt variables or output contracts change, update every caller and the relevant evaluations

## Source of Truth

- Verify behavior in code and configuration before relying on design documentation
- `docs/security-model.md` and `docs/ai-governance.md` include target-state requirements that may not yet be implemented
- Database migrations live in `db/migrations/`; do not edit an applied migration to change production behavior
- Do not claim a test suite, authentication control, deployment feature, or monitoring signal exists without locating it

## Validation

- Web: run `npm run lint` and `npm run build` from `apps/web/`
- API: run `dotnet build apps/api/OctoCare.Api.csproj`
- Workers: run `dotnet build` for the affected worker project
- Terraform: run `terraform -chdir=infra/terraform fmt -check` and `terraform -chdir=infra/terraform validate` after initialization
- Use the smallest existing validation that covers the change; add automated tests when changing business logic
