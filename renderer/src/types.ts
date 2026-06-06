export interface CatalogItem {
  id: number;
  name: string;
  category: string;
  price_cents: number;
  active: number;
  color: string | null;
  description: string | null;
  taxable: number; // 0 | 1
}

export interface CartLine {
  name: string;
  unit_price_cents: number;
  qty: number;
  taxable: boolean;
}

export interface SaleResult {
  id: number;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
}

export interface DashboardData {
  range: "today" | "7d" | "30d";
  revenue_cents: number;
  count: number;
  items_sold: number;
  avg_ticket_cents: number;
  prev: { revenue_cents: number; count: number; items_sold: number };
  series: { date: string; revenue_cents: number }[];
  cash_total_cents: number;
  card_total_cents: number;
  recent: Array<{
    id: number;
    sale_date: string;
    total_cents: number;
    payment_type: string;
    created_at: string;
  }>;
}

export type Settings = Record<string, string>;
