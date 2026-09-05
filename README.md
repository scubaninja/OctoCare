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
- Export the currently filtered knowledge base search results as CSV
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

## Getting Started

```bash
docker-compose up
```

### Web app development

```bash
cd apps/web
npm install
npm run lint
npm run build
npm test
```

### Knowledge base CSV export

The customer-facing **Knowledge base** page (`apps/web/src/app/knowledge-base/page.tsx`)
lets customers search articles by keyword, topic, or category, then export
the results as a CSV file:

- The **Export CSV** button exports exactly the articles currently displayed
  on screen — if a search query is active, only the filtered/matching
  articles are included in the export, never the full unfiltered catalog.
- The button is disabled while articles are loading, if loading failed, or
  when the active search matches no articles, so customers can't trigger an
  export that would be empty or based on stale data. Its accessible name
  ("Export CSV") and description are exposed to assistive technology via
  `aria-describedby`, and a polite live region announces how many articles
  were exported once the download starts.
- The exported filename is derived deterministically from the active search
  query (e.g. `knowledge-base-articles-vpn.csv`, or
  `knowledge-base-articles.csv` with no search applied) — the same query
  always produces the same filename.
- CSV serialization (`apps/web/src/lib/csv.ts`) follows RFC 4180 quoting
  rules, escapes embedded commas/quotes/line breaks, neutralizes values that
  would otherwise be interpreted as spreadsheet formulas (CSV/formula
  injection), and prepends a UTF-8 byte-order mark so the file opens with the
  correct character encoding in Excel. The generated object URL is revoked
  immediately after the download is triggered.
- Domain-specific column/filename logic lives in
  `apps/web/src/lib/knowledge-base-export.ts`, and is covered by unit tests
  alongside the generic serialization helpers and a component test that
  proves searching filters both the on-screen results and the exported rows.

## Deployment

The `Deploy` workflow reads its Azure credentials and application secrets from
the `production` GitHub environment. Configure these environment secrets before
running the workflow:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `DATABASE_ADMIN_PASSWORD`
- `OPENAI_API_KEY`

The Azure identity must have a federated credential for this repository and
permission to provision the resources defined in `infra/terraform`.

## License

MIT
