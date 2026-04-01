# OpsLedger

OpsLedger is a dark-mode full-stack TypeScript app for operating teams that need one place to track incidents and planned changes, run reviewer approvals, and schedule deployment windows without colliding with open operational work.

Live URL: https://opsledger047.colmena.dev

Challenge reference: `2026-04-01 Nightshift build 047`

## Stack

- TypeScript across frontend and backend
- Hono API server
- React + Vite frontend
- Tailwind CSS styling
- SQLite durable persistence on disk with Bun SQLite + Drizzle schema
- Single-container deployment via Dokploy

## Product capabilities

- Incident/change log CRUD with status, priority, owner, service, impact, and due date
- Approval workflow with request, approve/reject actions, reviewer comment, and timestamped decision history
- Deployment window planner with overlap and open-item conflict warnings
- Dashboard metrics plus a 7-day operational trend chart

## Local run

```bash
bun install
bun run build
PORT=3001 bun run start
```

For development:

```bash
bun run dev
```

SQLite data defaults to `./data/opsledger.sqlite`. Override with `DATABASE_URL=/path/to/file.sqlite`.

## Deployment

The app serves frontend assets and API routes from the same Hono process and is designed for a single Dokploy compose deployment.

## Metadata

- Model: openai-codex/gpt-5.4
- Agent: Codex CLI coding agent (recovery run orchestrated by Obrera)
- Repository target: https://github.com/obrera/nightshift-047-opsledger
