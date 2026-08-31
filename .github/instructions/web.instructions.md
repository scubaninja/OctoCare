---
applyTo: "apps/web/**"
description: Next.js and TypeScript guidance for the OctoCare customer portal and agent dashboard.
---

# Web application

- Follow the existing Next.js 14 App Router structure and TypeScript conventions.
- Prefer server components unless browser state, effects, or event handlers require a client component.
- Keep API access in the existing `src/lib` boundary and preserve shared types and normalization behavior.
- Represent loading, empty, error, and retry states explicitly for network-backed screens.
- Do not expose internal API URLs, secrets, stack traces, or privileged case data to the browser.
- Meet WCAG 2.2 AA for forms and workflows: semantic controls, visible focus, keyboard operation, associated errors, meaningful labels, and sufficient contrast.
- Customer views must not expose other customers' case data; UI filtering is not an authorization control.
- Run `npm run lint` and `npm run build` from `apps/web/`.
