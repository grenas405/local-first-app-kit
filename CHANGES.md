# Changelog

All notable changes to the Local-First App Kit are documented here.

## [0.6.0] — 2026-06-06 — OKC Edition: full implementation

The kit goes from spec to a working application, tailored to Oklahoma City small businesses.

### Added — application core
- **Backend** (`backend/`): Deno + Hono API bound to `127.0.0.1`; `node:sqlite` persistence with
  the four-table schema; server-side money math in integer cents; transactional `createSale`;
  catalog CRUD (soft-hide + permanent delete); `dashboard(range)` KPIs/series/mix; daily
  checkpoint+copy backups; `server_test.ts` with **12 passing tests**.
- **Oklahoma per-item tax** (new constraint `oklahoma-per-item-tax`): `taxable` column on
  `catalog_items` and `sale_line_items` (additive migration, backfills to 1); `computeTotals`
  taxes only taxable lines. A mixed cart taxes goods, not exempt services.
- **Electron shell** (`electron/`): free-port pick, sidecar spawn (packaged: `windowsHide` +
  `stdio:'ignore'`), health poll, `did-fail-load` logging, print/save-PDF IPC; CommonJS preload.
- **Renderer** (`renderer/`): React + Vite + Tailwind — Checkout (per-line tax, cash/card),
  dark Dashboard (count-up KPIs, inline-SVG sparkline + cash/card mix), Catalog (Taxable toggle),
  Settings; sandboxed `<iframe>` receipt preview.

### Added — domain engine (one core, switchable packs)
- `domains/okc-{barber,salon,detail,flower}/pack.json` with OKC branding, seed catalogs, and
  Oklahoma-correct taxability; a `pack.schema.json`; and `scripts/apply-domain.mjs` that
  materializes all per-domain generated files. `kit.config.json` selects the active pack.

### Added — meta-documentation system (humans + AI)
- Dual-audience frontmatter contract + `scripts/validate-docs.mjs` gate.
- JSON-Schema for `instructions.json`; ADRs **generated** from `constraints[]`
  (`scripts/gen-adrs.mjs`); architecture, data-model, OKC-compliance, pack guide, and four
  runbooks. `deno task docs:check` validates schema + frontmatter + manifest + ADR sync.

### Changed
- Scaffolded `vite.config.ts` (relative base, `__APP_VERSION__`), Tailwind/PostCSS/TS configs,
  `.gitignore`. Version bumped to `0.6.0`.

## [0.5.x] — kit genericization

### Changed
- Genericized the kit configs so they are no longer tied to a single business instance:
  - `package.json`: `name` → `local-first-app-kit`, `productName`/NSIS shortcut → `Local-First POS`, `appId` → `com.example.localfirstpos`, and a domain-agnostic `description`.
  - `package.json` + `deno.json`: backend artifact renamed `k-saloon-backend(.exe)` → `app-backend(.exe)` (compile output and Electron `extraResources`).
- `instructions.json`: `purpose` now lists barber shops among the supported domains.

### Added
- `instructions.json`: new `barber_shop` domainPack (categories, seed catalog, tip/walk-in notes).
- This `CHANGES.md` and a top-level `README.md`.
