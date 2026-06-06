import { Hono } from "hono";
import type { Database } from "../db.ts";

export function catalogRoutes(db: Database): Hono {
  const r = new Hono();

  r.get("/", (c) => {
    const all = c.req.query("all") === "1";
    return c.json(db.listCatalog(all));
  });

  r.post("/", async (c) => {
    const b = await c.req.json();
    if (!b?.name || !b?.category || typeof b.price_cents !== "number") {
      return c.json({ error: "name, category, price_cents required" }, 400);
    }
    const item = db.createItem({
      name: String(b.name),
      category: String(b.category),
      price_cents: Math.round(b.price_cents),
      color: b.color ?? null,
      description: b.description ?? null,
      taxable: b.taxable ?? true,
    });
    return c.json(item, 201);
  });

  r.put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const b = await c.req.json();
    const updated = db.updateItem(id, b);
    if (!updated) return c.json({ error: "not found" }, 404);
    return c.json(updated);
  });

  r.delete("/:id", (c) => {
    const id = Number(c.req.param("id"));
    const permanent = c.req.query("permanent") === "1";
    const ok = db.deleteItem(id, permanent);
    if (!ok) return c.json({ error: "not found" }, 404);
    return c.json({ ok: true, permanent });
  });

  return r;
}
