#!/usr/bin/env node
// validate-docs.mjs — the docs:check gate.
//
// Dependency-free (Node built-ins only — same offline ethos as the app). It:
//   1. validates instructions.json against docs/spec/instructions.schema.json
//   2. validates every domains/*/pack.json against domains/_schema/pack.schema.json
//   3. asserts a 1:1 mapping between docs/**/*.md and docs/manifest.json, and that
//      every doc has conformant dual-audience frontmatter
//   4. (if any ADRs exist) asserts ADR coverage of instructions.json#/constraints
//
// Exit 0 = green. Exit 1 = at least one violation (printed).

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validate as schemaValidate } from "./lib/jsonschema.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (msg) => errors.push(msg);

// Run the shared schema validator and fold any problems into our error list.
const validate = (data, schema, path = "") => {
  for (const e of schemaValidate(data, schema, path)) errors.push(e);
};

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

// ─── frontmatter parser (inline-array YAML subset, no dependency) ────────────
function parseFrontmatter(text, file) {
  if (!text.startsWith("---\n")) { fail(`${file}: missing frontmatter block at byte 0`); return null; }
  const end = text.indexOf("\n---", 4);
  if (end === -1) { fail(`${file}: unterminated frontmatter block`); return null; }
  const body = text.slice(4, end);
  const fm = {};
  for (const raw of body.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!m) { fail(`${file}: unparseable frontmatter line: ${JSON.stringify(line)}`); continue; }
    const [, key, rest] = m;
    let val = rest.replace(/\s+#.*$/, "").trim(); // strip trailing comments
    if (val.startsWith("[") && val.endsWith("]"))
      fm[key] = val.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    else fm[key] = val;
  }
  return fm;
}

const FM_STATUS = ["active", "draft", "superseded"];
function checkFrontmatter(fm, file) {
  const need = ["title", "audience", "summary", "status", "updated"];
  for (const k of need) if (!(k in fm)) fail(`${file}: frontmatter missing '${k}'`);
  if (fm.audience) {
    if (!Array.isArray(fm.audience) || fm.audience.length === 0) fail(`${file}: 'audience' must be a non-empty inline array`);
    else for (const a of fm.audience) if (!["human", "ai"].includes(a)) fail(`${file}: audience value '${a}' not in [human, ai]`);
  }
  if (fm.status && !FM_STATUS.includes(fm.status)) fail(`${file}: status '${fm.status}' not in ${JSON.stringify(FM_STATUS)}`);
  if (fm.summary && typeof fm.summary === "string" && fm.summary.length > 200) fail(`${file}: summary exceeds 200 chars`);
  if (fm.updated && !/^\d{4}-\d{2}-\d{2}$/.test(fm.updated)) fail(`${file}: updated '${fm.updated}' is not YYYY-MM-DD`);
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// ─── 1. instructions.json ───────────────────────────────────────────────────
console.log("• validating instructions.json against its schema");
validate(readJson("instructions.json"), readJson("docs/spec/instructions.schema.json"));

// ─── 2. domain packs ────────────────────────────────────────────────────────
const domainsDir = join(ROOT, "domains");
if (existsSync(domainsDir)) {
  const packSchema = readJson("domains/_schema/pack.schema.json");
  for (const name of readdirSync(domainsDir)) {
    if (name.startsWith("_")) continue;
    const packPath = join(domainsDir, name, "pack.json");
    if (!existsSync(packPath)) continue;
    console.log(`• validating domains/${name}/pack.json`);
    const pack = JSON.parse(readFileSync(packPath, "utf8"));
    validate(pack, packSchema, `${name}`);
    if (pack.pack !== name) fail(`domains/${name}/pack.json: 'pack' is '${pack.pack}', expected '${name}'`);
  }
}

// ─── 3. docs frontmatter + manifest 1:1 ─────────────────────────────────────
console.log("• checking docs frontmatter + manifest coverage");
const manifest = readJson("docs/manifest.json");
const manifestPaths = new Set(manifest.docs.map((d) => d.path));
const mdFiles = walk(join(ROOT, "docs"))
  .filter((p) => p.endsWith(".md"))
  .map((p) => relative(ROOT, p).split("\\").join("/"));

for (const rel of mdFiles) {
  const fm = parseFrontmatter(readFileSync(join(ROOT, rel), "utf8"), rel);
  if (fm) checkFrontmatter(fm, rel);
  if (!manifestPaths.has(rel)) fail(`${rel}: present on disk but missing from docs/manifest.json`);
}
for (const d of manifest.docs)
  if (!existsSync(join(ROOT, d.path))) fail(`docs/manifest.json lists '${d.path}' but the file does not exist`);

// ─── 4. ADR coverage (only if ADRs exist) ───────────────────────────────────
const adrDir = join(ROOT, "docs/adr");
if (existsSync(adrDir)) {
  const adrSlugs = readdirSync(adrDir).filter((f) => f.endsWith(".md")).join("\n");
  const constraints = readJson("instructions.json").constraints || [];
  for (const c of constraints)
    if (!adrSlugs.includes(c.id)) fail(`ADR coverage: no docs/adr/* file references constraint '${c.id}' (run gen-adrs.mjs)`);
}

// ─── report ─────────────────────────────────────────────────────────────────
if (errors.length) {
  console.error(`\n✗ docs:check failed with ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("\n✓ docs:check passed");
