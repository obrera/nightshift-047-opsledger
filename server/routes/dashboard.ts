import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { approvalDecisions, approvalRequests, deploymentWindows, ledgerItems } from "../db/schema";
import { detectWindowConflicts, isOpenStatus } from "../lib/domain";

export const dashboardRoute = new Hono().get("/", async (c) => {
  const [items, approvals, decisions, windows] = await Promise.all([
    db.select().from(ledgerItems).orderBy(desc(ledgerItems.updatedAt)),
    db.select().from(approvalRequests),
    db.select().from(approvalDecisions),
    db.select().from(deploymentWindows).orderBy(desc(deploymentWindows.startAt)),
  ]);

  const now = Date.now();
  const windowSummaries = detectWindowConflicts(windows, items);
  const openItems = items.filter((item) => isOpenStatus(item.status));
  const dueThisWeek = items.filter(
    (item) => item.dueDate && item.dueDate.getTime() - now <= 7 * 24 * 60 * 60_000 && item.dueDate.getTime() > now,
  );

  const metrics = {
    trackedItems: items.length,
    openItems: openItems.length,
    approvalsPending: approvals.filter((approval) => approval.status === "pending").length,
    windowConflicts: windowSummaries.filter((window) => window.warnings.length > 0).length,
    dueThisWeek: dueThisWeek.length,
  };

  const statusBreakdown = ["open", "planned", "in-progress", "blocked", "resolved", "closed"].map((status) => ({
    label: status,
    value: items.filter((item) => item.status === status).length,
  }));

  const priorityBreakdown = ["low", "medium", "high", "critical"].map((priority) => ({
    label: priority,
    value: items.filter((item) => item.priority === priority).length,
  }));

  const trend = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    dayStart.setUTCDate(dayStart.getUTCDate() - (6 - index));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);

    return {
      label: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      created: items.filter(
        (item) => item.createdAt.getTime() >= dayStart.getTime() && item.createdAt.getTime() < dayEnd.getTime(),
      ).length,
      decisions: decisions.filter(
        (decision) =>
          decision.decidedAt.getTime() >= dayStart.getTime() && decision.decidedAt.getTime() < dayEnd.getTime(),
      ).length,
      completed: items.filter(
        (item) =>
          (item.status === "resolved" || item.status === "closed") &&
          item.updatedAt.getTime() >= dayStart.getTime() &&
          item.updatedAt.getTime() < dayEnd.getTime(),
      ).length,
    };
  });

  const spotlight = items.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    itemType: item.itemType,
    service: item.service,
    status: item.status,
    priority: item.priority,
    owner: item.owner,
    dueDate: item.dueDate,
    pendingApprovalCount: approvals.filter((approval) => approval.itemId === item.id && approval.status === "pending").length,
  }));

  return c.json({
    metrics,
    statusBreakdown,
    priorityBreakdown,
    trend,
    spotlight,
    windows: windowSummaries.slice(0, 4),
  });
});
