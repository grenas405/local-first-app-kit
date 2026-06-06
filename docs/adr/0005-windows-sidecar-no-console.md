---
title: Windows Sidecar No Console
audience: [human, ai]
summary: The Windows backend exe MUST be compiled with deno compile --no-terminal, and Electron MUST spawn the packaged sidecar with windowsHide:true and stdio:'ignore' (dev may keep stdio:'inherit').
status: active
source_of_truth: instructions.json#/constraints/4
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0005 — Windows Sidecar No Console

> Generated from `instructions.json#/constraints` (id: `windows-sidecar-no-console`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Without these, launching the installed POS also opens a visible backend console window, which looks broken to staff and invites accidental closure of the sidecar.

## Decision
The Windows backend exe MUST be compiled with deno compile --no-terminal, and Electron MUST spawn the packaged sidecar with windowsHide:true and stdio:'ignore' (dev may keep stdio:'inherit').

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
