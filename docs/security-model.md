# Security Model

## Authentication

- Microsoft Entra ID (Azure AD) for all users
- Customers authenticate via social or email sign-up
- Agents authenticate via corporate SSO
- API uses JWT bearer tokens

## Authorization

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

- All data encrypted at rest (Azure managed keys)
- TLS 1.3 for all communication
- PII minimized in logs
- File uploads scanned for malware before storage
- Customer data isolated by tenant

## Supply Chain Security

- Dependency review on all PRs
- Dependabot enabled for automated updates
- CodeQL analysis on every push
- Secret scanning with push protection enabled
- SBOM generated for each release

## Secrets Management

- No secrets in source code
- Azure Key Vault for production secrets
- GitHub Secrets for CI/CD
- Managed identities where possible (no static credentials)

## Monitoring

- Security alerts routed to team channel
- Failed auth attempts monitored
- API rate limiting enforced
- AI usage anomaly detection
