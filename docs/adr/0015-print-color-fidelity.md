---
title: Print Color Fidelity
audience: [human, ai]
summary: Receipts that use color (brand bars, logos) MUST set '-webkit-print-color-adjust: exact; print-color-adjust: exact;' and an '@page { size: 80mm auto; margin: 0 }'. Electron's webContents.print() ha…
status: active
source_of_truth: instructions.json#/constraints/14
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0015 — Print Color Fidelity

> Generated from `instructions.json#/constraints` (id: `print-color-fidelity`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Without print-color-adjust, Chromium drops background colors when printing/exporting. Staff expect to see the receipt before printing; webContents.print() jumps straight to the OS dialog, so the iframe IS the preview (and gives the browser's native preview during dev).

## Decision
Receipts that use color (brand bars, logos) MUST set '-webkit-print-color-adjust: exact; print-color-adjust: exact;' and an '@page { size: 80mm auto; margin: 0 }'. Electron's webContents.print() has NO preview pane, so provide an in-app preview by rendering the receipt HTML in a sandboxed <iframe srcDoc=...> with Print / Save PDF buttons.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
