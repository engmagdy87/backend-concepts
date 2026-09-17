# Handoff

## Goal

Keep this learning shop as one GitHub history with checkoutable **chapter** snapshots (JSON → mysql2 → TypeORM, later Prisma). Do not use long-lived ORM branches or SemVer for those snapshots.

## Done

- Four annotated tags pushed to `origin`; four GitHub Releases created (2026-08-31):
  - `chapter-json` @ `21da87c` — https://github.com/engmagdy87/backend-concepts/releases/tag/chapter-json
  - `chapter-mysql-products` @ `cac967e` — https://github.com/engmagdy87/backend-concepts/releases/tag/chapter-mysql-products
  - `chapter-mysql2` @ `9614107` — https://github.com/engmagdy87/backend-concepts/releases/tag/chapter-mysql2
  - `chapter-typeorm` @ `ead611b` (Latest) — https://github.com/engmagdy87/backend-concepts/releases/tag/chapter-typeorm
- Rule `.cursor/rules/chapter-releases.mdc`: agent decides tag/Release only on a new persistence/architecture era.
- Inbox note in both `BACKEND-REFERENCE.md` copies: SemVer versions the HTTP contract; `chapter-*` are curriculum bookmarks; agent decides at commit time.
- Commit `9584353` pushed to `origin/main`: *Add a chapter-release rule for era snapshots on GitHub.*
- No new chapter tag on `9584353` (process, still TypeORM era). User was told that.

## In progress

- Branch: `main` (tracks `origin/main`). Working tree clean. No uncommitted changes.
- App still TypeORM (`Product` / `Cart` entities, `AppDataSource`). Prisma not started.
- User asked whether TypeORM → Prisma is possible: **yes**, swap models + DB wiring only; keep routes/controllers/cart service; don’t run both ORMs. Not implemented this session.

## Files

- `.cursor/rules/chapter-releases.mdc` — when to tag; next expected `chapter-prisma`
- `.cursor/rules/progress-log.mdc` — CHANGELOG / LEARNING on feature commits
- `BACKEND-REFERENCE.md` — mentor notebook (repo copy)
- `~/.cursor/skills/backend-learning-reference/BACKEND-REFERENCE.md` — same notes, personal skill (not in git)
- `CHANGELOG.md` — `[0.1.0]` JSON era; later work still `[Unreleased]`
- `LEARNING.md` — practice log; TypeORM entries 2026-08-30
- `models/product.model.ts`, `models/cart.model.ts`, `utils/database.utils.ts` — current TypeORM persistence
- `services/cart.service.ts` — orchestration; would stay on a Prisma swap

## Decisions

- **Tags + Releases on `main`**, not long-lived `typeorm` / `prisma` branches. Branches are for in-progress work then deleted.
- **GitHub Milestones rejected** for freezing code (issue board only).
- **Four chapter tags only.** Rejected: per-commit tags; `v0.1.0`/`v1.x`; optional API tags (`chapter-layers`, `chapter-cart`, `chapter-put`); PATCH as its own chapter.
- **`chapter-mysql2` on `9614107`**, not `ba3f2db` (notes-only).
- **`chapter-typeorm` on `ead611b`**, not HEAD after the rule commit. Do not move that tag.
- SemVer (`v1.0.0`) only if the public HTTP API is what others pin to. ORM swap with same routes is not a MINOR bump of the JSON era.
- Agent **decides** tag vs skip at commit time; skip if not a new era; say so so the user can override.

## Constraints

- Don’t implement unless the user explicitly asks (architect-mentor). Prisma was design-only.
- Don’t retag old chapters or move `chapter-typeorm`.
- Don’t run TypeORM and Prisma against the same tables at once.
- Ask mode was on for the design questions; Agent mode for tags, rule, commit/push.
- User: commit only when asked; this session they asked to commit and push the rule.

## Blocked / open

- Prisma rewrite not requested. User would switch to Agent mode for the actual swap.
- TypeORM “comfortable enough” (relations) was advised before Prisma; not verified this session whether they want that first.

## Next

1. If starting Prisma: branch `learn/prisma`, map existing MySQL tables in `schema.prisma`, rewrite only `models/` + `utils/database.utils.ts`; keep HTTP/Postman the same.
2. After that merge to `main`: annotated tag `chapter-prisma` + `gh release create` (rule).
3. Until then: stay on TypeORM; no extra `chapter-*` tags for docs/fixes.
