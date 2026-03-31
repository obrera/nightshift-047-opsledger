# BUILDLOG

## Metadata

- Project: ReleaseBridge
- Build: Nightshift 046
- Repository path: `/home/obrera/projects/nightshift-046-releasebridge`
- Primary stack: TypeScript, Bun, Hono, React, Vite, Tailwind, SQLite, Drizzle
- Model: `openai-codex/gpt-5.3-codex`
- Reasoning: `off`
- Target deployment: Dokploy
- Intended domain: `https://releasebridge046.colmena.dev`

## UTC Log

- 2026-03-31T00:00:00Z Audited the copied Nightshift 045 scaffold and identified lingering `incidentdesk` naming, incident-specific schema, and stale deployment metadata.
- 2026-03-31T00:07:00Z Replaced the backend data model with release records, checklist items, and a blockers/notes timeline feed backed by SQLite and Drizzle.
- 2026-03-31T00:15:00Z Reworked the Hono API to expose release CRUD, nested checklist/timeline actions, and dashboard metrics for readiness, risk, blockers, and due-soon views.
- 2026-03-31T00:24:00Z Rebuilt the React frontend as ReleaseBridge with a dark release board, filters, release editor, checklist management, and timeline composer.
- 2026-03-31T00:30:00Z Updated package naming, container metadata, SQLite filenames, README, and deployment target references for `nightshift-046-releasebridge`.
- 2026-03-31T00:34:00Z `bun run build` initially failed on a TypeScript deprecation error caused by `baseUrl` in `tsconfig.json`; removed the deprecated option and reran verification.
- 2026-03-31T00:42:00Z `bun install` initially failed with `AccessDenied accessing temporary directory`; reran successfully with `TMPDIR=/tmp/bun-tmp BUN_TMPDIR=/tmp/bun-tmp BUN_INSTALL=/tmp/bun-install`.
- 2026-03-31T00:44:00Z Verified `bun install` succeeds and `bun run build` completes successfully, producing frontend assets in `dist/public` and a bundled server in `dist/server.js`.
- 2026-03-31T00:49:00Z Attempted GitHub delivery checks. `gh repo view obrera/nightshift-046-releasebridge` failed with `error connecting to api.github.com`, and `gh auth status` reported the configured token for `obrera` is invalid.
- 2026-03-31T00:53:00Z Attempted Dokploy verification using the existing local CLI configuration. `dokploy verify` failed with `getaddrinfo EAI_AGAIN ship.colmena.dev` and then a local cache write error at `/home/obrera/.cache/dokploy`, so automated deployment could not be completed from this session.
- 2026-03-31T01:02:00Z Added `origin` as `https://github.com/obrera/nightshift-046-releasebridge.git` and attempted `git push -u origin main`; push failed with `Could not resolve host: github.com`.
- 2026-03-31T01:05:00Z Reran Dokploy verification with `XDG_CACHE_HOME=/tmp/dokploy-cache` to remove local cache permission noise. Verification still failed with `getaddrinfo EAI_AGAIN ship.colmena.dev`, confirming the deployment blocker is unresolved network access to the Dokploy host.
