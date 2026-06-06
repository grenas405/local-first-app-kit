---
title: Runbook — Build & Run
audience: [human, ai]
summary: From a fresh clone to a running dev app and a packaged Windows installer, with the domain-switch acceptance check.
status: active
source_of_truth: instructions.json#/buildWorkflow
related: [docs/runbooks/RELEASE.md, docs/domains/PACKS.md]
updated: 2026-06-05
---

# Runbook — Build & Run

Prerequisites: **Deno 2.x**, **Node 20+**, **npm**. Windows is the packaging target.

## Fresh clone

```sh
npm install                       # renderer + electron deps
deno cache backend/server.ts      # warm the Deno module cache
```

The per-domain generated files (`seed.generated.ts`, `logo.ts`, `catalog-meta.ts`,
`brand.generated.css`, `active-logo.svg`) are **committed** — they are import-time dependencies, so
a fresh checkout builds with no generate step. To switch storefronts, run
`node scripts/apply-domain.mjs <pack>` (it overwrites them) and commit the result;
`npm run verify:generated` fails if the committed output drifts from the active pack.

## Develop

```sh
npm run dev          # concurrently: Vite (5173) + Electron (spawns the Deno backend)
# or backend alone:
deno task dev        # watch-mode backend on 127.0.0.1
```

Set `POS_DEBUG=1` to auto-open detached DevTools.

## Verify locally (no Windows needed)

```sh
deno task test       # backend unit tests incl. OK per-line tax
deno task docs:check # spec schema + frontmatter + manifest + ADR coverage
npm run build:renderer
```

**Domain-switch acceptance:** applying a different pack must change only generated files.

```sh
git stash; node scripts/apply-domain.mjs okc-flower
git status --porcelain   # expect ONLY: seed.generated.ts, logo.ts, catalog-meta.ts,
                         # brand.generated.css, assets/active-logo.svg
node scripts/apply-domain.mjs okc-barber; git stash pop
```

## Package the Windows installer

```sh
deno task build:backend   # → dist/app-backend.exe (compiled, --no-terminal, --no-npm)
npm run dist              # vite build + tsc electron + electron-builder --win → release/
```

The backend exe is bundled as an `extraResource`; the target PC needs neither Deno nor Node.
See [RELEASE](RELEASE.md) for version bumps and [TROUBLESHOOTING](TROUBLESHOOTING.md) if the
packaged window is blank or `window.app` is undefined.
