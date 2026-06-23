# Changelog

All notable changes to OctoCare will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Initial project scaffold: customer portal (`apps/web`), case management API (`apps/api`), AI triage worker (`services/ai-triage-worker`), and SLA monitoring worker (`services/sla-worker`).
- Docker Compose configuration for local development.
- Database migrations and seed data under `db/`.
- Infrastructure-as-code assets (Bicep, Terraform, Docker) under `infra/`.
- GitHub Actions workflow for CI (lint, build, test).
- AI-powered case summarization, sentiment detection, priority classification, and suggested next-action features.
- Knowledge base search for customers before opening a support ticket.
- SLA breach detection and alerting in the agent dashboard.

### Changed

_Nothing yet._

### Fixed

_Nothing yet._

---

<!-- Add new releases above this line using the format below:

## [x.y.z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
-->
