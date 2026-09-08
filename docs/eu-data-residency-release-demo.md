# GitHub EU Data Residency Release Demo

## Audience and outcome

This 25-minute workflow shows enterprise customers how recent GitHub releases combine governance, developer productivity, code quality, and measurable Copilot adoption while keeping Copilot inference processing and associated data within the EU Data Boundary.

The demo uses a GitHub Enterprise Cloud with data residency tenant. GitHub's EU region includes EU member states and EFTA countries. Copilot data residency is opt-in, and data-resident model requests have a 10% higher model multiplier.

## Prerequisites

Prepare these items before the customer session:

1. Use a repository in the customer's `.ghe.com` demo tenant with GitHub Code Quality, GitHub Code Security, Dependabot alerts, Copilot code review, and Copilot usage metrics enabled.
2. Create an issue for the OctoCare photo-upload feature and set the default `Priority`, `Effort`, `Start date`, and `Target date` issue fields.
3. Open a pull request that changes normal application code and a path configured in Copilot content exclusions. Include a small maintainability issue that Code Quality can identify.
4. Keep at least one open Dependabot alert that can be assigned to Copilot for remediation.
5. Configure an enterprise-managed default model that is available in the EU region. Recently released models can take additional time to reach data-resident regions, and Gemini models were not supported at the April 2026 data residency launch.
6. To include live Copilot usage data, add a `COPILOT_METRICS_TOKEN` Actions secret. Use a token that can view organization Copilot metrics (`read:org`) or enterprise Copilot metrics (`read:enterprise` or `manage_billing:copilot`). Enable the **Copilot usage metrics** policy everywhere. The rest of the workflow can run without this secret.

Do not use production secrets or customer data in the demo repository.

## Run of show

### 1. Establish the EU governance boundary (2 minutes)

Open the enterprise Copilot policies and show that EU data residency is enabled.

Explain that generally available Copilot features, including chat, inline suggestions, agent mode, Copilot CLI, cloud agent, pull request summaries, and code review, use data-resident model endpoints when the policy is enabled.

**Customer message:** Residency is a platform policy, not a developer-by-developer convention.

### 2. Plan work with issue fields (3 minutes)

Open the prepared OctoCare feature issue. Show `Priority`, `Effort`, `Start date`, and `Target date` on the issue and repository issue list. Change `Priority` to `High`, then filter or sort the issue list by the field.

Point out that issue fields are typed organization metadata rather than labels, are available in public projects with visibility controls, and can be read or updated through GitHub's MCP server.

**Customer message:** Planning metadata is consistent and reportable across repositories and projects.

### 3. Govern the enterprise default model (3 minutes)

Open the enterprise-managed settings used by the Copilot app, Copilot CLI, and Visual Studio Code. Show the configured `model` default and, if prepared, a team mapping that overrides it for one enterprise team.

Explain that the selected model must also be allowed by enterprise policy and available in the EU region. Users outside a team override inherit the enterprise default.

**Customer message:** Administrators can standardize the starting model while allowing intentional team-level variation.

### 4. Review code without crossing content boundaries (4 minutes)

Open the prepared pull request and request a Copilot code review. Show useful feedback on normal application code, then show that the configured excluded path is not used by Copilot code review.

Open the repository, organization, or enterprise content exclusion setting that defines the path rule. Mention that Copilot code review now honors exclusions at all three levels.

If runner controls are part of the customer's governance story, show the organization-level Copilot runner type and whether repositories can override it.

**Customer message:** AI review can be broadly useful while sensitive or irrelevant paths remain outside its context.

### 5. Move from individual findings to code quality trends (4 minutes)

Open the pull request's Code Quality result and show the maintainability or reliability finding and its Copilot Autofix suggestion. Then open the organization Code Quality dashboard's **Trends** tab.

Switch between 7-, 14-, and 30-day views, group by severity or health score, and identify one improving repository and one repository that needs attention.

