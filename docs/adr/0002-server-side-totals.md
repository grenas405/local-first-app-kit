---
title: Server Side Totals
audience: [human, ai]
summary: The backend recomputes subtotal/tax/total from line items and the stored tax rate on every create. Never trust totals sent by the client.
status: active
source_of_truth: instructions.json#/constraints/1
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0002 — Server Side Totals

> Generated from `instructions.json#/constraints` (id: `server-side-totals`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Integrity and tamper-resistance.

## Decision
The backend recomputes subtotal/tax/total from line items and the stored tax rate on every create. Never trust totals sent by the client.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
