---
title: Oklahoma City Sales-Tax Compliance
audience: [human, ai]
summary: The OKC 8.625% combined-rate breakdown and the per-item taxability guidance behind each domain pack's seed data.
status: active
source_of_truth: instructions.json#/constraints/17
related: [docs/architecture/DATA-MODEL.md, docs/domains/PACKS.md, docs/adr/0018-oklahoma-per-item-tax.md]
updated: 2026-06-05
---

# Oklahoma City Sales-Tax Compliance

> **Not legal or tax advice.** This documents the kit's defaults and the reasoning behind them.
> Every business should confirm its rate and the taxability of its line items with the
> [Oklahoma Tax Commission](https://oklahoma.gov/tax.html) or an accountant.

## The combined rate: 8.625%

The kit ships `tax_rate = 0.08625` as the default for every OKC pack. That is the combined
sales-tax rate inside Oklahoma City:

| Component | Rate |
|-----------|------|
| Oklahoma state | 4.500% |
| Oklahoma County | 1.125% |
| City of Oklahoma City | 3.000% |
| **Combined** | **8.625%** |

Change it any time in **Settings → Sales tax rate**; the backend validates it is a fraction in
`[0, 1]` and stores it as a string. A business outside OKC city limits (different county or
municipality) should set its own combined rate.

## What gets taxed: goods vs. services

Oklahoma generally taxes **tangible personal property** (things a customer takes with them) and
exempts most **personal/professional services**. That single distinction drives every pack's
`taxable` flags:

| Domain | Typically taxable | Typically exempt |
|--------|-------------------|------------------|
| Barber / Salon | retail products (pomade, shampoo, styling spray) | haircuts, color, shaves, styling |
| Auto detail | retail goods (air fresheners, towels) | detailing labor/packages* |
| Flower shop | flowers, plants, arrangements, cards, vases | a separately-stated delivery service |

\* Service taxability for auto detailing has nuances in Oklahoma; the detail pack seeds labor as
exempt but flags this for owner confirmation.

The kit enforces this **per line, not per sale** ([[oklahoma-per-item-tax]]): a cart with a
$30 haircut and an $18 pomade is taxed only on the $18 → `round(1800 × 0.08625) = 155¢`, total
$49.55. The receipt notes when a cart contains exempt items.

## Changing an item's taxability

Open **Catalog**, edit the item, and toggle **Taxable (Oklahoma)**. The change applies to future
sales; historical `sale_line_items` keep their snapshot, so past receipts never change.
