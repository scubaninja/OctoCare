# AI Governance

## Principles

OctoCare treats AI prompts as production assets. They are:

1. **Versioned** — stored in source control alongside the code that uses them
2. **Reviewed** — changes go through pull requests with code review
3. **Tested** — evaluated against known inputs for quality and safety
4. **Governed** — access controlled, audited, and monitored

## Prompt Management

All prompts live in `.github/prompts/` and follow a consistent YAML schema:

```yaml
name: prompt-name
description: What this prompt does
model: gpt-4o
temperature: 0.3
max_tokens: 300
system: |
  System instructions...
user: |
  Template with {{variables}}...
```

## Change Process

1. Developer creates a branch and modifies a prompt
2. PR is opened — diff clearly shows what changed
3. Reviewer evaluates the prompt change for:
   - Accuracy and relevance
   - Safety (no harmful outputs)
   - Consistency with brand voice
   - Performance (token usage)
4. Automated evaluation runs against test cases
5. Merged to main → deployed with next release

## Audit Trail

- Every prompt change is tracked in git history
- AI API calls are logged with prompt version, input hash, and output
- Dashboard shows prompt usage metrics and quality scores

## Safety Guardrails

- System prompts include safety boundaries
- Output is validated before being shown to users
- Fallback to human review for low-confidence responses
- Rate limiting on AI features to prevent abuse
