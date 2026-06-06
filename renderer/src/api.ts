import type { CatalogItem, CartLine, DashboardData, SaleResult, Settings } from "./types";

// Learn the backend URL from the preload bridge, else a ?port= query param, else a dev default.
function resolveBaseUrl(): string {
  if (typeof window !== "undefined" && window.app?.backendBaseUrl) return window.app.backendBaseUrl;
  const port = new URLSearchParams(location.search).get("port");
  if (port) return `http://127.0.0.1:${port}`;
  return "http://127.0.0.1:8787";
}

export const BASE_URL = resolveBaseUrl();

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── money helpers ──
export const dollars = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

/** "12.50" → 1250 cents. Tolerant of "$", commas, blanks. */
export const parseDollars = (input: string): number => {
  const n = Number(String(input).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

// ── endpoints ──
export const api = {
  catalog: (all = false) => req<CatalogItem[]>(`/catalog${all ? "?all=1" : ""}`),
  createItem: (body: Partial<CatalogItem>) => req<CatalogItem>("/catalog", { method: "POST", body: JSON.stringify(body) }),
  updateItem: (id: number, body: Partial<CatalogItem>) => req<CatalogItem>(`/catalog/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteItem: (id: number, permanent = false) => req<{ ok: boolean }>(`/catalog/${id}${permanent ? "?permanent=1" : ""}`, { method: "DELETE" }),

  settings: () => req<Settings>("/settings"),
  saveSettings: (body: Settings) => req<Settings>("/settings", { method: "PUT", body: JSON.stringify(body) }),

  createSale: (lines: CartLine[], payment_type: "cash" | "card", cash_tendered_cents?: number) =>
    req<SaleResult>("/sales", { method: "POST", body: JSON.stringify({ lines, payment_type, cash_tendered_cents }) }),
  dashboard: (range: "today" | "7d" | "30d") => req<DashboardData>(`/sales/dashboard?range=${range}`),
  receiptUrl: (id: number) => `${BASE_URL}/sales/${id}/receipt`,
};
