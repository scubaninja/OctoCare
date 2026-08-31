---
name: implement-cross-layer-feature
description: Implement an OctoCare feature that spans web, API, database, workers, prompts, audit, or infrastructure. Use when a change crosses component boundaries or changes a shared contract.
---

# Implement Cross-Layer Feature

1. Map the user flow and every affected contract before editing.
2. Identify authorization, tenant ownership, validation, audit, privacy, SLA, and accessibility requirements.
3. Sequence database, API, worker, prompt, web, and infrastructure changes so mixed versions remain safe.
4. Reuse existing shared types and helpers; update all producers and consumers of changed fields or enums.
5. Add focused business-logic and contract tests using existing frameworks. Do not invent test infrastructure without need.
6. Validate each affected component with its repository command and exercise the end-to-end happy and failure paths.
7. Document only operationally meaningful setup, rollout, or compatibility changes.

Keep unrelated cleanup out of the change. Report assumptions and any intentionally deferred layer.
