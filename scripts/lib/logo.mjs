// logo.mjs — produce a logo as an inlined data URI (for receipts) and an SVG string (for the
// renderer header). When a pack ships a real image we embed it; otherwise we synthesize a clean
// brand wordmark so every domain has a usable logo with zero binary assets in the repo.

import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };

function initials(name) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Build a brand wordmark SVG (gradient pill + initials + business name). */
export function wordmarkSvg(appName, brand) {
  const text = appName.length > 22 ? initials(appName) : appName;
  const fontSize = text.length > 14 ? 16 : text.length > 8 ? 20 : 24;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${brand.from}"/>` +
    `<stop offset="50%" stop-color="${brand.via}"/>` +
    `<stop offset="100%" stop-color="${brand.to}"/></linearGradient></defs>` +
    `<rect width="320" height="80" rx="16" fill="url(#g)"/>` +
    `<text x="160" y="${40 + fontSize / 3}" font-family="Inter,system-ui,sans-serif" font-size="${fontSize}" ` +
    `font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">${escapeXml(text)}</text>` +
    `</svg>`
  );
}

function escapeXml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
}

/**
 * Resolve a logo to { dataUri, svg }.
 * @param {{appName:string, brand:{from:string,via:string,to:string}, file?:string}} opts
 */
export function buildLogo({ appName, brand, file }) {
  if (file && existsSync(file)) {
    const ext = extname(file).toLowerCase();
    const mime = MIME[ext] ?? "application/octet-stream";
    const b64 = readFileSync(file).toString("base64");
    const dataUri = `data:${mime};base64,${b64}`;
    const svg = ext === ".svg" ? readFileSync(file, "utf8") : null;
    return { dataUri, svg: svg ?? wordmarkSvg(appName, brand) };
  }
  const svg = wordmarkSvg(appName, brand);
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return { dataUri, svg };
}
