---
title: Vite Relative Base
audience: [human, ai]
summary: Set "base": "./" in vite.config.ts so the built index.html references ./assets/... (relative), not /assets/... (absolute).
status: active
source_of_truth: instructions.json#/constraints/12
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0013 — Vite Relative Base

> Generated from `instructions.json#/constraints` (id: `vite-relative-base`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
The packaged app loads index.html over the file:// protocol. Absolute /assets/ paths resolve to the filesystem root and 404, leaving a blank window. Add did-fail-load logging in electron/main.ts so a load failure is never silent.

## Decision
Set "base": "./" in vite.config.ts so the built index.html references ./assets/... (relative), not /assets/... (absolute).

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
