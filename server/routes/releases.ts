import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { checklistItems, releases, releaseTimeline } from "../db/schema";

const statusEnum = z.enum(["planning", "at-risk", "blocked", "ready", "shipped"]);
const timelineKindEnum = z.enum(["blocker", "note", "status", "decision"]);

const releaseSchema = z.object({
  name: z.string().min(3),
  owner: z.string().min(2),
  status: statusEnum,
  riskScore: z.number().int().min(0).max(100),
  targetDate: z.string().datetime(),
  summary: z.string().min(12),
  scope: z.string().min(12),
});

const checklistSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  assignee: z.string().min(2),
});

const checklistUpdateSchema = z.object({
  completed: z.boolean(),
});

const timelineSchema = z.object({
  kind: timelineKindEnum,
  body: z.string().min(3),
  actor: z.string().min(2),
});

async function enrichRelease(id: number) {
  const [release] = await db.select().from(releases).where(eq(releases.id, id));
  if (!release) {
    return null;
  }

  const checklist = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.releaseId, id))
    .orderBy(asc(checklistItems.completed), asc(checklistItems.createdAt));

  const timeline = await db
    .select()
    .from(releaseTimeline)
    .where(eq(releaseTimeline.releaseId, id))
    .orderBy(desc(releaseTimeline.createdAt));

  const blockerCount = timeline.filter((item) => item.kind === "blocker").length;
  const completedItems = checklist.filter((item) => item.completed).length;
  const checklistCompletion = checklist.length ? Math.round((completedItems / checklist.length) * 100) : 0;

  return {
    ...release,
    checklist,
    timeline,
    blockerCount,
    checklistCompletion,
  };
}

