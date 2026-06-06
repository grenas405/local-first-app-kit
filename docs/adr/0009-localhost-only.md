---
title: Localhost Only
audience: [human, ai]
summary: Bind the backend to 127.0.0.1 only. Pick a free ephemeral port at launch; the renderer learns it via a ?port= query param and/or the preload bridge.
status: active
source_of_truth: instructions.json#/constraints/8
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0009 — Localhost Only

> Generated from `instructions.json#/constraints` (id: `localhost-only`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Security; never expose the API to the network.

## Decision
Bind the backend to 127.0.0.1 only. Pick a free ephemeral port at launch; the renderer learns it via a ?port= query param and/or the preload bridge.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
