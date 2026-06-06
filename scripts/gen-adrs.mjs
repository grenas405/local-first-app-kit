#!/usr/bin/env node
// gen-adrs.mjs — render one Architecture Decision Record per instructions.json constraint.
//
// The constraints[] array is the LIVING LAW (each entry is a real, already-paid-for bug). The
// ADRs are a *generated human view* of that law — never hand-edit them; edit the constraint and
// rerun. This script also keeps the docs/adr/* entries in docs/manifest.json in sync, preserving
// hand-maintained entries for other tiers.
//
// Usage:  node scripts/gen-adrs.mjs           # write/update ADRs + manifest
//         node scripts/gen-adrs.mjs --check   # fail if anything is out of date (CI)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ADR_DIR = join(ROOT, "docs/adr");
const CHECK = process.argv.includes("--check");
const TODAY = new Date().toISOString().slice(0, 10);

const titleize = (id) => id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const num = (i) => String(i).padStart(4, "0");
const clip = (s, n = 197) => (s.length > n ? s.slice(0, n) + "…" : s);

const constraints = JSON.parse(readFileSync(join(ROOT, "instructions.json"), "utf8")).constraints;

const TEMPLATE = `---
title: ADR Template
audience: [human, ai]
summary: Copy this MADR-style shape when a decision is authored by hand rather than generated from a constraint.
status: active
source_of_truth: docs/adr/0000-template.md
updated: ${TODAY}
---

# ADR NNNN — Title

## Status
active | superseded by [ADR-XXXX](...)

## Context
What forces the decision? What bug or pressure prompted it?

## Decision
The rule we now follow.

## Consequences
What this buys us, and what it costs.
`;

function adrBody(c, i) {
  return `---
title: ${titleize(c.id)}
audience: [human, ai]
summary: ${clip(c.rule.replace(/\n/g, " "))}
status: active
source_of_truth: instructions.json#/constraints/${i - 1}
related: [docs/AGENTS.md, docs/meta/DOCUMENTATION.md]
updated: ${TODAY}
---

# ADR ${num(i)} — ${titleize(c.id)}

> Generated from \`instructions.json#/constraints\` (id: \`${c.id}\`). Do not edit by hand —
> edit the constraint and run \`node scripts/gen-adrs.mjs\`.

## Status
**active** — this is enforced law in the codebase.

## Context
${c.why}

## Decision
${c.rule}

## Consequences
Following this rule prevents the failure described in Context. Violating it reintroduces a bug
that was already paid for once. If a future change makes this rule obsolete, supersede this ADR
(set \`status: superseded\`) and update the constraint rather than silently dropping it.
`;
}

// Compute the desired file set.
const desired = new Map();
desired.set("0000-template.md", TEMPLATE);
constraints.forEach((c, idx) => desired.set(`${num(idx + 1)}-${c.id}.md`, adrBody(c, idx + 1)));

// The `updated:` date is wall-clock and not a drift signal — normalize it out when comparing,
// so --check stays green across days without churning the files.
const stripVolatile = (s) => s.replace(/^updated: .*$/m, "updated: <date>");

if (CHECK) {
  const problems = [];
  const onDisk = existsSync(ADR_DIR) ? readdirSync(ADR_DIR).filter((f) => f.endsWith(".md")) : [];
  for (const [name, body] of desired)
    if (!existsSync(join(ADR_DIR, name)) || stripVolatile(readFileSync(join(ADR_DIR, name), "utf8")) !== stripVolatile(body))
      problems.push(`stale or missing: docs/adr/${name}`);
  for (const f of onDisk) if (!desired.has(f)) problems.push(`orphan ADR (no matching constraint): docs/adr/${f}`);
  if (problems.length) {
    console.error("✗ ADRs out of date:\n" + problems.map((p) => "  - " + p).join("\n") + "\n  run: node scripts/gen-adrs.mjs");
    process.exit(1);
  }
  console.log("✓ ADRs are in sync with instructions.json constraints");
  process.exit(0);
}

// Write mode: materialize ADRs, prune orphans.
mkdirSync(ADR_DIR, { recursive: true });
for (const f of readdirSync(ADR_DIR).filter((f) => f.endsWith(".md")))
  if (!desired.has(f)) rmSync(join(ADR_DIR, f));
for (const [name, body] of desired) writeFileSync(join(ADR_DIR, name), body);

// Keep docs/manifest.json in sync: regenerate docs/adr/* entries, preserve the rest.
const manifestPath = join(ROOT, "docs/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const nonAdr = manifest.docs.filter((d) => !d.path.startsWith("docs/adr/"));
const adrEntries = [...desired.keys()].sort().map((name) => {
  const id = name.replace(/^\d+-/, "").replace(/\.md$/, "");
  const c = constraints.find((x) => x.id === id);
  return { path: `docs/adr/${name}`, tier: 3, audience: ["human", "ai"], summary: c ? clip(c.rule.replace(/\n/g, " "), 120) : "ADR template." };
});
manifest.docs = [...nonAdr, ...adrEntries];
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`✓ generated ${desired.size} ADRs (1 template + ${constraints.length} constraints) and synced manifest`);
