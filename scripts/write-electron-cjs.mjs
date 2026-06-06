#!/usr/bin/env node
// write-electron-cjs.mjs — drop a {"type":"commonjs"} marker into dist-electron/.
//
// The root package.json is "type":"module", but Electron's sandboxed preload CANNOT be an ES
// module — an ESM preload silently fails to load, leaving window.app undefined and breaking
// print/save-PDF (constraint: commonjs-preload). The electron/ tsconfig compiles to CommonJS;
// this marker tells Node to treat the emitted .js files as CommonJS regardless of the root type.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(ROOT, "dist-electron");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
console.log("✓ wrote dist-electron/package.json {\"type\":\"commonjs\"}");
