import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ledgerItems = sqliteTable("ledger_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemType: text("item_type").$type<"incident" | "change">().notNull(),
  title: text("title").notNull(),
  service: text("service").notNull(),
  description: text("description").notNull(),
  status: text("status")
    .$type<"open" | "planned" | "in-progress" | "blocked" | "resolved" | "closed">()
    .notNull(),
  priority: text("priority").$type<"low" | "medium" | "high" | "critical">().notNull(),
  owner: text("owner").notNull(),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  impactSummary: text("impact_summary").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const approvalRequests = sqliteTable("approval_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id")
    .references(() => ledgerItems.id, { onDelete: "cascade" })
    .notNull(),
  reviewer: text("reviewer").notNull(),
  status: text("status").$type<"pending" | "approved" | "rejected">().notNull(),
  latestComment: text("latest_comment"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const approvalDecisions = sqliteTable("approval_decisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  approvalId: integer("approval_id")
    .references(() => approvalRequests.id, { onDelete: "cascade" })
    .notNull(),
  reviewer: text("reviewer").notNull(),
  decision: text("decision").$type<"requested" | "approved" | "rejected">().notNull(),
  comment: text("comment"),
  decidedAt: integer("decided_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const deploymentWindows = sqliteTable("deployment_windows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  environment: text("environment").$type<"production" | "staging" | "sandbox">().notNull(),
  owner: text("owner").notNull(),
  status: text("status")
    .$type<"planned" | "approved" | "active" | "completed" | "cancelled">()
    .notNull(),
  startAt: integer("start_at", { mode: "timestamp_ms" }).notNull(),
  endAt: integer("end_at", { mode: "timestamp_ms" }).notNull(),
  notes: text("notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const ledgerItemsRelations = relations(ledgerItems, ({ many }) => ({
  approvals: many(approvalRequests),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  item: one(ledgerItems, {
    fields: [approvalRequests.itemId],
    references: [ledgerItems.id],
  }),
  decisions: many(approvalDecisions),
}));

export const approvalDecisionsRelations = relations(approvalDecisions, ({ one }) => ({
  approval: one(approvalRequests, {
    fields: [approvalDecisions.approvalId],
    references: [approvalRequests.id],
  }),
}));

export type LedgerItemRow = typeof ledgerItems.$inferSelect;
export type ApprovalRequestRow = typeof approvalRequests.$inferSelect;
export type ApprovalDecisionRow = typeof approvalDecisions.$inferSelect;
export type DeploymentWindowRow = typeof deploymentWindows.$inferSelect;
