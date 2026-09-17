# Security Model

> **Status:** This document describes the intended production security model.
> The repository is a demo and does not currently implement every control below.
> Treat unchecked items in the current-state table as requirements, not as
> verified protections.

## Current State

| Control | Repository status |
|---|---|
| API authentication and JWT validation | Not implemented in `apps/api` |
| Customer ownership and agent/admin role enforcement | Not implemented |
| Azure Key Vault references for deployed application secrets | Defined in Terraform |
| Managed identity for Key Vault and container registry access | Defined in Terraform |
| HTTPS-only Azure App Service endpoints | Defined in Terraform |
| Private networking for PostgreSQL, Key Vault, Storage, and Azure OpenAI | Not implemented; Terraform enables public network access |
| Malware scanning for attachments | Not implemented |
| Tenant-level data isolation | Not implemented |
| API rate limiting and authentication telemetry | Not implemented |
| CodeQL and dependency review workflows | Implemented |
| Secret scanning and push protection | Repository setting; verify in GitHub before relying on it |
| SBOM generation for releases | Not implemented |

## Authentication

Target state:

- Microsoft Entra ID (Azure AD) for all users
- Customers authenticate via social or email sign-up
- Agents authenticate via corporate SSO
- API uses JWT bearer tokens

## Authorization

Target state:

### Roles

| Role | Access |
|------|--------|
| Customer | Own cases, knowledge base, AI assistant |
| Agent | All cases, dashboard, AI tools, assignment |
| Admin | System config, user management, audit logs |

### API Authorization

- All endpoints require authentication
- Role-based policies enforce access control
- Customers can only access their own cases
- Agents can access all cases in their assigned categories

## Data Protection

Target state:

- All data encrypted at rest (Azure managed keys)
- TLS 1.3 for all communication
- PII minimized in logs
- File uploads scanned for malware before storage
- Customer data isolated by tenant

## Supply Chain Security

- Dependency review runs on pull requests to `main`
- CodeQL runs on pushes and pull requests to `main`, plus a weekly schedule
- Dependabot, secret scanning, and push protection are repository settings and
  must be verified in GitHub
- SBOM generation remains a target-state requirement

## Secrets Management

- Do not commit production credentials, tokens, connection strings, Terraform
  variable files, or populated environment files
- `.env`, `.env.local`, `.env.*.local`, and
  `appsettings.Development.json` are ignored
- `docker-compose.yml` contains the local-only password `octocare_dev`; never
  reuse it outside a disposable development environment
- Terraform variables `database_admin_password` and `openai_api_key` are
  sensitive inputs, but sensitive Terraform values can still be stored in state
- Use a protected remote state backend, restrict state access, and supply
  sensitive values through an approved secret store or ephemeral environment
  variables
- Azure workloads use managed identities for Key Vault and Azure Container
  Registry access; application secrets are exposed through Key Vault references
- The EU release demo uses a separate `COPILOT_METRICS_TOKEN` Actions secret;
  scope it only for the selected organization or enterprise metrics endpoint
- Rotate any credential immediately if it is printed in logs, copied into an
  issue, committed, or exposed in an artifact

## Monitoring

Target state:

- Security alerts routed to team channel
- Failed auth attempts monitored
- API rate limiting enforced
- AI usage anomaly detection
