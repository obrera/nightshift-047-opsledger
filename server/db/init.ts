import { count } from "drizzle-orm";
import { db, sqlite } from "./client";
import { approvalDecisions, approvalRequests, deploymentWindows, ledgerItems } from "./schema";

const createSql = `
CREATE TABLE IF NOT EXISTS ledger_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  service TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_date INTEGER,
  impact_summary TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE IF NOT EXISTS approval_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES ledger_items(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL,
  status TEXT NOT NULL,
  latest_comment TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE IF NOT EXISTS approval_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  approval_id INTEGER NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL,
  decision TEXT NOT NULL,
  comment TEXT,
  decided_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE IF NOT EXISTS deployment_windows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  environment TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL,
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  notes TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
`;

export async function initializeDatabase() {
  sqlite.exec(createSql);

  const existing = await db.select({ value: count() }).from(ledgerItems);
  if (existing[0]?.value) {
    return;
  }

  const now = Date.now();
  const insertedItems = await db
    .insert(ledgerItems)
    .values([
      {
        itemType: "incident",
        title: "Identity API latency breach",
        service: "auth-gateway",
        description:
          "P95 latency exceeded the 800ms threshold after the overnight cache eviction policy changed and retry pressure increased.",
        status: "blocked",
        priority: "critical",
        owner: "Nadia",
        dueDate: new Date(now + 10 * 60 * 60_000),
        impactSummary: "Login failures peaked at 4.8% across EU tenants.",
      },
      {
        itemType: "change",
        title: "Ledger shard rebalance",
        service: "billing-ledger",
        description:
          "Move hot tenants to the secondary shard set and apply the queue throughput patch before quarter-close traffic ramps.",
        status: "planned",
        priority: "high",
        owner: "Jonas",
        dueDate: new Date(now + 36 * 60 * 60_000),
        impactSummary: "Expected to reduce write contention during settlement windows.",
      },
      {
        itemType: "incident",
        title: "Warehouse export mismatch",
        service: "analytics-pipeline",
        description:
          "Nightly export dropped three partner accounts when the schema mapper hit an unmapped enum variant.",
        status: "open",
        priority: "medium",
        owner: "Priya",
        dueDate: new Date(now + 72 * 60 * 60_000),
        impactSummary: "Delayed morning reporting pack for finance operations.",
      },
      {
        itemType: "change",
        title: "Production feature flag cleanup",
        service: "ops-console",
        description:
          "Retire legacy rollout flags and align config ownership ahead of the April service freeze.",
        status: "in-progress",
        priority: "low",
        owner: "Mina",
        dueDate: new Date(now + 120 * 60 * 60_000),
        impactSummary: "Reduces operator confusion and shrinks config surface area.",
      },
    ])
    .returning({ id: ledgerItems.id });

  const [identity, rebalance, warehouse] = insertedItems;

  const insertedApprovals = await db
    .insert(approvalRequests)
    .values([
      {
        itemId: identity.id,
        reviewer: "Soren",
        status: "rejected",
        latestComment: "Rollback plan needs a tenant communication path.",
        updatedAt: new Date(now - 70 * 60_000),
      },
      {
        itemId: rebalance.id,
        reviewer: "Amara",
        status: "pending",
        latestComment: "Waiting on shard drift validation.",
      },
      {
        itemId: rebalance.id,
        reviewer: "Devon",
        status: "approved",
        latestComment: "Runbook and rollback checkpoints look good.",
        updatedAt: new Date(now - 2 * 60 * 60_000),
      },
      {
        itemId: warehouse.id,
        reviewer: "Iris",
        status: "pending",
        latestComment: "Need partner export sample before sign-off.",
      },
    ])
    .returning({ id: approvalRequests.id });

  await db.insert(approvalDecisions).values([
    {
      approvalId: insertedApprovals[0].id,
      reviewer: "Soren",
      decision: "requested",
      comment: "Emergency mitigation submitted for review.",
      decidedAt: new Date(now - 3 * 60 * 60_000),
    },
    {
      approvalId: insertedApprovals[0].id,
      reviewer: "Soren",
      decision: "rejected",
      comment: "Rollback plan needs a tenant communication path.",
      decidedAt: new Date(now - 70 * 60 * 60_000),
    },
    {
      approvalId: insertedApprovals[1].id,
      reviewer: "Amara",
      decision: "requested",
      comment: "Waiting on shard drift validation.",
      decidedAt: new Date(now - 90 * 60 * 60_000),
    },
    {
      approvalId: insertedApprovals[2].id,
      reviewer: "Devon",
      decision: "requested",
      comment: "Preflight check attached.",
      decidedAt: new Date(now - 5 * 60 * 60_000),
    },
    {
      approvalId: insertedApprovals[2].id,
      reviewer: "Devon",
      decision: "approved",
      comment: "Runbook and rollback checkpoints look good.",
      decidedAt: new Date(now - 2 * 60 * 60_000),
    },
    {
      approvalId: insertedApprovals[3].id,
      reviewer: "Iris",
      decision: "requested",
      comment: "Need partner export sample before sign-off.",
      decidedAt: new Date(now - 30 * 60 * 60_000),
    },
  ]);

  await db.insert(deploymentWindows).values([
    {
      title: "Identity cache rollback window",
      environment: "production",
      owner: "Nadia",
      status: "planned",
      startAt: new Date(now + 2 * 60 * 60_000),
      endAt: new Date(now + 4 * 60 * 60_000),
      notes: "Emergency rollback candidate if latency stays above SLO through the next hour.",
    },
    {
      title: "Shard rebalance wave A",
      environment: "production",
      owner: "Jonas",
      status: "approved",
      startAt: new Date(now + 26 * 60 * 60_000),
      endAt: new Date(now + 30 * 60 * 60_000),
      notes: "Customer-impacting write drain with finance war room on standby.",
    },
    {
      title: "Warehouse mapping hotfix",
      environment: "staging",
      owner: "Priya",
      status: "planned",
      startAt: new Date(now + 28 * 60 * 60_000),
      endAt: new Date(now + 32 * 60 * 60_000),
      notes: "Stage validation overlaps rebalance dry-run by design to compare throughput.",
    },
  ]);
}
