---
title: Deno Compile No Npm
audience: [human, ai]
summary: The deno.json build:backend task MUST pass --no-npm and set "nodeModulesDir": "none".
status: active
source_of_truth: instructions.json#/constraints/3
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0004 — Deno Compile No Npm

> Generated from `instructions.json#/constraints` (id: `deno-compile-no-npm`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Otherwise deno compile detects the Electron package.json and embeds the entire node_modules tree into the backend exe (hundreds of MB).

## Decision
The deno.json build:backend task MUST pass --no-npm and set "nodeModulesDir": "none".

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
