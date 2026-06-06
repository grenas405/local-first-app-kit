---
title: How This Documentation Works (Read Me First)
audience: [human, ai]
summary: The meta-guide to the docs system — its tiers, who each tier serves, and how docs stay verifiable instead of rotting.
status: active
source_of_truth: docs/meta/DOCUMENTATION.md
related: [docs/meta/FRONTMATTER.md, docs/AGENTS.md, docs/INDEX.md]
updated: 2026-06-05
---

# How This Documentation Works

This is documentation **about** the documentation — the map of the map. Read it once and you
will know where any fact lives and how much to trust it.

Two commitments shape everything here:

1. **Dual-audience by contract.** Every doc serves a human *and* a machine, declared in
   [frontmatter](FRONTMATTER.md). Humans get prose; agents get an index card.
2. **Derived & verifiable, not decorative.** Facts have a single source of truth. Views of
   those facts (like ADRs) are generated, and `scripts/validate-docs.mjs` fails CI if a doc
   drifts, loses its frontmatter, or falls out of the [manifest](../manifest.json).

## The tiers

| Tier | Lives in | Serves | Source of truth |
|------|----------|--------|-----------------|
| **0 — Meta** | `docs/meta/` | both | itself |
| **1 — AI build spec** | `instructions.json` + `docs/spec/instructions.schema.json` | ai (primary) | `instructions.json` |
| **2 — Architecture** | `docs/architecture/` | both | the spec + the code |
| **3 — Decisions (ADRs)** | `docs/adr/` | both | `instructions.json#/constraints` |
| **4 — Domains** | `docs/domains/` + `domains/*/pack.json` | both | the pack files |
| **5 — Operations** | `docs/runbooks/` | human (primary) | the code + this repo |

## The golden rule of authority

> If a fact appears in two places, **one of them is a copy.** The copy must name its
> `source_of_truth` in frontmatter, and ideally be generated rather than hand-written.

The clearest example: the [`constraints[]`](../../instructions.json) array is the *living law*
of this codebase — each entry is a real bug someone already paid for. The human-friendly
[ADRs](../adr/) are a **generated view** of that array (`scripts/gen-adrs.mjs`). Edit the
constraint; regenerate the ADR. Never the reverse.

## Navigation by role

- **New human contributor** → [`docs/INDEX.md`](../INDEX.md) → [`architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md).
- **Shop owner / operator** → [`runbooks/`](../runbooks/) and [`domains/OKC-COMPLIANCE.md`](../domains/OKC-COMPLIANCE.md).
- **AI coding agent** → [`docs/AGENTS.md`](../AGENTS.md) (read order + the constraints law).

## Keeping it honest

`deno task docs:check` (or `npm run docs:check`) runs `scripts/validate-docs.mjs`:
it validates `instructions.json` against its schema, validates every domain pack, and asserts
that every `docs/**/*.md` has conformant frontmatter and a matching `manifest.json` entry.
Green check, trustworthy docs.
