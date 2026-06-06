// server.ts — Hono app bound strictly to 127.0.0.1 (constraint: localhost-only).
//
// `createApp(db)` is exported for tests. `main()` runs only as the spawned sidecar: it picks the
// db path + port from env (passed by Electron), seeds from the applied domain pack, takes a daily
// backup, and serves loopback-only.

import { Hono } from "hono";
import { Database, DEFAULT_SEED, type SeedData } from "./db.ts";
import { catalogRoutes } from "./routes/catalog.ts";
import { transactionRoutes } from "./routes/transactions.ts";
import { settingsRoutes } from "./routes/settings.ts";

export function createApp(db: Database): Hono {
  const app = new Hono();
  app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));
  app.route("/catalog", catalogRoutes(db));
  app.route("/sales", transactionRoutes(db));
  app.route("/settings", settingsRoutes(db));
  return app;
}

async function loadSeed(): Promise<SeedData> {
  // The domain pack materializes ./seed.generated.ts; fall back so the app boots un-applied.
  try {
    const mod = await import("./seed.generated.ts");
    return mod.SEED as SeedData;
  } catch {
    return DEFAULT_SEED;
  }
}

async function main() {
  const dbPath = Deno.env.get("POS_DB_PATH") ?? "./pos.db";
  const port = Number(Deno.env.get("POS_PORT") ?? "0") || 8787;

  const db = new Database(dbPath);
  db.seed(await loadSeed());
  try {
    const snap = db.backupDaily();
    if (snap) console.log(`[backup] ${snap}`);
  } catch (e) {
    console.error("[backup] skipped:", (e as Error).message); // never block startup on backup
  }

  const app = createApp(db);
  Deno.serve({ hostname: "127.0.0.1", port }, app.fetch);
  console.log(`[backend] listening on http://127.0.0.1:${port}`);
}

if (import.meta.main) main();
