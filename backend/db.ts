// db.ts — node:sqlite persistence for the Local-First App Kit.
//
// Honors the spec constraints: money is integer cents (money-integer-cents); the backend
// recomputes every total (server-side-totals); tax is summed only over taxable lines
// (oklahoma-per-item-tax); sales are grouped by a local sale_date (local-day-grouping);
// migrations are additive + idempotent (additive-migrations); backups use checkpoint+copy,
// never VACUUM INTO (sqlite-backup-method); rows are cast via unknown (node-sqlite-row-typing).

import { DatabaseSync } from "node:sqlite";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { basename, dirname, join } from "node:path";

// ─── types ──────────────────────────────────────────────────────────────────
export interface CatalogItem {
  id: number;
  name: string;
  category: string;
  price_cents: number;
  active: number;
  color: string | null;
  description: string | null;
  taxable: number; // 0|1
}

export interface LineInput {
  name: string;
  unit_price_cents: number;
  qty: number;
  taxable: boolean;
}

/** Input for creating/seeding a catalog item; `taxable` accepts a boolean or 0|1. */
export interface ItemInput {
  name: string;
  category: string;
  price_cents: number;
  color?: string | null;
  description?: string | null;
  taxable: boolean | number;
}

export interface SaleRow {
  id: number;
  created_at: string;
  sale_date: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  payment_type: string;
  cash_tendered_cents: number | null;
  change_cents: number | null;
}
export interface SaleLineRow {
  id: number;
  sale_id: number;
  name: string;
  unit_price_cents: number;
  qty: number;
  line_total_cents: number;
  taxable: number;
}
export interface SaleWithLines extends SaleRow {
  lines: SaleLineRow[];
}

export interface Totals {
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
}

export interface SaleInput {
  lines: LineInput[];
  payment_type: "cash" | "card";
  cash_tendered_cents?: number | null;
}

export interface SeedData {
  settings: Record<string, string>;
  catalog: Array<ItemInput & { active?: number }>;
}

// A minimal fallback used only when no domain pack has been applied yet, so the backend
// still boots and tests run. `scripts/apply-domain.mjs` overwrites backend/seed.generated.ts.
export const DEFAULT_SEED: SeedData = {
  settings: {
    business_name: "Local-First POS",
    business_address: "Oklahoma City, OK",
    business_phone: "",
    tax_rate: "0.08625", // OKC combined: 4.5% state + 1.125% county + 3.0% city
    receipt_footer: "Thank you!",
  },
  catalog: [
    { name: "Sample Service", category: "Services", price_cents: 3000, color: null, description: null, taxable: 0 },
    { name: "Sample Product", category: "Retail", price_cents: 1800, color: null, description: null, taxable: 1 },
  ],
};

// ─── money + date helpers (exported; used by routes, receipt, tests) ─────────

/** Recompute totals from line items + tax rate. Tax applies ONLY to taxable lines. */
export function computeTotals(lines: LineInput[], taxRate: number): Totals {
  let subtotal = 0;
  let taxableBase = 0;
  for (const l of lines) {
    const line = l.unit_price_cents * l.qty;
    subtotal += line;
    if (l.taxable) taxableBase += line;
  }
  const tax = Math.round(taxableBase * taxRate);
  return { subtotal_cents: subtotal, tax_cents: tax, total_cents: subtotal + tax };
}

/** Local YYYY-MM-DD for grouping/reporting (NOT the UTC slice of an ISO string). */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Subtract n days from a local YYYY-MM-DD string, returning a local YYYY-MM-DD string. */
export function dateMinusDays(localDate: string, n: number): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - n);
  return localDateString(dt);
}

// ─── database ─────────────────────────────────────────────────────────────--
export class Database {
  readonly db: DatabaseSync;
  readonly path: string;

