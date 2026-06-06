import { Hono } from "hono";
import type { Database, LineInput } from "../db.ts";
import { localDateString } from "../db.ts";
import { renderReceipt } from "../receipt.ts";

export function transactionRoutes(db: Database): Hono {
  const r = new Hono();

  // Create a sale. Server recomputes ALL totals; client-sent totals are ignored.
  r.post("/", async (c) => {
    const b = await c.req.json();
    const rawLines = Array.isArray(b?.lines) ? b.lines : [];
    if (!rawLines.length) return c.json({ error: "at least one line required" }, 400);
    const lines: LineInput[] = rawLines.map((l: Record<string, unknown>) => ({
      name: String(l.name),
      unit_price_cents: Math.round(Number(l.unit_price_cents)),
      qty: Math.max(1, Math.round(Number(l.qty) || 1)),
      taxable: l.taxable !== false, // default taxable unless explicitly false
    }));
    const payment_type = b.payment_type === "card" ? "card" : "cash";
    const sale = db.createSale({
      lines,
      payment_type,
      cash_tendered_cents: b.cash_tendered_cents != null ? Math.round(Number(b.cash_tendered_cents)) : null,
    });
    return c.json(sale, 201);
  });

  // List a local day's sales + cash/card totals. ?date=today or YYYY-MM-DD.
  r.get("/", (c) => {
    const q = c.req.query("date") ?? "today";
    const date = q === "today" ? localDateString() : q;
    return c.json(db.listSalesForDay(date));
  });

  r.get("/dashboard", (c) => {
    const range = (c.req.query("range") ?? "today") as "today" | "7d" | "30d";
    return c.json(db.dashboard(["today", "7d", "30d"].includes(range) ? range : "today"));
  });

  r.get("/:id/receipt", (c) => {
    const sale = db.getSale(Number(c.req.param("id")));
    if (!sale) return c.json({ error: "not found" }, 404);
    return c.html(renderReceipt(sale, db.getSettings()));
  });

  return r;
}
