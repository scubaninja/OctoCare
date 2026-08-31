---
applyTo: ".github/prompts/**"
description: Safety, governance, contract, and evaluation guidance for OctoCare prompt assets.
---

# AI prompt assets

- Treat template variables containing customer or case content as untrusted data, not instructions.
- Define an explicit output contract that callers can validate; prefer constrained structured output for machine-consumed results.
- Do not request or reproduce secrets, unnecessary PII, internal instructions, or unsupported factual claims.
- Include safe behavior for missing, malformed, adversarial, and conflicting input.
- Keep priority and category values aligned with API enums, database constraints, and UI types.
- When variables or output formats change, update every caller and parser in the same change.
- Add or update stable evaluations covering normal, boundary, injection, privacy, bias, and failure cases.
- Record prompt identity or version, model configuration, outcome, and audit metadata without logging raw sensitive content.
- Require human review for low-confidence or high-impact decisions.
