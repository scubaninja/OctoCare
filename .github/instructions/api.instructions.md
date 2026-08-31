---
applyTo: "apps/api/**"
description: ASP.NET Core, EF Core, PostgreSQL, and API contract guidance for OctoCare.
---

# API

- Target .NET 8 with nullable reference types enabled and follow existing dependency-injection patterns.
- Keep controllers thin; place reusable business logic behind focused services.
- Use request DTOs rather than binding customer input directly to persistence models.
- Validate identifiers, enum values, lengths, attachment metadata, and state transitions.
- Enforce authentication, role policies, tenant boundaries, and case ownership in server-side code. Verify controls exist before relying on `docs/security-model.md`.
- Preserve REST status codes and response shapes. Use consistent Problem Details responses for client-visible errors.
- Use async EF Core APIs and propagate `CancellationToken` through database and external calls.
- Avoid broad exception catches, sensitive logging, and success-shaped fallbacks.
- Update migrations and callers when persistence or serialized contracts change.
- Run `dotnet build apps/api/OctoCare.Api.csproj` and the smallest relevant existing tests.
