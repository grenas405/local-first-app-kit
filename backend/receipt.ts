// receipt.ts — branded, printable receipt HTML.
//
// Color fidelity matters: webContents.print()/printToPDF() drop background colors unless
// print-color-adjust:exact is set, and there is no preview pane — the renderer shows this HTML
// in a sandboxed <iframe srcDoc> instead (constraint: print-color-fidelity). The logo is an
// inlined data URI so there is no async <img> load race during print (constraint: embed-binary-assets).

import { BRAND, LOGO_DATA_URI } from "./logo.ts";

interface ReceiptLine {
  name: string;
  unit_price_cents: number;
  qty: number;
  line_total_cents: number;
  taxable?: number;
}
interface ReceiptSale {
  id: number;
  created_at: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  payment_type: string;
  cash_tendered_cents?: number | null;
  change_cents?: number | null;
  lines: ReceiptLine[];
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));

export function renderReceipt(sale: ReceiptSale, settings: Record<string, string>): string {
  const name = settings.business_name ?? "Local-First POS";
  const address = settings.business_address ?? "";
  const phone = settings.business_phone ?? "";
  const footer = settings.receipt_footer ?? "Thank you!";
  const taxRate = Number(settings.tax_rate ?? "0");
  const taxPct = (taxRate * 100).toFixed(3).replace(/\.?0+$/, "");
  const hasExempt = sale.lines.some((l) => l.taxable === 0);

  const lineRows = sale.lines
    .map((l) => {
      const exemptMark = l.taxable === 0 ? ' <span class="exempt">(tax-exempt)</span>' : "";
      const qtySub = l.qty > 1 ? `<div class="sub">${l.qty} × ${money(l.unit_price_cents)}</div>` : "";
      return `<tr><td>${esc(l.name)}${exemptMark}${qtySub}</td><td class="amt">${money(l.line_total_cents)}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt #${sale.id}</title>
<style>
  :root { --brand-from:${BRAND.from}; --brand-to:${BRAND.to}; }
  @page { size: 80mm auto; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  body { width: 80mm; margin: 0; padding: 6mm 5mm; font-family: "Inter", system-ui, sans-serif; color: #111827; font-size: 12px; }
  .logo { display:block; margin: 0 auto 6px; max-height: 48px; }
  .head { text-align:center; margin-bottom: 8px; }
  .head .name { font-weight: 700; font-size: 15px; }
  .head .meta { color:#6b7280; font-size: 11px; white-space: pre-line; }
  table { width:100%; border-collapse: collapse; }
  td { padding: 3px 0; vertical-align: top; }
  .amt { text-align: right; white-space: nowrap; }
  .sub { color:#6b7280; font-size: 10px; }
  .exempt { color:#9ca3af; font-size: 10px; }
  .rule { border-top: 1px dashed #d1d5db; margin: 6px 0; }
  .row { display:flex; justify-content: space-between; padding: 2px 0; }
  .total-bar { margin-top: 6px; padding: 8px 10px; border-radius: 6px; color:#fff;
    background: linear-gradient(90deg, var(--brand-from), var(--brand-to));
    display:flex; justify-content: space-between; font-weight: 700; font-size: 15px; }
  .badge { display:inline-block; margin-top: 8px; padding: 2px 8px; border-radius: 999px;
    background:#111827; color:#fff; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
  .footer { margin-top: 10px; text-align:center; color:#6b7280; font-size: 11px; white-space: pre-line; }
</style></head>
<body>
  <img class="logo" src="${LOGO_DATA_URI}" alt="${esc(name)}"/>
  <div class="head">
    <div class="name">${esc(name)}</div>
    <div class="meta">${esc([address, phone].filter(Boolean).join("\n"))}</div>
  </div>
  <div class="rule"></div>
  <table>${lineRows}</table>
  <div class="rule"></div>
  <div class="row"><span>Subtotal</span><span>${money(sale.subtotal_cents)}</span></div>
  <div class="row"><span>Sales Tax${taxPct ? ` (${taxPct}%)` : ""}</span><span>${money(sale.tax_cents)}</span></div>
  ${hasExempt ? `<div class="sub">Some items are tax-exempt under Oklahoma law.</div>` : ""}
  <div class="total-bar"><span>TOTAL</span><span>${money(sale.total_cents)}</span></div>
  <div><span class="badge">${esc(sale.payment_type)}</span></div>
  ${
    sale.payment_type === "cash" && sale.change_cents != null
      ? `<div class="row"><span>Tendered</span><span>${money(sale.cash_tendered_cents ?? 0)}</span></div>
         <div class="row"><span>Change</span><span>${money(sale.change_cents)}</span></div>`
      : ""
  }
  <div class="footer">${esc(footer)}</div>
</body></html>`;
}
