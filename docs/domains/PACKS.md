---
title: OKC Domain Packs — Guide
audience: [human, ai]
summary: The four bundled Oklahoma City storefronts, how a pack is structured, and how to apply or author one.
status: active
source_of_truth: domains/_schema/pack.schema.json
related: [docs/domains/OKC-COMPLIANCE.md, docs/runbooks/BUILD.md]
updated: 2026-06-05
---

# OKC Domain Packs

A **domain pack** is the only thing that changes between storefronts. It is one validated JSON
file plus an optional logo. `scripts/apply-domain.mjs` reads it and materializes the per-domain
files the core imports — the core source never changes ("one core, switchable packs").

## The four bundled OKC packs

| Pack id | Storefront | Brand | Tax posture |
|---------|-----------|-------|-------------|
| `okc-barber` | Plaza District Barber Co. | slate → amber | services exempt, products taxable |
| `okc-salon` | Midtown Salon OKC | rose | services exempt, products taxable |
| `okc-detail` | Automobile Alley Detailing | sky blue | labor exempt*, retail taxable |
| `okc-flower` | Paseo Petals | green | goods taxable, delivery exempt |

\* See [OKC-COMPLIANCE](OKC-COMPLIANCE.md) on auto-detail service taxability.

## Anatomy of a pack (`domains/<id>/pack.json`)

```jsonc
{
  "pack": "okc-barber",            // must equal the folder name
  "appName": "Plaza District Barber Co.",
  "appId": "com.example.okcbarber",
  "registerLabel": "Checkout",     // the checkout tab's name
  "brand": { "from": "#0f172a", "via": "#1e293b", "to": "#b45309" },
  "settings": { "business_name": "...", "tax_rate": "0.08625", "receipt_footer": "..." },
  "categories": ["Haircuts", "Beard & Shave", "Retail Products", "..."],
  "colors": ["#0f172a", "#b45309", "..."],   // catalog button palette
  "seedCatalog": [
    { "name": "Haircut", "category": "Haircuts", "price_cents": 3000, "taxable": false },
    { "name": "Pomade",  "category": "Retail Products", "price_cents": 1800, "taxable": true }
  ]
}
```

The schema (`domains/_schema/pack.schema.json`) is enforced by both `apply-domain.mjs` and
`docs:check`, so an invalid pack fails fast.

## Applying a pack

```sh
node scripts/apply-domain.mjs okc-flower   # or set activeDomain in kit.config.json
```

This (re)writes `backend/seed.generated.ts`, `backend/logo.ts`, `renderer/src/catalog-meta.ts`,
`renderer/src/brand.generated.css`, and `renderer/src/assets/active-logo.svg`. Verify the switch
touched only generated files — the acceptance test in [BUILD](../runbooks/BUILD.md).

## Authoring a new pack

1. Copy a folder under `domains/`, rename it, set `pack` to the new folder name.
2. Adjust branding, categories, and `seedCatalog` (mark each item `taxable` per Oklahoma rules).
3. Drop in an optional `logo.png`/`.svg` and reference it via `"logo": "logo.png"` (or omit it to
   use the auto-generated brand wordmark).
4. `node scripts/apply-domain.mjs <id>` then `deno task docs:check`.
