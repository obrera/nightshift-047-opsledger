import { desc, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { checklistItems, releases, releaseTimeline } from "../db/schema";

export const dashboardRoute = new Hono().get("/", async (c) => {
  const releaseRows = await db.select().from(releases).orderBy(desc(releases.updatedAt));
  const checklistRows = await db.select().from(checklistItems);
  const timelineRows = await db.select().from(releaseTimeline).orderBy(desc(releaseTimeline.createdAt));
  const now = Date.now();

  const completedItems = checklistRows.filter((row) => row.completed).length;
  const checklistCompletion = checklistRows.length ? Math.round((completedItems / checklistRows.length) * 100) : 0;
  const blockersByRelease = new Map<number, number>();

  for (const row of timelineRows) {
    if (row.kind === "blocker") {
      blockersByRelease.set(row.releaseId, (blockersByRelease.get(row.releaseId) ?? 0) + 1);
    }
  }

  const metrics = {
    total: releaseRows.length,
    ready: releaseRows.filter((row) => row.status === "ready").length,
    blocked: releaseRows.filter((row) => row.status === "blocked").length,
    highRisk: releaseRows.filter((row) => row.riskScore >= 70).length,
    dueSoon: releaseRows.filter((row) => row.targetDate.getTime() - now <= 48 * 60 * 60_000).length,
    checklistCompletion,
  };

  const owners = await db
    .select({
      owner: releases.owner,
      count: sql<number>`count(*)`,
    })
    .from(releases)
    .groupBy(releases.owner);

  const spotlight = releaseRows.slice(0, 5).map((row) => ({
    id: row.id,
    name: row.name,
    owner: row.owner,
    status: row.status,
    riskScore: row.riskScore,
    targetDate: row.targetDate,
    blockerCount: blockersByRelease.get(row.id) ?? 0,
  }));

  return c.json({
    metrics,
    owners,
    spotlight,
  });
});
