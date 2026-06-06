---
title: Runbook — Troubleshooting
audience: [human, ai]
summary: Symptom-to-cause table for the classic packaging traps (blank window, missing window.app, console flash, fat exe) mapped to the constraint that fixes each.
status: active
source_of_truth: instructions.json#/constraints
related: [docs/runbooks/BUILD.md, docs/architecture/ARCHITECTURE.md]
updated: 2026-06-05
---

# Runbook — Troubleshooting

Most failures in a kit instance are one of a handful of known packaging traps. Each maps to a
constraint (an ADR) that explains the fix.

| Symptom | Likely cause | Fix / ADR |
|---------|--------------|-----------|
| **Blank window** in the packaged app | `index.html` uses absolute `/assets/...` over `file://` | Set `base: "./"` in vite.config.ts ([[vite-relative-base]]). Check `did-fail-load` logs. |
| **Print / Save-PDF do nothing**, `window.app` is `undefined` | preload loaded as ESM | Compile electron/ as CommonJS + write `dist-electron/package.json {"type":"commonjs"}` ([[commonjs-preload]]). |
| A **black console window** opens beside the app | sidecar compiled/spawned with a console | `deno compile --no-terminal` + spawn with `windowsHide:true, stdio:'ignore'` ([[windows-sidecar-no-console]]). |
| Backend exe is **hundreds of MB** | `deno compile` embedded node_modules | `--no-npm` + `"nodeModulesDir":"none"` ([[deno-compile-no-npm]]). |
| **Receipt prints without colors** | Chromium drops backgrounds | `print-color-adjust: exact` + `printBackground:true` ([[print-color-fidelity]]). |
| **Evening sales missing from "today"** | grouping by UTC slice of `created_at` | group by local `sale_date` ([[local-day-grouping]]). |
| **Totals look a cent off** | float money math, or trusting client totals | integer cents + server recompute ([[money-integer-cents]], [[server-side-totals]]). |
| **New Settings key won't save** | not in the allow-list, or seed never re-ran | add it in db.ts seed + routes/settings ALLOWED + a fallback default ([[additive-settings-keys]]). |
| **Tax charged on a haircut** | item not marked exempt | toggle **Taxable** off in Catalog ([[oklahoma-per-item-tax]], [OKC-COMPLIANCE](../domains/OKC-COMPLIANCE.md)). |

## First moves

1. Launch with `POS_DEBUG=1` to open DevTools and watch the console.
2. Hit `http://127.0.0.1:<port>/health` — if it fails, the sidecar didn't start (check the exe
   path under `resources/backend/` and that the port was free).
3. Reproduce the backend behavior headless: `deno task dev` then `curl` the API directly. If it's
   correct there, the bug is in the renderer or the shell, not the data layer.
