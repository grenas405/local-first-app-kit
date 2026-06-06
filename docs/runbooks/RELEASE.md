---
title: Runbook — Release
audience: [human, ai]
summary: The ordered steps to ship a build — version bump, changelog, backend compile, installer — and why NSIS needs an equal-or-higher version.
status: active
source_of_truth: instructions.json#/buildWorkflow/releaseOrder
related: [docs/runbooks/BUILD.md, docs/adr/0012-version-in-ui-and-changelog.md]
updated: 2026-06-05
---

# Runbook — Release

Ship in this order. Each step gates the next.

1. **Bump the version** in `package.json` (semver). NSIS in-place upgrades require an
   equal-or-higher version, and the running build shows it in the header + Settings
   ([[version-in-ui-and-changelog]]).
2. **Update `CHANGES.md`** with a dated entry for what shipped. Update `README.md` if the
   human-facing story changed.
3. **Green the gates:**
   ```sh
   deno task test
   deno task docs:check
   npm run build:renderer
   ```
4. **Compile the backend sidecar:**
   ```sh
   deno task build:backend     # dist/app-backend.exe
   ```
5. **Produce the installer:**
   ```sh
   npm run dist                # release/<ProductName> Setup <version>.exe
   ```
6. **Smoke-test the installer** on a clean Windows box — see the shell checklist in
   [TROUBLESHOOTING](TROUBLESHOOTING.md): UI renders (not blank), `window.app` defined, Print
   shows the formatted receipt with colors, Save-PDF writes a valid file.

## Per-domain releases

A release is per applied pack. Set `kit.config.json → activeDomain` (or pass the pack to
`apply-domain`), set a domain-specific `productName`/`appId` from the pack, then run the steps
above. The core code is identical across domains; only the bundled seed/branding differ.
