import { useEffect, useMemo, useState } from "react";
import { api, dollars, parseDollars } from "../api";
import type { CatalogItem, CartLine } from "../types";
import { CATEGORIES } from "../catalog-meta";
import { ReceiptPreview } from "../components/ReceiptPreview";

export function Checkout({ taxRate }: { taxRate: number }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCat, setActiveCat] = useState<string>("All");
  const [tendered, setTendered] = useState("");
  const [receiptId, setReceiptId] = useState<number | null>(null);

  useEffect(() => { api.catalog().then(setItems); }, []);

  const cats = useMemo(() => ["All", ...CATEGORIES.filter((c) => items.some((i) => i.category === c))], [items]);
  const shown = activeCat === "All" ? items : items.filter((i) => i.category === activeCat);

  const subtotal = cart.reduce((s, l) => s + l.unit_price_cents * l.qty, 0);
  const tax = Math.round(cart.reduce((s, l) => s + (l.taxable ? l.unit_price_cents * l.qty : 0), 0) * taxRate);
  const total = subtotal + tax;
  const tenderedCents = parseDollars(tendered);
  const change = tenderedCents - total;

  function add(item: CatalogItem) {
    setCart((c) => {
      const i = c.findIndex((l) => l.name === item.name && l.unit_price_cents === item.price_cents);
      if (i >= 0) { const copy = [...c]; copy[i] = { ...copy[i], qty: copy[i].qty + 1 }; return copy; }
      return [...c, { name: item.name, unit_price_cents: item.price_cents, qty: 1, taxable: item.taxable === 1 }];
    });
  }
  function setQty(idx: number, qty: number) {
    setCart((c) => (qty <= 0 ? c.filter((_, i) => i !== idx) : c.map((l, i) => (i === idx ? { ...l, qty } : l))));
  }
  function addCustom() {
    const name = prompt("Custom item name?")?.trim();
    if (!name) return;
    const price = parseDollars(prompt("Price (e.g. 12.50)?") ?? "");
    const taxable = confirm("Is this item taxable? (OK ‘Cancel’ = tax-exempt service)");
    setCart((c) => [...c, { name, unit_price_cents: price, qty: 1, taxable }]);
  }

  async function complete(payment: "cash" | "card") {
    if (!cart.length) return;
    const sale = await api.createSale(cart, payment, payment === "cash" ? tenderedCents : undefined);
    setReceiptId(sale.id);
    setCart([]);
    setTendered("");
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Catalog */}
      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCat === c ? "bg-brand text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((item) => (
            <button
              key={item.id}
              onClick={() => add(item)}
              className="flex min-h-[88px] flex-col justify-between rounded-2xl p-3 text-left text-white shadow-sm transition hover:scale-[1.02] active:scale-95"
              style={{ background: item.color ?? "#334155" }}
            >
              <span className="text-sm font-semibold leading-tight">{item.name}</span>
              <span className="text-xs opacity-90">
                {dollars(item.price_cents)}{item.taxable === 0 ? " · tax-free" : ""}
              </span>
            </button>
          ))}
          <button onClick={addCustom} className="min-h-[88px] rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400">
            + Custom
          </button>
        </div>
      </div>

      {/* Cart */}
      <div className="flex w-80 flex-col rounded-2xl bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-bold text-gray-900">Cart</h2>
        <div className="flex-1 space-y-2 overflow-auto">
          {cart.length === 0 && <p className="mt-8 text-center text-sm text-gray-400">Tap items to add them</p>}
          {cart.map((l, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-xl bg-gray-50 p-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{l.name}</div>
                <div className="text-xs text-gray-500">{dollars(l.unit_price_cents)}{!l.taxable && " · exempt"}</div>
              </div>
              <button onClick={() => setQty(idx, l.qty - 1)} className="h-7 w-7 rounded-lg bg-gray-200 font-bold">−</button>
              <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
              <button onClick={() => setQty(idx, l.qty + 1)} className="h-7 w-7 rounded-lg bg-gray-200 font-bold">+</button>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{dollars(subtotal)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Tax</span><span>{dollars(tax)}</span></div>
          <div className="flex justify-between text-lg font-bold text-gray-900"><span>Total</span><span>{dollars(total)}</span></div>
        </div>

        <input
          value={tendered}
          onChange={(e) => setTendered(e.target.value)}
          inputMode="decimal"
          placeholder="Cash tendered"
          className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-right"
        />
        {tendered && total > 0 && (
          <div className={`mt-1 text-right text-sm font-medium ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
            {change >= 0 ? `Change ${dollars(change)}` : `Need ${dollars(-change)} more`}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => complete("cash")} disabled={!cart.length || change < 0} className="rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-40">Cash</button>
          <button onClick={() => complete("card")} disabled={!cart.length} className="bg-brand rounded-xl py-3 font-semibold text-white disabled:opacity-40">Card</button>
        </div>
      </div>

      {receiptId != null && <ReceiptPreview saleId={receiptId} onClose={() => setReceiptId(null)} />}
    </div>
  );
}