export const releasesRoute = new Hono()
  .get("/", async (c) => {
    const search = c.req.query("search");
    const status = c.req.query("status");
    const owner = c.req.query("owner");
    const risk = c.req.query("risk");
    const hasBlockers = c.req.query("hasBlockers") === "true";

    const filters = [];
    if (search) {
      filters.push(like(releases.name, `%${search}%`));
    }
    if (status) {
      filters.push(eq(releases.status, status as z.infer<typeof statusEnum>));
    }
    if (owner) {
      filters.push(eq(releases.owner, owner));
    }
    if (risk === "high") {
      filters.push(sql`${releases.riskScore} >= 70`);
    } else if (risk === "medium") {
      filters.push(sql`${releases.riskScore} BETWEEN 40 AND 69`);
    } else if (risk === "low") {
      filters.push(sql`${releases.riskScore} < 40`);
    }

    const rows = await db
      .select()
      .from(releases)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(releases.targetDate), desc(releases.updatedAt));

    const checklist = await db.select().from(checklistItems);
    const timeline = await db.select().from(releaseTimeline);

    return c.json(
      rows
        .map((row) => {
          const releaseChecklist = checklist.filter((item) => item.releaseId === row.id);
          const completedItems = releaseChecklist.filter((item) => item.completed).length;
          const releaseTimelineItems = timeline.filter((item) => item.releaseId === row.id);
          const blockerCount = releaseTimelineItems.filter((item) => item.kind === "blocker").length;

          return {
            ...row,
            blockerCount,
            checklistCompletion: releaseChecklist.length
              ? Math.round((completedItems / releaseChecklist.length) * 100)
              : 0,
            openChecklistCount: releaseChecklist.filter((item) => !item.completed).length,
          };
        })
        .filter((row) => (hasBlockers ? row.blockerCount > 0 : true)),
    );
  })
  .get("/:id", async (c) => {
    const release = await enrichRelease(Number(c.req.param("id")));
    if (!release) {
      return c.json({ error: "Release not found" }, 404);
    }

    return c.json(release);
  })
  .post("/", async (c) => {
    const payload = releaseSchema.parse(await c.req.json());
    const inserted = await db
      .insert(releases)
      .values({
        ...payload,
        targetDate: new Date(payload.targetDate),
      })
      .returning({ id: releases.id });

    const releaseId = inserted[0].id;

    await db.insert(releaseTimeline).values({
      releaseId,
      kind: "status",
      body: `Release created with status ${payload.status} and risk ${payload.riskScore}.`,
      actor: payload.owner,
    });

    return c.json(await enrichRelease(releaseId), 201);
  })
  .put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const payload = releaseSchema.parse(await c.req.json());
    const current = await enrichRelease(id);

    if (!current) {
      return c.json({ error: "Release not found" }, 404);
    }

    await db
      .update(releases)
      .set({
        ...payload,
        targetDate: new Date(payload.targetDate),
        updatedAt: new Date(),
      })
      .where(eq(releases.id, id));

    const timelineEntries = [];
    if (current.status !== payload.status) {
      timelineEntries.push({
        releaseId: id,
        kind: "status" as const,
        body: `Status changed from ${current.status} to ${payload.status}.`,
        actor: payload.owner,
      });
    }
    if (current.owner !== payload.owner) {
      timelineEntries.push({
        releaseId: id,
        kind: "decision" as const,
        body: `Owner changed from ${current.owner} to ${payload.owner}.`,
        actor: payload.owner,
      });
    }
    if (current.riskScore !== payload.riskScore) {
      timelineEntries.push({
        releaseId: id,
        kind: "note" as const,
        body: `Risk score adjusted from ${current.riskScore} to ${payload.riskScore}.`,
        actor: payload.owner,
      });
    }

    timelineEntries.push({
      releaseId: id,
      kind: "note" as const,
      body: "Release details updated.",
      actor: payload.owner,
    });

    await db.insert(releaseTimeline).values(timelineEntries);

    return c.json(await enrichRelease(id));
  })
  .post("/:id/checklist", async (c) => {
    const releaseId = Number(c.req.param("id"));
    const payload = checklistSchema.parse(await c.req.json());
    const current = await enrichRelease(releaseId);

    if (!current) {
      return c.json({ error: "Release not found" }, 404);
    }

    await db.insert(checklistItems).values({ releaseId, ...payload });
    await db
      .insert(releaseTimeline)
      .values({
        releaseId,
        kind: "note",
        body: `Checklist item added: ${payload.title}.`,
        actor: payload.assignee,
      });
    await db.update(releases).set({ updatedAt: new Date() }).where(eq(releases.id, releaseId));

    return c.json(await enrichRelease(releaseId), 201);
  })
  .patch("/:id/checklist/:itemId", async (c) => {
    const releaseId = Number(c.req.param("id"));
    const itemId = Number(c.req.param("itemId"));
    const payload = checklistUpdateSchema.parse(await c.req.json());
    const current = await enrichRelease(releaseId);

    if (!current) {
      return c.json({ error: "Release not found" }, 404);
    }

    const item = current.checklist.find((entry) => entry.id === itemId);
    if (!item) {
      return c.json({ error: "Checklist item not found" }, 404);
    }

    await db
      .update(checklistItems)
      .set({
        completed: payload.completed,
        completedAt: payload.completed ? new Date() : null,
      })
      .where(eq(checklistItems.id, itemId));

    await db.insert(releaseTimeline).values({
      releaseId,
      kind: "note",
      body: `${payload.completed ? "Completed" : "Re-opened"} checklist item: ${item.title}.`,
      actor: item.assignee,
    });
    await db.update(releases).set({ updatedAt: new Date() }).where(eq(releases.id, releaseId));

    return c.json(await enrichRelease(releaseId));
  })
  .post("/:id/timeline", async (c) => {
    const releaseId = Number(c.req.param("id"));
    const payload = timelineSchema.parse(await c.req.json());
    const current = await enrichRelease(releaseId);

    if (!current) {
      return c.json({ error: "Release not found" }, 404);
    }

    await db.insert(releaseTimeline).values({ releaseId, ...payload });
    await db.update(releases).set({ updatedAt: new Date() }).where(eq(releases.id, releaseId));

    return c.json(await enrichRelease(releaseId), 201);
  });