  constructor(path = ":memory:") {
    this.path = path;
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS catalog_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        color TEXT,
        description TEXT
      );
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        sale_date TEXT NOT NULL,
        subtotal_cents INTEGER NOT NULL,
        tax_cents INTEGER NOT NULL,
        total_cents INTEGER NOT NULL,
        payment_type TEXT NOT NULL,
        cash_tendered_cents INTEGER,
        change_cents INTEGER
      );
      CREATE TABLE IF NOT EXISTS sale_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        unit_price_cents INTEGER NOT NULL,
        qty INTEGER NOT NULL,
        line_total_cents INTEGER NOT NULL
      );
    `);
    // Additive migration: per-line taxability (Oklahoma service exemption). Default 1 so
    // upgraded DBs backfill to "taxable" — the safe direction for retail-heavy catalogs.
    this.addColumnIfMissing("catalog_items", "taxable", "INTEGER NOT NULL DEFAULT 1");
    this.addColumnIfMissing("sale_line_items", "taxable", "INTEGER NOT NULL DEFAULT 1");
  }

  /** Idempotent ALTER: only adds the column if PRAGMA table_info lacks it. */
  addColumnIfMissing(table: string, col: string, type: string) {
    const cols = this.db.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[];
    if (!cols.some((c) => c.name === col)) {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
    }
  }

  /** Seed defaults ONLY when settings is empty (never clobber an installed DB). */
  seed(data: SeedData) {
    const count = this.db.prepare("SELECT COUNT(*) AS n FROM settings").get() as unknown as { n: number };
    if (Number(count.n) > 0) return;
    const insSetting = this.db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    for (const [k, v] of Object.entries(data.settings)) insSetting.run(k, v);
    const insItem = this.db.prepare(
      "INSERT INTO catalog_items (name, category, price_cents, active, color, description, taxable) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    for (const it of data.catalog) {
      insItem.run(it.name, it.category, it.price_cents, it.active ?? 1, it.color ?? null, it.description ?? null, it.taxable ? 1 : 0);
    }
  }

  // ── settings ──
  getSettings(): Record<string, string> {
    const rows = this.db.prepare("SELECT key, value FROM settings").all() as unknown as { key: string; value: string }[];
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
  setSetting(key: string, value: string) {
    this.db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(key, value);
  }
  taxRate(): number {
    return Number(this.getSettings().tax_rate ?? "0");
  }

  // ── catalog ──
  listCatalog(includeInactive = false): CatalogItem[] {
    const sql = includeInactive
      ? "SELECT * FROM catalog_items ORDER BY category, name"
      : "SELECT * FROM catalog_items WHERE active = 1 ORDER BY category, name";
    return this.db.prepare(sql).all() as unknown as CatalogItem[];
  }
  createItem(i: ItemInput): CatalogItem {
    const r = this.db.prepare(
      "INSERT INTO catalog_items (name, category, price_cents, active, color, description, taxable) VALUES (?, ?, ?, 1, ?, ?, ?)",
    ).run(i.name, i.category, i.price_cents, i.color ?? null, i.description ?? null, i.taxable ? 1 : 0);
    return this.getItem(Number(r.lastInsertRowid))!;
  }
  getItem(id: number): CatalogItem | undefined {
    return this.db.prepare("SELECT * FROM catalog_items WHERE id = ?").get(id) as unknown as CatalogItem | undefined;
  }
  updateItem(id: number, patch: Partial<CatalogItem>): CatalogItem | undefined {
    const cur = this.getItem(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch };
    this.db.prepare(
      "UPDATE catalog_items SET name=?, category=?, price_cents=?, active=?, color=?, description=?, taxable=? WHERE id=?",
    ).run(next.name, next.category, next.price_cents, next.active ? 1 : 0, next.color ?? null, next.description ?? null, next.taxable ? 1 : 0, id);
    return this.getItem(id);
  }
  /** Soft-hide (active=0) by default; permanent removes the row. */
  deleteItem(id: number, permanent = false): boolean {
    if (permanent) return this.db.prepare("DELETE FROM catalog_items WHERE id = ?").run(id).changes > 0;
    return this.db.prepare("UPDATE catalog_items SET active = 0 WHERE id = ?").run(id).changes > 0;
  }

  // ── sales ──
  createSale(input: SaleInput): { id: number } & Totals {
    if (!input.lines.length) throw new Error("a sale needs at least one line");
    const totals = computeTotals(input.lines, this.taxRate());
    const now = new Date();
    const created_at = now.toISOString();
    const sale_date = localDateString(now);
    const tendered = input.payment_type === "cash" ? (input.cash_tendered_cents ?? totals.total_cents) : null;
    const change = input.payment_type === "cash" && tendered != null ? tendered - totals.total_cents : null;

    this.db.exec("BEGIN");
    try {
      const r = this.db.prepare(
        `INSERT INTO sales (created_at, sale_date, subtotal_cents, tax_cents, total_cents, payment_type, cash_tendered_cents, change_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(created_at, sale_date, totals.subtotal_cents, totals.tax_cents, totals.total_cents, input.payment_type, tendered, change);
      const saleId = Number(r.lastInsertRowid);
      const insLine = this.db.prepare(
        "INSERT INTO sale_line_items (sale_id, name, unit_price_cents, qty, line_total_cents, taxable) VALUES (?, ?, ?, ?, ?, ?)",
      );
      for (const l of input.lines) {
        insLine.run(saleId, l.name, l.unit_price_cents, l.qty, l.unit_price_cents * l.qty, l.taxable ? 1 : 0);
      }
      this.db.exec("COMMIT");
      return { id: saleId, ...totals };
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  getSale(id: number): SaleWithLines | undefined {
    const sale = this.db.prepare("SELECT * FROM sales WHERE id = ?").get(id) as unknown as SaleRow | undefined;
    if (!sale) return undefined;
    const lines = this.db.prepare("SELECT * FROM sale_line_items WHERE sale_id = ?").all(id) as unknown as SaleLineRow[];
    return { ...sale, lines };
  }

  listSalesForDay(localDate: string) {
    const sales = this.db.prepare("SELECT * FROM sales WHERE sale_date = ? ORDER BY id DESC").all(localDate) as unknown as Record<string, number | string>[];
    let cash = 0, card = 0;
    for (const s of sales) {
      if (s.payment_type === "cash") cash += Number(s.total_cents);
      else card += Number(s.total_cents);
    }
    return { sales, cash_total_cents: cash, card_total_cents: card };
  }

  /** KPIs + comparison + daily series + recent list for the dashboard. */
  dashboard(range: "today" | "7d" | "30d", today = localDateString()) {
    const kpiDays = range === "today" ? 1 : range === "7d" ? 7 : 30;
    const seriesDays = range === "30d" ? 30 : 7;
    const start = dateMinusDays(today, kpiDays - 1);
    const prevEnd = dateMinusDays(start, 1);
    const prevStart = dateMinusDays(prevEnd, kpiDays - 1);

    const windowSum = (from: string, to: string) => {
      const row = this.db.prepare(
        `SELECT COALESCE(SUM(total_cents),0) AS revenue, COUNT(*) AS count FROM sales WHERE sale_date BETWEEN ? AND ?`,
      ).get(from, to) as unknown as { revenue: number; count: number };
      const items = this.db.prepare(
        `SELECT COALESCE(SUM(li.qty),0) AS n FROM sale_line_items li JOIN sales s ON s.id = li.sale_id WHERE s.sale_date BETWEEN ? AND ?`,
      ).get(from, to) as unknown as { n: number };
      return { revenue: Number(row.revenue), count: Number(row.count), items: Number(items.n) };
    };

    const cur = windowSum(start, today);
    const prev = windowSum(prevStart, prevEnd);

    const series: { date: string; revenue_cents: number }[] = [];
    for (let i = seriesDays - 1; i >= 0; i--) {
      const date = dateMinusDays(today, i);
      const row = this.db.prepare("SELECT COALESCE(SUM(total_cents),0) AS r FROM sales WHERE sale_date = ?").get(date) as unknown as { r: number };
      series.push({ date, revenue_cents: Number(row.r) });
    }

    const mix = this.db.prepare(
      `SELECT payment_type, COALESCE(SUM(total_cents),0) AS total FROM sales WHERE sale_date BETWEEN ? AND ? GROUP BY payment_type`,
    ).all(start, today) as unknown as { payment_type: string; total: number }[];
    let cash = 0, card = 0;
    for (const m of mix) (m.payment_type === "cash" ? (cash += Number(m.total)) : (card += Number(m.total)));

    const recent = this.db.prepare("SELECT * FROM sales ORDER BY id DESC LIMIT 10").all() as unknown as Record<string, number | string>[];

    return {
      range,
      revenue_cents: cur.revenue,
      count: cur.count,
      items_sold: cur.items,
      avg_ticket_cents: cur.count ? Math.round(cur.revenue / cur.count) : 0,
      prev: { revenue_cents: prev.revenue, count: prev.count, items_sold: prev.items },
      series,
      cash_total_cents: cash,
      card_total_cents: card,
      recent,
    };
  }

  /** One consistent snapshot per local day; retain newest ~14. No-op for in-memory DBs. */
  backupDaily(retain = 14): string | null {
    if (this.path === ":memory:" || !existsSync(this.path)) return null;
    // checkpoint flushes the WAL into the main file so the copy is a complete standalone snapshot.
    this.db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    const dir = join(dirname(this.path), "backups");
    mkdirSync(dir, { recursive: true });
    const stem = basename(this.path).replace(/\.[^.]+$/, "");
    const dest = join(dir, `${stem}-${localDateString()}.db`);
    if (!existsSync(dest)) copyFileSync(this.path, dest);
    // prune older than the newest `retain`
    const snaps = readdirSync(dir)
      .filter((f) => f.startsWith(stem + "-") && f.endsWith(".db"))
      .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const old of snaps.slice(retain)) unlinkSync(join(dir, old.f));
    return dest;
  }

  close() {
    this.db.close();
  }
}
