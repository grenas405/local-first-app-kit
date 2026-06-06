---
title: Additive Settings Keys
audience: [human, ai]
summary: A new settings key must be added in THREE places: (1) seed() defaults in db.ts, (2) the ALLOWED set in routes/settings.ts, and (3) a code-level fallback default where it is consumed (e.g. receipt.t…
status: active
source_of_truth: instructions.json#/constraints/15
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0016 — Additive Settings Keys

> Generated from `instructions.json#/constraints` (id: `additive-settings-keys`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
seed() only runs when the settings table is EMPTY, so already-installed DBs never receive the new key. The consuming code must fall back to a default until the user saves Settings; the allow-list gate silently drops keys it doesn't recognize.

## Decision
A new settings key must be added in THREE places: (1) seed() defaults in db.ts, (2) the ALLOWED set in routes/settings.ts, and (3) a code-level fallback default where it is consumed (e.g. receipt.ts). Never assume the key exists.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
