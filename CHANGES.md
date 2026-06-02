# Changelog

All notable changes to the Local-First App Kit are documented here.

## [Unreleased]

### Changed
- Genericized the kit configs so they are no longer tied to a single business instance:
  - `package.json`: `name` → `local-first-app-kit`, `productName`/NSIS shortcut → `Local-First POS`, `appId` → `com.example.localfirstpos`, and a domain-agnostic `description`.
  - `package.json` + `deno.json`: backend artifact renamed `k-saloon-backend(.exe)` → `app-backend(.exe)` (compile output and Electron `extraResources`).
- `instructions.json`: `purpose` now lists barber shops among the supported domains.

### Added
- `instructions.json`: new `barber_shop` domainPack (categories, seed catalog, tip/walk-in notes).
- This `CHANGES.md` and a top-level `README.md`.
