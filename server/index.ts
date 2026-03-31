import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { initializeDatabase } from "./db/init";
import { dashboardRoute } from "./routes/dashboard";
import { releasesRoute } from "./routes/releases";

const app = new Hono();

app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({ ok: true, service: "releasebridge" }));
app.route("/api/releases", releasesRoute);
app.route("/api/dashboard", dashboardRoute);

const publicDir = join(process.cwd(), "dist/public");

if (existsSync(publicDir)) {
  app.use("/*", serveStatic({ root: "./dist/public" }));
  app.get("*", async (c) =>
    c.html(await Bun.file(join(publicDir, "index.html")).text()),
  );
} else {
  app.get("/", (c) =>
    c.html(
      "<html><body style='font-family:sans-serif;background:#020617;color:#e2e8f0;padding:24px'>Build frontend assets with `bun run build`.</body></html>",
    ),
  );
}

const port = Number(process.env.PORT ?? 3000);

await initializeDatabase();

serve({
  fetch: app.fetch,
  port,
});

console.log(`ReleaseBridge listening on http://localhost:${port}`);
