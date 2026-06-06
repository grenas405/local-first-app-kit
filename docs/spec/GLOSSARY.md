---
title: Glossary & Domain-to-Core Term Map
audience: [human, ai]
summary: The single mapping from each domain's vocabulary (ticket, order, visit) onto the kit's fixed core schema, plus money/time terms.
status: active
source_of_truth: instructions.json#/dataModel
related: [docs/architecture/DATA-MODEL.md, docs/domains/OKC-COMPLIANCE.md]
updated: 2026-06-05
---

# Glossary & Domain-to-Core Term Map

The core schema never changes between domains. Only the *words on screen* change. This table is
the contract an agent uses to avoid renaming tables and a human uses to avoid confusion.

## Domain word → core concept

| You might hear (domain) | Core concept | Table / field |
|-------------------------|--------------|---------------|
| Ticket, order, visit, job | a completed, paid transaction | `sales` |
| Line, service, item | one line on a transaction | `sale_line_items` |
| Service / product / SKU | a priced thing you can sell | `catalog_items` |
| Register / Checkout / POS | the selling screen | renderer `pages/Checkout.tsx` |
| Tab / category | grouping of catalog items | `catalog_items.category` |

> **Hard rule:** keep the table name `sales` even when the domain calls them tickets or visits.
> Relabel in the UI (`registerLabel` in the domain pack), never in the schema.

## Core nouns

- **catalog_items** — `id, name, category, price_cents, active, color, description, taxable`.
  `active=0` is a soft hide; a permanent delete removes the row.
- **sales** — `id, created_at` (UTC ISO), `sale_date` (local `YYYY-MM-DD`), `subtotal_cents`,
  `tax_cents`, `total_cents`, `payment_type`, `cash_tendered_cents`, `change_cents`.
- **sale_line_items** — a **snapshot** of `name, unit_price_cents, qty, line_total_cents, taxable`
  at sale time, so editing a catalog item never rewrites history.

## Money & time

- **integer cents** — all money is stored and computed as whole cents; never floats. (See [[money-integer-cents]].)
- **server-side totals** — the backend recomputes subtotal/tax/total on every create; client totals are ignored. (See [[server-side-totals]].)
- **sale_date (local day)** — the local `YYYY-MM-DD` a sale belongs to, stored alongside the UTC `created_at` so evening sales still count "today". (See [[local-day-grouping]].)
- **taxable (per line)** — Oklahoma taxes tangible goods but exempts most personal services;
  each line carries its own `taxable` flag and tax is summed only over taxable lines. (See [[oklahoma-per-item-tax]].)
