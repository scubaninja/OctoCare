---
name: review-ai-prompt-change
description: Review OctoCare prompt changes for safety, privacy, injection resistance, output-contract compatibility, quality, and auditability. Use when prompts, model settings, prompt callers, or AI output parsing change.
---

# Review AI Prompt Change

1. Identify the prompt, callers, template variables, output consumers, and model configuration.
2. Check whether untrusted customer content can override system instructions or escape its intended data boundary.
3. Check for unnecessary PII, secrets, internal instructions, unsupported claims, and unsafe customer-facing output.
4. Verify output values and formats match API enums, parsers, persistence, and UI expectations.
5. Test missing, malformed, contradictory, adversarial, and unusually long input.
6. Require stable evaluations for accuracy, privacy, bias, injection resistance, and fallback behavior.
7. Verify audit data identifies the prompt and model configuration without retaining sensitive raw content.

Report blocking issues first, followed by compatibility risks, missing evaluations, and concrete remediations. Do not rely on exact wording tests unless wording is itself contractual.
