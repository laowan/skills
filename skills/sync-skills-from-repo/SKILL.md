---
name: sync-skills-from-repo
description: Clone a remote git repository and synchronize its skills/ subdirectory into the local project's skills directory. Replaces skill folders that already exist locally with the repo's version; copies new ones in. Use when the user asks to "sync skills from a repo", "clone a repo and merge skills", "update skills from upstream", or provides a git URL alongside a skills-sync intent. Also triggers for one-way skill imports from any GitHub/git repo into the current project's skills folder.
---

# Sync Skills From Repo

Clone a remote git repo and one-way merge its `skills/` subdirectory into the local skills directory.

- **Replace**: skill folder already exists locally -> delete local, copy repo version.
- **Copy**: skill folder does not exist locally -> copy repo version in.

## Quick start

```bash
node scripts/sync_skills.cjs --repo <git-url>
```

Auto-detects the local skills dir (prefers `./skills` if it exists, else uses cwd). Clones to a temp dir, syncs, and deletes the temp dir.

## Arguments

| Flag | Required | Default | Purpose |
|------|----------|---------|---------|
| `--repo <git-url>` | yes | — | Git URL to clone (HTTPS or SSH). |
| `--target <dir>` | no | `./skills` or cwd | Local skills directory to sync into. |
| `--skills-subdir <rel>` | no | `skills` | Subdirectory inside the repo that holds skill folders. |
| `--branch <name>` | no | default branch | Branch/tag to checkout (uses `--depth 1`). |
| `--keep` | no | false | Keep the temp clone after sync (debugging). |

## Workflow

1. Resolve target: `--target` if given; else `./skills` if it exists; else cwd.
2. Clone repo (shallow, `--depth 1`) into a temp dir under the OS temp folder.
3. Locate `<repo>/<skills-subdir>` (default `skills`).
4. For each top-level subdirectory there:
   - If `<target>/<name>` exists: delete it, then copy repo version. Log `REPLACED`.
   - Else: copy repo version. Log `COPIED`.
5. Print a sync report with counts.
6. Delete the temp clone unless `--keep` was passed.

## Examples

Sync `obra/superpowers` into the current project's `skills/`:

```bash
node scripts/sync_skills.cjs --repo https://github.com/obra/superpowers.git
```

Sync a specific branch, keep temp clone:

```bash
node scripts/sync_skills.cjs --repo https://github.com/obra/superpowers.git --branch main --keep
```

Repo stores skills under `packages/skills` instead of `skills`:

```bash
node scripts/sync_skills.cjs --repo <url> --skills-subdir packages/skills
```

## Notes

- One-way: repo -> local. No local changes are pushed back.
- `REPLACED` deletes the local folder unconditionally. Confirm with the user before running if local changes exist.
- Requires `git` on PATH and Node.js.
- Hidden directories (starting with `.`) inside the repo's skills subdir are skipped.
