---
title: Additive Migrations
audience: [human, ai]
summary: Schema changes are additive and idempotent: CREATE TABLE IF NOT EXISTS, plus an addColumnIfMissing(table,col,type) helper that checks PRAGMA table_info before ALTER. Backfill new columns. Never dro…
status: active
source_of_truth: instructions.json#/constraints/7
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0008 — Additive Migrations

> Generated from `instructions.json#/constraints` (id: `additive-migrations`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Installed copies already hold the business's live data.

## Decision
Schema changes are additive and idempotent: CREATE TABLE IF NOT EXISTS, plus an addColumnIfMissing(table,col,type) helper that checks PRAGMA table_info before ALTER. Backfill new columns. Never drop/rewrite existing data on upgrade.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
