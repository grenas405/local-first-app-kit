---
title: Runbook — Backup & Restore
audience: [human, ai]
summary: Where the data lives, how the automatic daily snapshot works (checkpoint + copy), and how to restore one.
status: active
source_of_truth: instructions.json#/coreFeatures/backups
related: [docs/runbooks/TROUBLESHOOTING.md, docs/adr/0007-sqlite-backup-method.md]
updated: 2026-06-05
---

# Runbook — Backup & Restore

## Where the data lives

All business data is a single SQLite file in the OS user-data directory, passed to the backend as
`POS_DB_PATH`. On Windows that is typically:

```
%APPDATA%\<ProductName>\pos.db
```

Alongside it, WAL files (`pos.db-wal`, `pos.db-shm`) and a `backups/` folder.

## Automatic daily snapshots

On startup the backend writes at most **one snapshot per local day** to
`<db-dir>/backups/<stem>-YYYY-MM-DD.db`, keeps the newest ~14, and prunes older ones. The method
matters: `node:sqlite` does **not** support `VACUUM INTO`, so the kit runs
`PRAGMA wal_checkpoint(TRUNCATE)` (flushing the WAL into the main file) and then copies the file —
yielding a complete standalone snapshot ([[sqlite-backup-method]]). Backup failure never blocks
startup, and it is a no-op for in-memory test databases.

## Manual backup

Quit the app (so the WAL is checkpointed on clean shutdown) and copy `pos.db` — plus, to be safe,
`pos.db-wal` and `pos.db-shm` — to safe storage.

## Restore

1. Quit the app completely.
2. Replace `pos.db` with the chosen `backups/<stem>-YYYY-MM-DD.db` (rename it to `pos.db`).
3. Delete any stale `pos.db-wal` / `pos.db-shm` next to it.
4. Relaunch. Migrations are additive, so restoring an older snapshot re-applies cleanly
   ([[additive-migrations]]).
