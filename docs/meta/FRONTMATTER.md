---
title: The Dual-Audience Frontmatter Contract
audience: [human, ai]
summary: Every Markdown doc in this kit opens with a small, machine-parseable header so an AI agent can index it and a human can skim it.
status: active
source_of_truth: docs/meta/FRONTMATTER.md
related: [docs/meta/DOCUMENTATION.md, docs/manifest.json]
updated: 2026-06-05
---

# The Dual-Audience Frontmatter Contract

Documentation in this kit is written **twice in one file**: once for a machine (the
frontmatter block) and once for a human (the prose beneath it). The frontmatter is the
machine's index card; the prose is the human's story. `scripts/validate-docs.mjs` enforces this
contract in CI — a doc without conformant frontmatter fails the build.

## The block

Every `docs/**/*.md` file MUST begin (byte 0, no blank line above) with a fenced YAML block:

```yaml
---
title: Human-readable title
audience: [human, ai]        # non-empty; subset of human | ai
summary: One sentence a machine can index and a human can skim.
status: active               # active | draft | superseded
source_of_truth: instructions.json#/constraints/...   # optional pointer to the canonical fact
related: [docs/adr/0001-money-integer-cents.md]        # optional sibling docs
updated: 2026-06-05          # YYYY-MM-DD, last meaningful edit
---
```

## Field rules (what the validator checks)

| Field | Required | Rule |
|-------|----------|------|
| `title` | yes | Non-empty string. |
| `audience` | yes | Inline array, non-empty, each value `human` or `ai`. |
| `summary` | yes | Non-empty string, ≤ 200 chars. One claim, no markdown. |
| `status` | yes | One of `active`, `draft`, `superseded`. |
| `source_of_truth` | no | Pointer (path, `path#/json/pointer`, or URL) to where the canonical fact lives. |
| `related` | no | Inline array of doc paths. |
| `updated` | yes | `YYYY-MM-DD`. |

> **Why inline arrays?** So the contract is parseable without a YAML dependency — the kit ships
> nothing it doesn't need (see [[offline-charts]] for the same instinct applied to the UI).

## The two audiences, concretely

- **`ai`** — an LLM coding agent reading the repo. It consumes `summary`, `source_of_truth`,
  `status`, and `related` to decide *whether to read further and what is authoritative*. Facts
  it must obey live behind `source_of_truth` (usually `instructions.json#/constraints/...`).
- **`human`** — an owner, operator, or new contributor. They read the prose for the *why* and
  the *how*, and trust that `status: active` means "this is current."

A doc tagged `audience: [human]` is prose a machine can skip; `[ai]` is a spec a human rarely
needs. Most docs here are `[human, ai]` — that is the point.
