# Local-First App Kit — OKC Edition

**One core. Many storefronts. Documentation a human *and* a machine can both trust.**

A production-grade template for a **local-first desktop point-of-sale app** for a single-location
small business. It runs fully offline on one PC — no cloud, no accounts, no network exposure — and
it ships with four ready-to-brand **Oklahoma City** storefronts.

The core is universal: *catalog of priced things → cart → paid transaction → receipt → dashboard.*
You brand it by applying **one domain pack**. The core source never changes between domains.

```
┌──────────────── Electron shell (Node) ────────────────┐
│ window · picks a free 127.0.0.1 port · spawns the     │
│ Deno sidecar · polls /health · print & save-PDF IPC   │
└───────┬───────────────────────────────────┬───────────┘
        │ spawn (POS_PORT, POS_DB_PATH)      │ window.app bridge
        ▼                                    ▼
  Deno + Hono backend  ◄── fetch ──  Vite + React + Tailwind renderer
  127.0.0.1 only · node:sqlite       Checkout · Dashboard · Catalog · Settings
  ALL money math server-side         inline-SVG charts (no chart lib)
```

## What makes it Oklahoma City

- **OKC tax baked in.** Default `tax_rate` is `0.08625` — the combined rate (4.5% state + 1.125%
  county + 3.0% city). See [`docs/domains/OKC-COMPLIANCE.md`](docs/domains/OKC-COMPLIANCE.md).
- **Oklahoma per-item taxability.** Oklahoma taxes tangible goods but exempts most personal
  services. Tax is computed **per line** — a tax-exempt haircut plus a taxable pomade is taxed only
  on the pomade. Every catalog item has a **Taxable** toggle.
- **Four OKC packs out of the box:**

  | Pack | Storefront | Tax posture |
  |------|-----------|-------------|
  | `okc-barber` | Plaza District Barber Co. | services exempt, products taxable |
  | `okc-salon`  | Midtown Salon OKC | services exempt, products taxable |
  | `okc-detail` | Automobile Alley Detailing | labor exempt, retail taxable |
  | `okc-flower` | Paseo Petals | goods taxable, delivery exempt |

## Quick start

```sh
npm install                          # renderer + electron deps
node scripts/apply-domain.mjs okc-barber   # materialize the active pack
deno task test                       # backend tests (incl. OK per-line tax) — 12 green
deno task docs:check                 # spec schema + frontmatter + manifest + ADR coverage
npm run dev                          # Vite + Electron (spawns the Deno backend)
```

Switch storefronts anytime: `node scripts/apply-domain.mjs okc-flower`. Only generated files
change — the core source is byte-identical. Full steps in [`docs/runbooks/BUILD.md`](docs/runbooks/BUILD.md).

## Meta documentation (docs for humans **and** AI)

Documentation here is a first-class product, written twice in one file: machine-parseable
frontmatter for an agent, prose for a person. Start at [`docs/INDEX.md`](docs/INDEX.md) (humans) or
[`docs/AGENTS.md`](docs/AGENTS.md) (AI agents). Highlights:

- **`instructions.json`** — the authoritative AI build spec, validated against a JSON Schema in CI.
- **Architecture Decision Records** — one per `constraints[]` entry, **generated** from the spec
  (`scripts/gen-adrs.mjs`). Each constraint is a real bug already paid for once.
- **The dual-audience frontmatter contract** ([`docs/meta/FRONTMATTER.md`](docs/meta/FRONTMATTER.md)),
  enforced by `scripts/validate-docs.mjs`.

The whole docs system is verifiable: `deno task docs:check` fails if the spec drifts, a doc loses
its frontmatter, a pack is invalid, or an ADR falls out of sync.

## Repository map

```
backend/    Deno + Hono API, node:sqlite, server-side money, receipts, tests
electron/   main + preload (CommonJS); sidecar spawn, health poll, print/PDF IPC
renderer/   React + Vite + Tailwind UI (Checkout, Dashboard, Catalog, Settings)
domains/    okc-{barber,salon,detail,flower}/pack.json + the pack JSON Schema
scripts/    apply-domain · gen-adrs · validate-docs · embed-logo · write-electron-cjs
docs/       the meta-documentation system (meta · spec · architecture · adr · domains · runbooks)
instructions.json   the machine-readable build spec
```

See [`CHANGES.md`](CHANGES.md) for the changelog. Honor every entry in
`instructions.json → constraints` — each encodes a real, fixed bug.
