# ReleaseBridge

ReleaseBridge is Nightshift build 046: a backend-first Bun + Hono + React release readiness cockpit for small teams. It runs as a single container, persists release state in SQLite via Drizzle, and serves both the API and frontend from one Bun process.

## Stack

- TypeScript
- Bun
- Hono backend
- React + Vite frontend
- Tailwind CSS dark UI
- SQLite persistence via Drizzle ORM
- Single-container deployment serving API + frontend on one domain

## Capabilities

- Create and update release entries with target date, owner, status, risk score, summary, and scope.
- Track checklist items per release with completion state, assignee ownership, and progress percentages.
- Maintain a blockers and notes timeline feed with status changes and decisions attached to each release.
- Review dashboard metrics and filter the board by search, status, owner, risk band, and blocker presence.

## Local development

```bash
bun install
bun run dev
```

The application listens on `http://localhost:3000`.

## Local build verification

```bash
bun install
bun run build
```

## Container

```bash
docker compose up --build
```

This serves the frontend and API from the same Bun process on port `3000`.

## Deployment metadata

- GitHub repo target: `https://github.com/obrera/nightshift-046-releasebridge`
- Intended live URL: `https://releasebridge046.colmena.dev`
- Intended Dokploy source: `github / obrera / nightshift-046-releasebridge / main / ./docker-compose.yml`
- Current remote status: blocked in this environment. `gh repo view obrera/nightshift-046-releasebridge` failed with `error connecting to api.github.com`, `gh auth status` reports the saved GitHub token is invalid, direct `git push -u origin main` failed with `Could not resolve host: github.com`, and `XDG_CACHE_HOME=/tmp/dokploy-cache dokploy verify` failed with `getaddrinfo EAI_AGAIN ship.colmena.dev`.

## Repository contents

- [`server/index.ts`](/home/obrera/projects/nightshift-046-releasebridge/server/index.ts): Hono server bootstrap and static asset serving.
- [`server/routes/releases.ts`](/home/obrera/projects/nightshift-046-releasebridge/server/routes/releases.ts): release CRUD, checklist, and timeline endpoints.
- [`server/routes/dashboard.ts`](/home/obrera/projects/nightshift-046-releasebridge/server/routes/dashboard.ts): readiness metrics and spotlight feed.
- [`client/src/App.tsx`](/home/obrera/projects/nightshift-046-releasebridge/client/src/App.tsx): release board, filters, checklist workspace, and timeline UI.

## License

MIT
