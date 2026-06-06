---
title: Documentation Index
audience: [human, ai]
summary: The human map of every doc in the kit, grouped by tier, with a one-line hook each.
status: active
source_of_truth: docs/manifest.json
related: [docs/meta/DOCUMENTATION.md]
updated: 2026-06-05
---

# Documentation Index

The machine reads [`manifest.json`](manifest.json); you read this. New here? Start with
[How This Documentation Works](meta/DOCUMENTATION.md).

## Tier 0 — Meta (docs about docs)
- [DOCUMENTATION.md](meta/DOCUMENTATION.md) — the map of the map; read first.
- [FRONTMATTER.md](meta/FRONTMATTER.md) — the dual-audience header contract.
- [STYLE.md](meta/STYLE.md) — voice, diagrams-as-text, term conventions.

## Tier 1 — AI build spec
- [`instructions.json`](../instructions.json) — the authoritative build spec.
- [instructions.schema.json](spec/instructions.schema.json) — validates the spec in CI.
- [GLOSSARY.md](spec/GLOSSARY.md) — domain words → core schema.
- [AGENTS.md](AGENTS.md) — entry point + read order for AI agents.

## Tier 2 — Architecture
- [ARCHITECTURE.md](architecture/ARCHITECTURE.md) — processes, trust boundaries, data flow.
- [DATA-MODEL.md](architecture/DATA-MODEL.md) — tables, per-item taxability, money-as-cents.

## Tier 3 — Decisions (ADRs)
- [adr/](adr/) — one Architecture Decision Record per `constraints[]` entry, generated from the spec by `scripts/gen-adrs.mjs`.

## Tier 4 — Domains (OKC)
- [OKC-COMPLIANCE.md](domains/OKC-COMPLIANCE.md) — the 8.625% breakdown + OK service-exemption guidance.
- [PACKS.md](domains/PACKS.md) — the four OKC packs (`okc-barber`, `okc-salon`, `okc-detail`, `okc-flower`), pack anatomy, and authoring.

## Tier 5 — Operations (runbooks)
- [BUILD.md](runbooks/BUILD.md), [RELEASE.md](runbooks/RELEASE.md), [BACKUP-RESTORE.md](runbooks/BACKUP-RESTORE.md), [TROUBLESHOOTING.md](runbooks/TROUBLESHOOTING.md).
