# Build and Delivery

This document explains how OctoCare is assembled, what the GitHub Actions
workflows currently do, and which delivery path to choose. It is the source of
truth for current CI/CD behavior; the Azure deployment jobs are not yet
implemented.

## How OctoCare Is Built

OctoCare uses a monorepo so application code, workers, database scripts,
infrastructure, prompts, and delivery policy can change together:

| Area | Technology | Build or validation entry point |
|---|---|---|
| Customer and agent web app | Next.js, React, TypeScript | `apps/web/package.json` |
| Case management API | ASP.NET Core 8, EF Core, Npgsql | `apps/api/OctoCare.Api.csproj` |
| AI triage worker | .NET 8 Worker Service | `services/ai-triage-worker/AiTriageWorker.csproj` |
| SLA worker | .NET 8 Worker Service | `services/sla-worker/SlaWorker.csproj` |
| Database | PostgreSQL 16 | `db/migrations` and `db/seed` |
| Local environment | Docker Compose | `docker-compose.yml` |
| Azure target environment | Terraform | `infra/terraform` |

The four runtime components each have a Dockerfile. The web app calls the API,
while the API and both workers share PostgreSQL. The API and AI triage worker
also consume Azure OpenAI configuration. Terraform defines App Service for the
web and API, Container Apps for the workers, PostgreSQL Flexible Server, Azure
OpenAI, Storage, Key Vault, Container Registry, and Log Analytics.

## Local Validation

Run the smallest command that covers a change:

```bash
# Web
cd apps/web
npm ci
npm run lint
npm run build

# API
dotnet build apps/api/OctoCare.Api.csproj

# Workers
dotnet build services/ai-triage-worker/AiTriageWorker.csproj
dotnet build services/sla-worker/SlaWorker.csproj

# Terraform, after terraform init
terraform -chdir=infra/terraform fmt -check
terraform -chdir=infra/terraform validate
```

`dotnet test` is used by CI for the three .NET project targets. These projects
currently contain application projects rather than separate test projects, so
contributors should add test projects as business logic gains automated
coverage.

For an integrated local environment:

```bash
docker compose up --build
```

Before exercising database-backed features, apply
`db/migrations/001_initial.sql` and `db/seed/seed.sql` to the local `octocare`
database. The compose file does not apply them automatically.

## GitHub Actions Workflow

### CI/CD Workflow

`.github/workflows/ci.yml` runs on pushes and pull requests to `main`, and by
manual dispatch.

| Stage | Depends on | Behavior |
|---|---|---|
| Lint | - | Installs web dependencies and runs ESLint |
| Test | Lint | Runs `dotnet test` for the API and both workers |
| Build | Test | Builds all .NET projects and the web app |
| Containerize | Build | Builds four local container images without pushing them |
| Deploy - Dev | Containerize | Simulates deployment on eligible `main` runs |
| Deploy - Prod | Deploy - Dev | Uses the `Deploy - Prod` environment, then simulates deployment |
| Summary | All stages | Writes stage results and duration to the run summary |

Pull-request concurrency cancels an older run when a newer commit is pushed to
the same pull request.

### Security Workflows

- `.github/workflows/codeql.yml` analyzes C# and JavaScript/TypeScript on pushes
  and pull requests to `main`, plus a weekly schedule.
- `.github/workflows/dependency-review.yml` blocks pull requests that introduce
  a dependency vulnerability of moderate severity or higher.
- `.github/workflows/eu-data-residency-release-demo.yml` is a manually triggered
  demonstration of tenant-aware GitHub API access, Dependabot alert reporting,
  and Copilot usage metrics. It is not an application deployment workflow.

## Delivery Decision Guide

| Need | Choose | Why | Important limitation |
|---|---|---|---|
| Develop or demo the complete stack locally | Docker Compose | Starts PostgreSQL and all four runtime components together | Database scripts are manual; the bundled password is development-only |
| Validate a pull request | GitHub Actions | Repeats lint, build, container, CodeQL, and dependency checks | Images are not published and no environment is updated |
| Host a lightweight external demo quickly | Railway | Existing service-specific Railway files support separate API and web services | Workers and Azure-specific services require additional setup |
| Provision the intended Azure topology | Terraform | `infra/terraform` is the infrastructure source of truth | State backend and sensitive variables must be configured manually |
| Demonstrate EU data residency release capabilities | EU release demo workflow | Shows GitHub governance and metrics APIs | Does not build or deploy OctoCare |

Do not present the simulated deploy jobs as a production deployment. A real
Azure delivery workflow still needs to:

1. authenticate with Azure using GitHub OpenID Connect;
2. initialize and apply Terraform with protected state;
3. build and push immutable, commit-tagged images to Azure Container Registry;
4. update App Service and Container Apps to those exact image tags;
5. run database migrations as an explicit, auditable step;
6. verify health endpoints and provide rollback instructions; and
7. protect production with environment reviewers and least-privilege permissions.

## Secrets and Credential Safety

The documentation and tracked configuration use secret names and placeholders,
not production credential values. Keep that boundary:

- never put production values in Markdown examples, workflow YAML, Terraform
  variable files, Docker Compose, issues, logs, or uploaded artifacts;
- treat `octocare_dev` in `docker-compose.yml` as a disposable local credential;
- use GitHub environment secrets only for workflows that need them;
- prefer Azure workload identity federation over client secrets;
- store deployed application secrets in Key Vault and restrict access to the
  workload identities that consume them;
- protect Terraform state because sensitive values can be present even when
  variables and outputs are marked `sensitive`; and
- scope `COPILOT_METRICS_TOKEN` to the minimum organization or enterprise
  reporting permission and rotate it on exposure.

Repository-level secret scanning and push protection are configured outside the
codebase. Verify both settings in GitHub before treating them as enforced.
