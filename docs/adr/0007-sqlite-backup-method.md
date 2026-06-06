---
title: Sqlite Backup Method
audience: [human, ai]
summary: For backups, do NOT use 'VACUUM INTO' (unsupported by node:sqlite — attached-db limit is 0). Instead run PRAGMA wal_checkpoint(TRUNCATE) then copy the db file.
status: active
source_of_truth: instructions.json#/constraints/6
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0007 — Sqlite Backup Method

> Generated from `instructions.json#/constraints` (id: `sqlite-backup-method`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
node:sqlite limitation; checkpoint+copy yields a consistent standalone snapshot.

## Decision
For backups, do NOT use 'VACUUM INTO' (unsupported by node:sqlite — attached-db limit is 0). Instead run PRAGMA wal_checkpoint(TRUNCATE) then copy the db file.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
