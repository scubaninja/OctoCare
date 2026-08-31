---
applyTo: "db/**"
description: PostgreSQL migration and seed-data guidance for OctoCare.
---

# Database

- Add a new ordered migration for schema changes; do not rewrite migrations that may have been applied.
- Prefer backward-compatible expand-and-contract changes when application and schema versions can overlap.
- Include constraints and indexes that enforce domain integrity and support expected query paths.
- Store timestamps in UTC and make nullability and defaults explicit.
- Consider existing rows before adding required columns, unique constraints, foreign keys, or enum restrictions.
- Keep production migrations deterministic and separate demo seed data from schema changes.
- Avoid destructive data changes unless the task explicitly requires them and includes a recovery strategy.
- Check API, worker, Terraform, and seed-data dependencies for every schema change.
