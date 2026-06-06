---
title: Money Integer Cents
audience: [human, ai]
summary: Store and compute all money as integer cents. Never use floats for currency.
status: active
source_of_truth: instructions.json#/constraints/0
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0001 — Money Integer Cents

> Generated from `instructions.json#/constraints` (id: `money-integer-cents`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Avoids floating-point rounding errors in totals/tax.

## Decision
Store and compute all money as integer cents. Never use floats for currency.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
