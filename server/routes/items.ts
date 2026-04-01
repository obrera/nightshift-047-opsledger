import { asc, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { approvalDecisions, approvalRequests, ledgerItems } from "../db/schema";
import { summarizeApprovals } from "../lib/domain";

const itemTypeEnum = z.enum(["incident", "change"]);
const statusEnum = z.enum(["open", "planned", "in-progress", "blocked", "resolved", "closed"]);
const priorityEnum = z.enum(["low", "medium", "high", "critical"]);
const approvalStatusEnum = z.enum(["approved", "rejected"]);

const itemSchema = z.object({
  itemType: itemTypeEnum,
  title: z.string().min(4),
  service: z.string().min(2),
  description: z.string().min(12),
  status: statusEnum,
  priority: priorityEnum,
  owner: z.string().min(2),
  dueDate: z.string().datetime().nullable(),
  impactSummary: z.string().min(8),
});

const approvalRequestSchema = z.object({
  reviewer: z.string().min(2),
  comment: z.string().min(3),
});

const approvalDecisionSchema = z.object({
  decision: approvalStatusEnum,
  reviewer: z.string().min(2),
  comment: z.string().min(3),
});

async function enrichItem(id: number) {
  const [item] = await db.select().from(ledgerItems).where(eq(ledgerItems.id, id));
  if (!item) {
    return null;
  }

  const approvals = await db
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.itemId, id))
    .orderBy(desc(approvalRequests.updatedAt));
  const decisions = await db
    .select()
    .from(approvalDecisions)
    .orderBy(desc(approvalDecisions.decidedAt));
  const approvalSummary = summarizeApprovals(approvals, decisions, id);

  return {
    ...item,
    ...approvalSummary,
  };
}

export const itemsRoute = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(ledgerItems).orderBy(asc(ledgerItems.dueDate), desc(ledgerItems.updatedAt));
    const approvals = await db.select().from(approvalRequests);
    const decisions = await db.select().from(approvalDecisions);

    return c.json(
      rows.map((item) => {
        const approvalSummary = summarizeApprovals(approvals, decisions, item.id);
        return {
          ...item,
          pendingApprovalCount: approvalSummary.pendingApprovalCount,
          lastDecisionAt: approvalSummary.lastDecisionAt,
        };
      }),
    );
  })
  .get("/:id", async (c) => {
    const item = await enrichItem(Number(c.req.param("id")));
    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }
    return c.json(item);
  })
  .post("/", async (c) => {
    const payload = itemSchema.parse(await c.req.json());
    const inserted = await db
      .insert(ledgerItems)
      .values({
        ...payload,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      })
      .returning({ id: ledgerItems.id });
    return c.json(await enrichItem(inserted[0].id), 201);
  })
  .put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const current = await enrichItem(id);
    if (!current) {
      return c.json({ error: "Item not found" }, 404);
    }
    const payload = itemSchema.parse(await c.req.json());
    await db
      .update(ledgerItems)
      .set({
        ...payload,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(ledgerItems.id, id));
    return c.json(await enrichItem(id));
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    await db.delete(ledgerItems).where(eq(ledgerItems.id, id));
    return c.json({ ok: true });
  })
  .post("/:id/approvals", async (c) => {
    const itemId = Number(c.req.param("id"));
    const payload = approvalRequestSchema.parse(await c.req.json());
    const current = await enrichItem(itemId);
    if (!current) {
      return c.json({ error: "Item not found" }, 404);
    }

    const inserted = await db
      .insert(approvalRequests)
      .values({
        itemId,
        reviewer: payload.reviewer,
        status: "pending",
        latestComment: payload.comment,
      })
      .returning({ id: approvalRequests.id });

    await db.insert(approvalDecisions).values({
      approvalId: inserted[0].id,
      reviewer: payload.reviewer,
      decision: "requested",
      comment: payload.comment,
    });

    return c.json(await enrichItem(itemId), 201);
  })
  .post("/:id/approvals/:approvalId/decision", async (c) => {
    const itemId = Number(c.req.param("id"));
    const approvalId = Number(c.req.param("approvalId"));
    const payload = approvalDecisionSchema.parse(await c.req.json());
    const current = await enrichItem(itemId);
    if (!current) {
      return c.json({ error: "Item not found" }, 404);
    }

    await db
      .update(approvalRequests)
      .set({
        status: payload.decision,
        latestComment: payload.comment,
        reviewer: payload.reviewer,
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, approvalId));

    await db.insert(approvalDecisions).values({
      approvalId,
      reviewer: payload.reviewer,
      decision: payload.decision,
      comment: payload.comment,
    });

    await db.update(ledgerItems).set({ updatedAt: new Date() }).where(eq(ledgerItems.id, itemId));

    return c.json(await enrichItem(itemId));
  });
