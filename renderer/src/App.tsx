import { useEffect, useState } from "react";
import { api } from "./api";
import { APP_NAME, REGISTER_LABEL } from "./catalog-meta";
import logoUrl from "./assets/active-logo.svg";
import { Checkout } from "./pages/Checkout";
import { Dashboard } from "./pages/Dashboard";
import { Catalog } from "./pages/Catalog";
import { Settings } from "./pages/Settings";

type Tab = "checkout" | "dashboard" | "catalog" | "settings";

export default function App() {
  const [tab, setTab] = useState<Tab>("checkout");
  const [taxRate, setTaxRate] = useState(0);

  const loadTax = () => api.settings().then((s) => setTaxRate(Number(s.tax_rate ?? "0")));
  useEffect(() => { loadTax(); }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "checkout", label: REGISTER_LABEL },
    { key: "dashboard", label: "Dashboard" },
    { key: "catalog", label: "Catalog" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="bg-brand flex items-center justify-between px-5 py-3 text-white shadow">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt={APP_NAME} className="h-9 rounded-lg" />
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </div>
        <nav className="flex gap-1 rounded-xl bg-white/15 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === t.key ? "bg-white text-gray-900 shadow" : "text-white/90 hover:bg-white/10"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <span className="text-xs text-white/70">v{__APP_VERSION__}</span>
      </header>

      <main className="min-h-0 flex-1 overflow-auto">
        {tab === "checkout" && <Checkout taxRate={taxRate} />}
        {tab === "dashboard" && <Dashboard />}
        {tab === "catalog" && <Catalog />}
        {tab === "settings" && <Settings onSaved={loadTax} />}
      </main>
    </div>
  );
}
