---
title: Offline Charts
audience: [human, ai]
summary: Render charts/sparklines as inline SVG. Do not add a charting dependency.
status: active
source_of_truth: instructions.json#/constraints/10
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0011 — Offline Charts

> Generated from `instructions.json#/constraints` (id: `offline-charts`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Keeps the app fully offline and the bundle small.

## Decision
Render charts/sparklines as inline SVG. Do not add a charting dependency.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
