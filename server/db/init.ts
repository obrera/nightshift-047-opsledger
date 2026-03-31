import { count, eq } from "drizzle-orm";
import { db, sqlite } from "./client";
import { checklistItems, releases, releaseTimeline } from "./schema";

const createSql = `
CREATE TABLE IF NOT EXISTS releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  target_date INTEGER NOT NULL,
  summary TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE IF NOT EXISTS checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  assignee TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  completed_at INTEGER
);
CREATE TABLE IF NOT EXISTS release_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  body TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
`;

export async function initializeDatabase() {
  sqlite.exec(createSql);

  const existing = await db.select({ value: count() }).from(releases);
  if (existing[0]?.value) {
    return;
  }

  const now = Date.now();
  const seeded = await db
    .insert(releases)
    .values([
      {
        name: "ReleaseBridge 0.46.0",
        owner: "Avery",
        status: "ready",
        riskScore: 28,
        targetDate: new Date(now + 36 * 60 * 60_000),
        summary: "Core release cockpit launch with hardened single-container delivery.",
        scope: "Backend API, dashboard metrics, release detail workflow, documentation.",
      },
      {
        name: "Mobile SDK 3.8.0",
        owner: "Noah",
        status: "blocked",
        riskScore: 81,
        targetDate: new Date(now + 20 * 60 * 60_000),
        summary: "Payments SDK patch with Android signing changes and crash fix validation.",
        scope: "Android package signing, QA matrix, partner handoff, staged rollout plan.",
      },
      {
        name: "Ops Console 2.3.1",
        owner: "Mina",
        status: "at-risk",
        riskScore: 63,
        targetDate: new Date(now + 72 * 60 * 60_000),
        summary: "Operational fixes queued behind analytics schema verification.",
        scope: "Dashboard patch, warehouse migration check, release notes, support briefing.",
      },
    ])
    .returning({ id: releases.id });

  const [bridge, sdk, ops] = seeded;

  await db.insert(checklistItems).values([
    { releaseId: bridge.id, title: "Approve production changelog", category: "comms", assignee: "Avery", completed: true, completedAt: new Date(now - 2 * 60 * 60_000) },
    { releaseId: bridge.id, title: "Verify container smoke test", category: "qa", assignee: "Jules", completed: true, completedAt: new Date(now - 90 * 60_000) },
    { releaseId: bridge.id, title: "Schedule customer announcement", category: "launch", assignee: "Mina", completed: false },
    { releaseId: sdk.id, title: "Collect Play signing artifact", category: "compliance", assignee: "Noah", completed: false },
    { releaseId: sdk.id, title: "Run regression suite on Android 15", category: "qa", assignee: "Kai", completed: false },
    { releaseId: sdk.id, title: "Confirm rollback package", category: "ops", assignee: "Avery", completed: true, completedAt: new Date(now - 4 * 60 * 60_000) },
    { releaseId: ops.id, title: "Validate analytics migration dry run", category: "data", assignee: "Mina", completed: false },
    { releaseId: ops.id, title: "Review release notes", category: "comms", assignee: "Sam", completed: true, completedAt: new Date(now - 3 * 60 * 60_000) },
  ]);

  await db.insert(releaseTimeline).values([
    { releaseId: bridge.id, kind: "status", body: "Readiness review passed. Waiting on customer-facing announcement window.", actor: "Avery" },
    { releaseId: bridge.id, kind: "note", body: "Smoke test container serves API and frontend from the same Bun process.", actor: "Jules" },
    { releaseId: sdk.id, kind: "blocker", body: "Signing service token rotation broke the Android publish job.", actor: "Noah" },
    { releaseId: sdk.id, kind: "decision", body: "Hold release until replacement signing token is validated in staging.", actor: "Release Council" },
    { releaseId: ops.id, kind: "note", body: "Warehouse schema drift found in preflight checks.", actor: "Mina" },
  ]);

  await db.update(releases).set({ updatedAt: new Date() }).where(eq(releases.id, bridge.id));
}
