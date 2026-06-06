---
title: Node Sqlite Row Typing
audience: [human, ai]
summary: node:sqlite .all()/.get() return Record<string, SQLOutputValue>. Cast typed rows through unknown first: 'stmt.all() as unknown as Row[]'. Coerce money columns with Number() at the boundary if doing…
status: active
source_of_truth: instructions.json#/constraints/16
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0017 — Node Sqlite Row Typing

> Generated from `instructions.json#/constraints` (id: `node-sqlite-row-typing`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
TypeScript rejects a direct cast from the SQLOutputValue record to a named interface ('neither type sufficiently overlaps'). Casting via unknown is the intended escape hatch.

## Decision
node:sqlite .all()/.get() return Record<string, SQLOutputValue>. Cast typed rows through unknown first: 'stmt.all() as unknown as Row[]'. Coerce money columns with Number() at the boundary if doing arithmetic.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
