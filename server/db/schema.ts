import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const releases = sqliteTable("releases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  status: text("status")
    .$type<"planning" | "at-risk" | "blocked" | "ready" | "shipped">()
    .notNull(),
  riskScore: integer("risk_score").notNull(),
  targetDate: integer("target_date", { mode: "timestamp_ms" }).notNull(),
  summary: text("summary").notNull(),
  scope: text("scope").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const checklistItems = sqliteTable("checklist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  releaseId: integer("release_id")
    .references(() => releases.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  assignee: text("assignee").notNull(),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const releaseTimeline = sqliteTable("release_timeline", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  releaseId: integer("release_id")
    .references(() => releases.id, { onDelete: "cascade" })
    .notNull(),
  kind: text("kind").$type<"blocker" | "note" | "status" | "decision">().notNull(),
  body: text("body").notNull(),
  actor: text("actor").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const releasesRelations = relations(releases, ({ many }) => ({
  checklist: many(checklistItems),
  timeline: many(releaseTimeline),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  release: one(releases, {
    fields: [checklistItems.releaseId],
    references: [releases.id],
  }),
}));

export const releaseTimelineRelations = relations(releaseTimeline, ({ one }) => ({
  release: one(releases, {
    fields: [releaseTimeline.releaseId],
    references: [releases.id],
  }),
}));

export type ReleaseRow = typeof releases.$inferSelect;
export type ChecklistItemRow = typeof checklistItems.$inferSelect;
export type ReleaseTimelineRow = typeof releaseTimeline.$inferSelect;
