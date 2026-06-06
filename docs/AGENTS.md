---
title: AGENTS — Entry Point for AI Coding Agents
audience: [ai, human]
summary: The read order, guardrails, and the constraints-as-law workflow an AI agent must follow before changing this kit.
status: active
source_of_truth: instructions.json
related: [docs/meta/DOCUMENTATION.md, docs/spec/GLOSSARY.md]
updated: 2026-06-05
---

# AGENTS.md — Start Here If You Are an AI

You are about to modify a **local-first POS kit**. It is small on purpose and every non-obvious
choice is already paid for in someone else's debugging time. Move with that respect.

## Read order (do not skip)

1. **`instructions.json`** — the full build spec. Architecture, data model, API, and the
   `constraints[]` array. This file is authoritative; this repo implements it.
2. **`docs/spec/GLOSSARY.md`** — so you never rename `sales` to `tickets`.
3. **The relevant `docs/adr/*`** — the human-readable *why* behind each constraint.
4. Only then, the code.

## The constraints are law

`instructions.json#/constraints` is a **living log of real bugs**. Each entry is a rule you must
not break and a reason you must not forget. A few that bite hardest:

- **[[money-integer-cents]]** — integer cents everywhere. No floats for money.
- **[[server-side-totals]]** — the backend recomputes every total. Never trust the client.
- **[[oklahoma-per-item-tax]]** — tax only the lines whose `taxable` flag is true.
- **[[local-day-grouping]]** — group by `sale_date` (local), not the UTC slice of `created_at`.
- **[[deno-compile-no-npm]]**, **[[commonjs-preload]]**, **[[vite-relative-base]]** — packaging
  traps that produce a broken-looking app if violated.

## When you fix a new non-obvious bug

Append to the law. Three steps, in order:

1. Add a new object to `instructions.json#/constraints` — `{ id, rule, why }`, `id` in `kebab-case`.
2. Run `node scripts/gen-adrs.mjs` to materialize its ADR under `docs/adr/`.
3. Run `deno task docs:check` until green (schema + frontmatter + manifest + ADR coverage).

## Guardrails

- **One core, switchable packs.** Domain differences live ONLY in `domains/*/pack.json` and the
  files `scripts/apply-domain.mjs` generates. If you find yourself editing core code to support a
  domain, stop — you are doing it wrong.
- **Loopback only.** The backend binds `127.0.0.1`. Never expose it.
- **Additive migrations.** `CREATE TABLE IF NOT EXISTS` + `addColumnIfMissing` + backfill. Never
  drop or rewrite a column on upgrade — installed copies hold a business's live data.
- **Update `CHANGES.md`** (and `README.md` if the human story changes) with every shippable edit.

## Verify before you claim done

```sh
deno task test        # backend unit tests, including OK per-line tax
deno task docs:check  # spec schema + frontmatter + manifest + ADR coverage
npm run build:renderer
```
