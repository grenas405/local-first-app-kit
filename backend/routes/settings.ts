import { Hono } from "hono";
import type { Database } from "../db.ts";

// The allow-list gate. A new settings key MUST be added here AND in db.ts DEFAULT_SEED AND
// given a code-level fallback where consumed (constraint: additive-settings-keys).
const ALLOWED = new Set([
  "business_name",
  "business_address",
  "business_phone",
  "tax_rate",
  "receipt_footer",
]);

export function settingsRoutes(db: Database): Hono {
  const r = new Hono();

  r.get("/", (c) => c.json(db.getSettings()));

  r.put("/", async (c) => {
    const b = await c.req.json();
    if (!b || typeof b !== "object") return c.json({ error: "object body required" }, 400);
    if ("tax_rate" in b) {
      const rate = Number(b.tax_rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
        return c.json({ error: "tax_rate must be a fraction in [0,1]" }, 400);
      }
    }
    for (const [k, v] of Object.entries(b)) {
      if (ALLOWED.has(k)) db.setSetting(k, String(v)); // silently ignore unknown keys
    }
    return c.json(db.getSettings());
  });

  return r;
}
