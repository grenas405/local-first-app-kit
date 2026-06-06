import { assert, assertEquals } from "@std/assert";
import { DatabaseSync } from "node:sqlite";
import { Database, computeTotals, dateMinusDays, localDateString } from "./db.ts";
import { createApp } from "./server.ts";
import { renderReceipt } from "./receipt.ts";

function freshDb(): Database {
  const db = new Database(":memory:");
  db.seed({
    settings: { business_name: "Test", tax_rate: "0.08625", receipt_footer: "Thanks!" },
    catalog: [
      { name: "Haircut", category: "Service", price_cents: 3000, color: null, description: null, taxable: 0 },
      { name: "Pomade", category: "Retail", price_cents: 1800, color: null, description: null, taxable: 1 },
    ],
  });
  return db;
}

Deno.test("computeTotals taxes only taxable lines (OK service exemption)", () => {
  const t = computeTotals([
    { name: "Haircut", unit_price_cents: 3000, qty: 1, taxable: false },
    { name: "Pomade", unit_price_cents: 1800, qty: 2, taxable: true },
  ], 0.08625);
  assertEquals(t.subtotal_cents, 6600);
  assertEquals(t.tax_cents, 311); // round(3600 * 0.08625) = round(310.5) = 311
  assertEquals(t.total_cents, 6911);
});

Deno.test("fully-exempt service cart yields zero tax", () => {
  const t = computeTotals([{ name: "Haircut", unit_price_cents: 3000, qty: 1, taxable: false }], 0.08625);
  assertEquals(t.tax_cents, 0);
  assertEquals(t.total_cents, 3000);
});

Deno.test("configurable tax rate", () => {
  assertEquals(computeTotals([{ name: "x", unit_price_cents: 10000, qty: 1, taxable: true }], 0.05).tax_cents, 500);
});

Deno.test("createSale recomputes server-side + cash change due", () => {
  const db = freshDb();
  const sale = db.createSale({
    lines: [
      { name: "Haircut", unit_price_cents: 3000, qty: 1, taxable: false },
      { name: "Pomade", unit_price_cents: 1800, qty: 2, taxable: true },
    ],
    payment_type: "cash",
    cash_tendered_cents: 10000,
  });
  assertEquals(sale.total_cents, 6911);
  const full = db.getSale(sale.id)!;
  assertEquals(Number(full.change_cents), 10000 - 6911);
  assertEquals(full.lines.length, 2);
  db.close();
});

Deno.test("catalog soft-hide vs permanent delete", () => {
  const db = freshDb();
  const item = db.createItem({ name: "Temp", category: "X", price_cents: 100, color: null, description: null, taxable: true });
  db.deleteItem(item.id, false);
  assertEquals(db.listCatalog(false).some((i) => i.id === item.id), false);
  assertEquals(db.listCatalog(true).some((i) => i.id === item.id), true);
  db.deleteItem(item.id, true);
  assertEquals(db.listCatalog(true).some((i) => i.id === item.id), false);
  db.close();
});

Deno.test("sale_date is the local day and is returned by listSalesForDay", () => {
  const db = freshDb();
  db.createSale({ lines: [{ name: "Pomade", unit_price_cents: 1800, qty: 1, taxable: true }], payment_type: "card" });
  const today = localDateString();
  const day = db.listSalesForDay(today);
  assertEquals(day.sales.length, 1);
  assertEquals(day.card_total_cents, 1955); // 1800 + round(1800*0.08625=155.25)=155
  db.close();
});

Deno.test("migrations add + backfill taxable on an old-schema DB", () => {
  const path = `./_test_migrate_${Date.now()}.db`;
  const raw = new DatabaseSync(path);
  raw.exec(`CREATE TABLE catalog_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, price_cents INTEGER, active INTEGER DEFAULT 1, color TEXT, description TEXT);`);
  raw.exec(`INSERT INTO catalog_items (name, category, price_cents) VALUES ('Legacy', 'X', 500);`);
  raw.close();
  const db = new Database(path); // migrate() should add taxable DEFAULT 1
  const item = db.listCatalog(true).find((i) => i.name === "Legacy")!;
  assertEquals(Number(item.taxable), 1);
  db.close();
  Deno.removeSync(path);
  try { Deno.removeSync(path + "-wal"); } catch { /* ignore */ }
  try { Deno.removeSync(path + "-shm"); } catch { /* ignore */ }
});

Deno.test("backupDaily is a no-op for :memory:", () => {
  const db = new Database(":memory:");
  assertEquals(db.backupDaily(), null);
  db.close();
});

Deno.test("dashboard sums, series lengths, avg_ticket, no divide-by-zero on empty", () => {
  const db = freshDb();
  // empty range
  const empty = db.dashboard("today");
  assertEquals(empty.revenue_cents, 0);
  assertEquals(empty.avg_ticket_cents, 0); // no divide-by-zero
  assertEquals(empty.series.length, 7);
  assertEquals(db.dashboard("30d").series.length, 30);

  db.createSale({ lines: [{ name: "Pomade", unit_price_cents: 1800, qty: 2, taxable: true }], payment_type: "cash", cash_tendered_cents: 5000 });
  const d = db.dashboard("today");
  assertEquals(d.count, 1);
  assertEquals(d.items_sold, 2);
  assert(d.revenue_cents > 0);
  assertEquals(d.avg_ticket_cents, d.revenue_cents);
  db.close();
});

Deno.test("dateMinusDays handles month boundaries", () => {
  assertEquals(dateMinusDays("2026-03-01", 1), "2026-02-28");
  assertEquals(dateMinusDays("2026-01-01", 1), "2025-12-31");
});

Deno.test("HTTP: /sales create + /sales/dashboard shapes", async () => {
  const db = freshDb();
  const app = createApp(db);
  const create = await app.fetch(new Request("http://localhost/sales", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lines: [{ name: "Pomade", unit_price_cents: 1800, qty: 1, taxable: true }], payment_type: "card" }),
  }));
  assertEquals(create.status, 201);
  const sale = await create.json();
  assert(typeof sale.id === "number");
  assert(typeof sale.total_cents === "number");

  const dash = await app.fetch(new Request("http://localhost/sales/dashboard?range=7d"));
  assertEquals(dash.status, 200);
  const body = await dash.json();
  assertEquals(body.series.length, 7);
  assert("cash_total_cents" in body && "card_total_cents" in body);
  db.close();
});

Deno.test("renderReceipt embeds logo data URI, footer, TOTAL bar, exempt note", () => {
  const db = freshDb();
  const sale = db.createSale({
    lines: [
      { name: "Haircut", unit_price_cents: 3000, qty: 1, taxable: false },
      { name: "Pomade", unit_price_cents: 1800, qty: 1, taxable: true },
    ],
    payment_type: "cash",
    cash_tendered_cents: 5000,
  });
  const html = renderReceipt(db.getSale(sale.id)! as never, db.getSettings());
  assert(html.includes("data:image/"));
  assert(html.includes("Thanks!"));
  assert(html.includes("total-bar"));
  assert(html.includes("tax-exempt"));
  db.close();
});
