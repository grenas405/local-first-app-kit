---
title: Version In Ui And Changelog
audience: [human, ai]
summary: Inject the package.json version at build time (Vite define __APP_VERSION__) and show it subtly in the header + a Settings 'About' line. Bump package.json version and add a CHANGES.md entry for ever…
status: active
source_of_truth: instructions.json#/constraints/11
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# ADR 0012 — Version In Ui And Changelog

> Generated from `instructions.json#/constraints` (id: `version-in-ui-and-changelog`). Do not edit by hand —
> edit the constraint and run `node scripts/gen-adrs.mjs`.

## Status
**active** — this is enforced law in the codebase.

## Context
Lets staff/support identify the running build; keeps in-place installer upgrades clean (NSIS upgrades require an equal-or-higher version).

## Decision
Inject the package.json version at build time (Vite define __APP_VERSION__) and show it subtly in the header + a Settings 'About' line. Bump package.json version and add a CHANGES.md entry for every shippable change.

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set `status: superseded`) and update the constraint rather than silently dropping it.
