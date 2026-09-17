# OctoCare Support Hub

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

For customers using GitHub Enterprise Cloud with data residency in the EU, see the [release demo workflow](docs/eu-data-residency-release-demo.md).

## Getting Started

```bash
docker compose up --build
```

The compose stack uses the local-only PostgreSQL password `octocare_dev`.
Apply `db/migrations/001_initial.sql` and `db/seed/seed.sql` to the `octocare`
database before using flows that read or write data. Set
`AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY` only when exercising AI
features.

## Build and Delivery

See [Build and delivery](docs/build-and-delivery.md) for:

- how the monorepo and CI/CD workflow are structured;
- local and pull-request validation commands;
- a decision guide for Docker Compose, Railway, and Azure;
- the current deployment automation gaps; and
- credential and secret-handling requirements.

The checked-in `CI/CD Workflow` validates and containerizes all four
applications. Its development and production deployment jobs are simulations;
it does not currently authenticate to Azure, push images, run Terraform, or
deploy application revisions.

The Azure target architecture is defined in `infra/terraform`. Provisioning it
is currently a manual operator task and requires separately configured Terraform
state plus sensitive variable values.

### Railway

Deploy the repository as two Railway services. Do not deploy the repository root
as one service and do not set a custom `start.sh` command.

1. Add a PostgreSQL service to the Railway project.
2. Add an `api` service from this GitHub repository. Set **Root Directory** to
   `/apps/api` and **Railway Config File** to `/apps/api/railway.json`.
3. In the API service, add Railway variable references for `PGHOST`, `PGPORT`,
   `PGDATABASE`, `PGUSER`, and `PGPASSWORD` from the PostgreSQL service. The API
   converts these variables to its Npgsql connection string.
4. Generate a public domain for the API. Initialize the database once by running
   `db/migrations/001_initial.sql` and then `db/seed/seed.sql` in Railway's
   PostgreSQL query interface.
5. Add a `web` service from the same repository. Set **Root Directory** to
   `/apps/web` and **Railway Config File** to `/apps/web/railway.json`.
6. Set the web variable `NEXT_PUBLIC_API_URL` to the API's Railway public URL,
   without a trailing slash. `API_URL` remains supported as a legacy alias.
   The Docker build includes this value in the browser bundle, so redeploy the
   web service after changing it.
7. Generate the web service's public domain. Set the API variable
   `Cors__AllowedOrigins__0` to that URL without a trailing slash, then redeploy
   the API service.

Both Railway service configs force Dockerfile builds and clear custom start
commands, preventing Railpack from looking for `start.sh`.

## License

MIT