In Actions, show that Code Quality analysis appears under `dynamic/github-code-quality/codeql` with the `github-code-quality` actor. Explain that this separate path makes workflow history, integrations, usage reports, and billing filters distinguish Code Quality from code scanning.

**Customer message:** Teams can fix a finding in the pull request while leaders track whether quality is improving across the organization.

### 6. Put a Dependabot alert into action (4 minutes)

Open a prepared Dependabot alert and select **Assign to Agent**, then choose Copilot. Explain that the agent analyzes the advisory and dependency usage, opens a draft pull request, and attempts to resolve test failures caused by the update.

Show the draft pull request if it has already completed. Emphasize that the agent's changes still require normal review and testing.

Then run the **EU Data Residency Release Demo** workflow. Its `GITHUB_TOKEN` receives only `vulnerability-alerts: read`, and the workflow summary displays up to 100 open alerts by severity.

**Customer message:** Dependabot identifies risk, Copilot can propose complex remediation, and Actions can report alerts with least-privilege access.

### 7. Output Copilot usage metrics (5 minutes)

In the workflow dispatch form:

1. The default `skip` scope completes the release and Dependabot demonstration without requiring a metrics token.
2. For live usage data, select `organization` to report on the repository owner, or select `enterprise` and enter the enterprise slug.
3. Run the workflow.
4. Open the job summary and show daily, weekly, and monthly active users; user interactions; generations; acceptances; lines added; and pull requests reviewed by Copilot.
5. Download the seven-day artifact containing the source NDJSON partitions and `latest-day.json`.

The workflow uses `${{ github.api_url }}`, so requests resolve to the API host for the current GitHub tenant rather than hard-coding `api.github.com`. The metrics token is separate from `GITHUB_TOKEN` because organization and enterprise reporting requires an authorized administrative or custom metrics role.

**Customer message:** Adoption and impact can be measured through governed APIs and fed into the customer's reporting platform.

## Close

Connect the flow back to one operating model:

- EU data residency and model policy establish the AI boundary.
- Issue fields make planned work structured and visible.
- Copilot code review and content exclusions combine assistance with control.
- Code Quality findings, trends, and Actions identities make quality actionable and measurable.
- Dependabot, Copilot, and Actions move from alert to reviewed remediation.
- Copilot usage metrics show adoption and engineering activity without relying on anecdotes.

## Release references

- [Copilot data residency for US and EU](https://github.blog/changelog/2026-04-13-copilot-data-residency-in-us-eu-and-fedramp-compliance-now-available/)
- [Issue fields generally available](https://github.blog/changelog/2026-07-02-issue-fields-are-now-generally-available/)
- [Copilot code review configurations and content exclusion controls](https://github.blog/changelog/2026-06-12-copilot-code-review-new-configurations-and-controls/)
- [Enterprise-managed settings support any default model](https://github.blog/changelog/2026-09-02-enterprise-managed-settings-support-any-default-model/)
- [GitHub Code Quality generally available](https://github.blog/changelog/2026-07-20-github-code-quality-is-now-generally-available/)
- [Organization Code Quality trends](https://github.blog/changelog/2026-08-19-track-organization-code-quality-trends/)
- [Separate Actions path for GitHub Code Quality](https://github.blog/changelog/2026-08-20-separate-github-actions-path-for-github-code-quality/)
- [Dependabot alerts assignable to AI agents](https://github.blog/changelog/2026-04-07-dependabot-alerts-are-now-assignable-to-ai-agents-for-remediation/)
- [Actions `vulnerability-alerts` permission](https://github.blog/changelog/2026-09-03-github-actions-early-september-2026-updates/)
- [REST API endpoints for Copilot usage metrics](https://docs.github.com/en/enterprise-cloud@latest/rest/copilot/copilot-usage-metrics)
- [Copilot usage metrics field reference](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-usage-metrics/copilot-usage-metrics)
