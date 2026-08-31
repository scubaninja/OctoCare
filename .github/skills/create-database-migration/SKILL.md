---
name: create-database-migration
description: Design or implement a safe PostgreSQL migration for OctoCare. Use when changing tables, columns, constraints, indexes, seed dependencies, or persisted domain values.
---

# Create Database Migration

1. Trace the affected API models, EF mapping, raw worker SQL, seed data, and Terraform configuration.
2. Choose an expand-and-contract sequence when old and new application versions may overlap.
3. Define backfill behavior before making existing data required or constrained.
4. Add appropriate constraints and indexes without silently changing domain meaning.
5. Preserve UTC timestamp semantics and PostgreSQL-compatible types.
6. Describe locking, runtime, rollback or forward-fix, and deployment ordering risks.
7. Add a new ordered file under `db/migrations/`; never edit a migration that may already be applied.

Return the migration, dependent code changes, validation queries, and rollout sequence. Stop rather than guessing when destructive data handling is unspecified.
