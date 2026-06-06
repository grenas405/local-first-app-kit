import { useEffect, useState } from "react";
import { api } from "../api";

// Renders the backend's receipt HTML in a sandboxed <iframe srcDoc> — this IS the preview, since
// Electron's webContents.print() has no preview pane (constraint: print-color-fidelity). Print and
// Save-PDF route through the preload bridge; in a plain browser they fall back to window.print().
export function ReceiptPreview({ saleId, onClose }: { saleId: number; onClose: () => void }) {
  const [html, setHtml] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(api.receiptUrl(saleId)).then((r) => r.text()).then(setHtml);
  }, [saleId]);

  async function print() {
    setBusy(true);
    try {
      if (window.app?.printDoc) await window.app.printDoc(html);
      else {
        const w = window.open("", "_blank");
        w?.document.write(html);
        w?.document.close();
        w?.print();
      }
    } finally {
      setBusy(false);
    }
  }

  async function savePdf() {
    setBusy(true);
    try {
      if (window.app?.savePdf) await window.app.savePdf(html);
      else alert("Save-PDF is available in the desktop app.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Receipt</h3>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <iframe
            title={`receipt-${saleId}`}
            srcDoc={html}
            sandbox=""
            className="mx-auto block h-[60vh] w-[320px] rounded-lg border border-gray-200 bg-white shadow"
          />
        </div>
        <div className="flex gap-3 border-t border-gray-100 p-4">
          <button
            onClick={savePdf}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Save PDF
          </button>
          <button
            onClick={print}
            disabled={busy}
            className="bg-brand flex-1 rounded-xl py-3 font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
