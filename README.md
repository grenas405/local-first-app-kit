# Local-First App Kit

A domain-agnostic template for a **local-first desktop point-of-sale / business app** for a
single-location small business. Fully offline — no cloud, no accounts.

It ships one universal core — *catalog of priced things → cart → paid transaction → receipt →
dashboard* — and you brand it for a specific business by applying **one domain pack**. The core
code is identical across domains; only the domain pack changes.

## Architecture

- **Electron shell** (Node main process): window, spawns the backend sidecar, polls `/health`,
  exposes a minimal IPC bridge for print / save-PDF.
- **Deno + Hono backend**: HTTP API bound strictly to `127.0.0.1`, SQLite via `node:sqlite`
  (no native build), all money math server-side.
- **Vite + React + TypeScript + Tailwind renderer**: touch-friendly UI talking to the backend
  over loopback.

Packaging: `deno compile` produces a single self-contained backend exe; `electron-builder`
bundles it and produces a Windows NSIS installer. The target PC needs neither Deno nor Node.

## Supported domain packs

`instructions.json → domainPacks` currently includes:

| Pack          | App name         | Example categories                                   |
|---------------|------------------|------------------------------------------------------|
| `tire_shop`   | Rivera Tire POS  | New/Used Tires, Service, TPMS, Alignment, Fees       |
| `hair_salon`  | Salon POS        | Haircuts, Color, Styling, Treatments, Retail         |
| `barber_shop` | Barber Shop POS  | Haircuts, Beard & Shave, Kids & Seniors, Retail      |
| `detail_shop` | Detail Shop POS  | Packages, Exterior, Interior, Protection, Fees       |
| `flower_shop` | Flower Shop POS  | Bouquets, Arrangements, Plants, Delivery, Fees       |

## Building a new domain

`instructions.json` is the full spec for an LLM coding agent. Read it top to bottom, build the
core exactly as specified, then apply one domain pack. Customization is limited to:

1. `backend/db.ts` `seed()` — settings defaults + `SEED_CATALOG`.
2. `renderer/src/catalog-meta.ts` — `CATEGORIES` presets + `COLORS` palette.
3. Brand accent color — `renderer/src/index.css` `--brand-*` CSS vars.
4. Logo — run `scripts/embed-logo.mjs` to bake it into `backend/logo.ts` and copy it to the renderer.
5. `package.json` — `name`, `description`, `build.appId`, `build.productName`, `build.nsis.shortcutName`.
6. Optional UI relabeling (e.g. tab `Register` → `Checkout`) and receipt wording.

To add a brand-new domain, append a pack under `instructions.json → domainPacks` (see
`barber_shop` for the shape) — do not fork the core.

## Tasks

Backend (Deno):

```sh
deno task dev            # watch + run backend on 127.0.0.1
deno task test           # backend tests
deno task build:backend  # compile the Windows sidecar exe (dist/app-backend.exe)
```

Shell + renderer (npm):

```sh
npm run dev    # vite + electron
npm run build  # build renderer + electron
npm run dist    # full Windows NSIS installer
```

See `CHANGES.md` for the changelog. Honor every entry in `instructions.json → constraints` —
each encodes a real bug fixed in the reference implementation.
