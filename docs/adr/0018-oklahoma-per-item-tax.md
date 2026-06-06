---
title: Oklahoma Per Item Tax
audience: [human, ai]
summary: Tax is per-line, not per-sale. catalog_items and sale_line_items carry a taxable (0/1) column (added via addColumnIfMissing, default 1). computeTotals() sums the tax base over taxable lines ONLY, t…
status: active
source_of_truth: instructions.json#/constraints/17
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0018 — Oklahoma Per Item Tax

> Generated from `instructions.json#/constraints` (id: `oklahoma-per-item-tax`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Oklahoma taxes tangible retail goods but exempts most personal services (haircuts, beard trims, salon services). A flat rate over the whole subtotal over-charges tax on exempt service lines, which is a real compliance problem for barber/salon/detail domains. A mixed cart (taxable retail + exempt service) must tax only the retail portion.

## Decision
Tax is per-line, not per-sale. catalog_items and sale_line_items carry a taxable (0/1) column (added via addColumnIfMissing, default 1). computeTotals() sums the tax base over taxable lines ONLY, then applies the single tax_rate. Snapshot taxable into sale_line_items at sale time.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
