---
title: Embed Binary Assets
audience: [human, ai]
summary: Any static asset the BACKEND serves (logo, images) must be embedded as a base64 data URI compiled into the exe — generate a TS module (e.g. backend/logo.ts via scripts/embed-logo.mjs) and import it…
status: active
source_of_truth: instructions.json#/constraints/13
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0014 — Embed Binary Assets

> Generated from `instructions.json#/constraints` (id: `embed-binary-assets`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
The backend ships as a single 'deno compile' exe with no asset files on disk, so it cannot read a logo from the filesystem at runtime. Inlined data URIs also avoid async <img> load races during print()/printToPDF().

## Decision
Any static asset the BACKEND serves (logo, images) must be embedded as a base64 data URI compiled into the exe — generate a TS module (e.g. backend/logo.ts via scripts/embed-logo.mjs) and import it. The RENDERER imports the same file as a normal Vite asset (import logoUrl from './assets/x.jpg').

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
