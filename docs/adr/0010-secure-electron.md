---
title: Secure Electron
audience: [human, ai]
summary: contextIsolation: true, nodeIntegration: false. Expose only an explicit, minimal API via contextBridge (e.g., window.app = { backendBaseUrl, printDoc, savePdf }).
status: active
source_of_truth: instructions.json#/constraints/9
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0010 — Secure Electron

> Generated from `instructions.json#/constraints` (id: `secure-electron`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Standard Electron security posture.

## Decision
contextIsolation: true, nodeIntegration: false. Expose only an explicit, minimal API via contextBridge (e.g., window.app = { backendBaseUrl, printDoc, savePdf }).

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
