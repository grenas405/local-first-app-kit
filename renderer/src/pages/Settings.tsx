import { useEffect, useState } from "react";
import { api } from "../api";
import type { Settings as SettingsType } from "../types";

const FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "business_name", label: "Business name" },
  { key: "business_address", label: "Address", multiline: true },
  { key: "business_phone", label: "Phone" },
  { key: "receipt_footer", label: "Receipt footer", multiline: true },
];

export function Settings({ onSaved }: { onSaved: () => void }) {
  const [s, setS] = useState<SettingsType>({});
  const [taxPct, setTaxPct] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings().then((data) => {
      setS(data);
      setTaxPct(((Number(data.tax_rate ?? "0")) * 100).toString());
    });
  }, []);

  async function save() {
    const rate = (Number(taxPct) / 100).toString();
    const next = await api.saveSettings({ ...s, tax_rate: rate });
    setS(next);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-medium text-gray-600">{f.label}</span>
            {f.multiline ? (
              <textarea value={s[f.key] ?? ""} onChange={(e) => setS({ ...s, [f.key]: e.target.value })} rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
            ) : (
              <input value={s[f.key] ?? ""} onChange={(e) => setS({ ...s, [f.key]: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
            )}
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-600">Sales tax rate (%)</span>
          <input value={taxPct} onChange={(e) => setTaxPct(e.target.value)} inputMode="decimal" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
          <span className="mt-1 block text-xs text-gray-400">Oklahoma City combined rate is 8.625%. Tax applies only to items marked taxable in the Catalog.</span>
        </label>
        <button onClick={save} className="bg-brand w-full rounded-xl py-3 font-semibold text-white">{saved ? "Saved ✓" : "Save settings"}</button>
      </div>
      <p className="mt-6 text-center text-xs text-gray-400">Local-First App Kit · v{__APP_VERSION__}</p>
    </div>
  );
}
