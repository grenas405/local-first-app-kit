import { useEffect, useState } from "react";
import { api, dollars } from "../api";
import type { DashboardData } from "../types";
import { useCountUp } from "../hooks/useCountUp";
import { ReceiptPreview } from "../components/ReceiptPreview";

const RANGES: { key: DashboardData["range"]; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
];

function delta(cur: number, prev: number): { pct: number; up: boolean } | null {
  if (prev === 0) return cur === 0 ? null : { pct: 100, up: true };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

function Kpi({ label, value, money = false, prev }: { label: string; value: number; money?: boolean; prev?: number }) {
  const shown = useCountUp(value);
  const d = prev != null ? delta(value, prev) : null;
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-bold text-white">{money ? dollars(shown) : shown.toLocaleString()}</div>
      {d && (
        <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${d.up ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
          {d.up ? "▲" : "▼"} {d.pct}% vs prior
        </div>
      )}
    </div>
  );
}

function Sparkline({ series }: { series: DashboardData["series"] }) {
  const w = 600, h = 120, pad = 6;
  const max = Math.max(1, ...series.map((s) => s.revenue_cents));
  const step = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0;
  const pts = series.map((s, i) => [pad + i * step, h - pad - (s.revenue_cents / max) * (h - pad * 2)]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1]?.[0] ?? pad},${h} L${pts[0]?.[0] ?? pad},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-via)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--brand-via)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={line} fill="none" stroke="var(--brand-to)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function Dashboard() {
  const [range, setRange] = useState<DashboardData["range"]>("today");
  const [data, setData] = useState<DashboardData | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);

  useEffect(() => { api.dashboard(range).then(setData); }, [range]);
  if (!data) return <div className="p-8 text-slate-400">Loading…</div>;

  const mixTotal = data.cash_total_cents + data.card_total_cents;
  const cashPct = mixTotal ? Math.round((data.cash_total_cents / mixTotal) * 100) : 0;
  const empty = data.count === 0;

  return (
    <div className="min-h-full bg-slate-950 p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Command Center</h1>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${range === r.key ? "bg-brand text-white" : "text-slate-400 hover:text-white"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Revenue" value={data.revenue_cents} money prev={data.prev.revenue_cents} />
        <Kpi label="Transactions" value={data.count} prev={data.prev.count} />
        <Kpi label="Avg Ticket" value={data.avg_ticket_cents} money />
        <Kpi label="Items Sold" value={data.items_sold} prev={data.prev.items_sold} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 lg:col-span-2">
          <div className="mb-2 text-sm text-slate-400">Revenue trend</div>
          {empty ? <EmptyState /> : <Sparkline series={data.series} />}
        </div>
        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="mb-3 text-sm text-slate-400">Cash / Card mix</div>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
            <div className="bg-emerald-400" style={{ width: `${cashPct}%` }} />
            <div className="bg-sky-400" style={{ width: `${100 - cashPct}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-emerald-400">Cash {dollars(data.cash_total_cents)}</span>
            <span className="text-sky-400">Card {dollars(data.card_total_cents)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="mb-3 text-sm text-slate-400">Recent transactions</div>
        {data.recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No sales yet — ring one up to see it here.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {data.recent.map((s) => (
              <button key={s.id} onClick={() => setReceiptId(s.id)} className="flex w-full items-center justify-between py-2.5 text-left hover:bg-white/5">
                <span className="text-sm text-slate-300">#{s.id} · {new Date(s.created_at).toLocaleString()}</span>
                <span className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${s.payment_type === "cash" ? "bg-emerald-500/15 text-emerald-400" : "bg-sky-500/15 text-sky-400"}`}>{s.payment_type}</span>
                  <span className="font-semibold">{dollars(s.total_cents)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {receiptId != null && <ReceiptPreview saleId={receiptId} onClose={() => setReceiptId(null)} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-32 flex-col items-center justify-center text-slate-500">
      <div className="text-3xl">📈</div>
      <p className="mt-1 text-sm">No revenue in this range yet.</p>
    </div>
  );
}
