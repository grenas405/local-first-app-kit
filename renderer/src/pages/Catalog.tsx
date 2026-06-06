import { useEffect, useState } from "react";
import { api, dollars, parseDollars } from "../api";
import type { CatalogItem } from "../types";
import { CATEGORIES, COLORS } from "../catalog-meta";

const blank = () => ({ name: "", category: CATEGORIES[0] ?? "General", price: "", color: COLORS[0] ?? "#334155", description: "", taxable: true });

export function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState<number | null>(null);

  const load = () => api.catalog(true).then(setItems);
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!form.name.trim()) return;
    const body = {
      name: form.name.trim(),
      category: form.category,
      price_cents: parseDollars(form.price),
      color: form.color,
      description: form.description || null,
      taxable: form.taxable ? 1 : 0,
    };
    if (editing) await api.updateItem(editing, body);
    else await api.createItem(body);
    setForm(blank());
    setEditing(null);
    load();
  }

  function edit(it: CatalogItem) {
    setEditing(it.id);
    setForm({ name: it.name, category: it.category, price: (it.price_cents / 100).toFixed(2), color: it.color ?? COLORS[0], description: it.description ?? "", taxable: it.taxable === 1 });
  }
  async function toggleActive(it: CatalogItem) { await api.updateItem(it.id, { active: it.active ? 0 : 1 }); load(); }
  async function remove(it: CatalogItem) { if (confirm(`Permanently delete "${it.name}"?`)) { await api.deleteItem(it.id, true); load(); } }

  return (
    <div className="grid h-full grid-cols-3 gap-4 p-4">
      {/* Editor */}
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">{editing ? "Edit item" : "New item"}</h2>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} inputMode="decimal" placeholder="Price (12.50)" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Note (optional)" className="w-full rounded-xl border border-gray-200 px-3 py-2" rows={2} />
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })} className={`h-8 w-8 rounded-full ring-2 ${form.color === c ? "ring-gray-900" : "ring-transparent"}`} style={{ background: c }} />
            ))}
          </div>
          <label className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="text-sm font-medium text-gray-700">Taxable (Oklahoma)</span>
            <button onClick={() => setForm({ ...form, taxable: !form.taxable })} className={`relative h-6 w-11 rounded-full transition ${form.taxable ? "bg-brand" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${form.taxable ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </label>
          <p className="text-xs text-gray-400">Tip: services are usually tax-exempt in Oklahoma; retail goods are taxable.</p>
          <div className="flex gap-2">
            {editing && <button onClick={() => { setForm(blank()); setEditing(null); }} className="flex-1 rounded-xl border border-gray-300 py-2.5 font-medium">Cancel</button>}
            <button onClick={submit} className="bg-brand flex-1 rounded-xl py-2.5 font-semibold text-white">{editing ? "Save" : "Add item"}</button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="col-span-2 overflow-auto rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Catalog ({items.length})</h2>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className={`flex items-center gap-3 rounded-xl border border-gray-100 p-3 ${it.active ? "" : "opacity-50"}`}>
              <span className="h-9 w-9 shrink-0 rounded-lg" style={{ background: it.color ?? "#334155" }} />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{it.name} {it.taxable === 0 && <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">TAX-FREE</span>}</div>
                <div className="text-xs text-gray-500">{it.category} · {dollars(it.price_cents)}</div>
              </div>
              <button onClick={() => edit(it)} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">Edit</button>
              <button onClick={() => toggleActive(it)} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">{it.active ? "Hide" : "Show"}</button>
              <button onClick={() => remove(it)} className="rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
