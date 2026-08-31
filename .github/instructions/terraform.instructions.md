---
applyTo: "infra/terraform/**"
description: Terraform and Azure infrastructure guidance for OctoCare.
---

# Terraform infrastructure

- Treat this directory as the source of truth for deployed Azure resources.
- Keep environment-specific values parameterized and preserve stable resource naming.
- Prefer managed identity, workload identity federation, Key Vault references, private connectivity, encryption, and least privilege.
- Never add credentials, tokens, connection strings, or tenant-specific secrets to source.
- Check application settings and identity permissions across the web app, API, both workers, PostgreSQL, storage, and Azure OpenAI.
- Identify replacement, downtime, state migration, and rollout implications before changing resources.
- Keep provider constraints intentional and avoid unrelated provider or resource upgrades.
- Run `terraform fmt -check`, `terraform validate`, and review a plan before apply.
