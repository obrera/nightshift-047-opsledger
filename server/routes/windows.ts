import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { deploymentWindows, ledgerItems } from "../db/schema";
import { detectWindowConflicts } from "../lib/domain";

const windowSchema = z
  .object({
    title: z.string().min(4),
    environment: z.enum(["production", "staging", "sandbox"]),
    owner: z.string().min(2),
    status: z.enum(["planned", "approved", "active", "completed", "cancelled"]),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    notes: z.string().min(8),
  })
  .refine((value) => new Date(value.endAt).getTime() > new Date(value.startAt).getTime(), {
    message: "End time must be after start time",
    path: ["endAt"],
  });

async function listWindows() {
  const [windows, items] = await Promise.all([
    db.select().from(deploymentWindows).orderBy(desc(deploymentWindows.startAt)),
    db.select().from(ledgerItems),
  ]);
  return detectWindowConflicts(windows, items);
}

export const windowsRoute = new Hono()
  .get("/", async (c) => c.json(await listWindows()))
  .post("/", async (c) => {
    const payload = windowSchema.parse(await c.req.json());
    await db.insert(deploymentWindows).values({
      ...payload,
      startAt: new Date(payload.startAt),
      endAt: new Date(payload.endAt),
    });
    return c.json(await listWindows(), 201);
  })
  .put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const payload = windowSchema.parse(await c.req.json());
    await db
      .update(deploymentWindows)
      .set({
        ...payload,
        startAt: new Date(payload.startAt),
        endAt: new Date(payload.endAt),
        updatedAt: new Date(),
      })
      .where(eq(deploymentWindows.id, id));
    return c.json(await listWindows());
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    await db.delete(deploymentWindows).where(eq(deploymentWindows.id, id));
    return c.json(await listWindows());
  });
