---
title: Local Day Grouping
audience: [human, ai]
summary: Store created_at as UTC ISO for display, but also store a separate sale_date = local YYYY-MM-DD and group/report by sale_date.
status: active
source_of_truth: instructions.json#/constraints/2
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0003 — Local Day Grouping

> Generated from `instructions.json#/constraints` (id: `local-day-grouping`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Grouping by the UTC slice of created_at drops evening sales from 'today' in negative UTC offsets. Use a localDateString() helper for both writing sale_date and computing 'today'.

## Decision
Store created_at as UTC ISO for display, but also store a separate sale_date = local YYYY-MM-DD and group/report by sale_date.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
