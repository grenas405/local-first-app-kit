---
title: Commonjs Preload
audience: [human, ai]
summary: Compile electron/ (main + preload) as CommonJS, and write a dist-electron/package.json containing {"type":"commonjs"} during the build. The root package.json is "type":"module".
status: active
source_of_truth: instructions.json#/constraints/5
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0006 — Commonjs Preload

> Generated from `instructions.json#/constraints` (id: `commonjs-preload`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Electron's sandboxed preload cannot be an ES module; an ESM preload silently fails to load, leaving window.app undefined (print/save-PDF break).

## Decision
Compile electron/ (main + preload) as CommonJS, and write a dist-electron/package.json containing {"type":"commonjs"} during the build. The root package.json is "type":"module".

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
