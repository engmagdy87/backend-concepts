# Handoff

## Goal

Plan basic auth for the shop API (users, signup/login, JWT, guest cart cookie), then keep learning docs tidy. Design only this session — no auth code yet.

## Done

- Mentor discussion locked a suggested path: users table → signup/login + JWT Bearer → `GET /me` → guest cart cookie → then `carts.userId` + merge. Nice-to-haves listed separately (logout/revoke, refresh/session, roles, OAuth, etc.).
- Wrote `docs/AUTH-PLAN.md` with that plan (must-ship steps + nice-to-have table).
- Grouped markdown under `docs/`:
  - Moved: `BACKEND-REFERENCE.md`, `LEARNING.md`, `MENTOR-BRIEFING.md`, `POSTMAN.md`, `AUTH-PLAN.md`
  - Left at root: `README.md`, `CHANGELOG.md`, `HANDOFF.md`
- Updated project links/rules: `README.md`, `.cursor/rules/{progress-log,backend-reference,architect-mentor}.mdc`, path note in `docs/BACKEND-REFERENCE.md`
- Updated personal skills outside the repo: `~/.cursor/skills/backend-architect-mentor/SKILL.md` and `~/.cursor/skills/backend-learning-reference/{SKILL.md,BACKEND-REFERENCE.md}` to prefer `docs/` paths

## In progress

- Branch: `main` (tracks `origin/main`)
- HEAD: `cbf2f4e` — “Add .DS_Store to .gitignore”
- Uncommitted (not committed this session):
  - Renames into `docs/` (+ new `docs/AUTH-PLAN.md`)
  - `README.md`, `HANDOFF.md`, three `.cursor/rules/*.mdc`, small header edit in `docs/BACKEND-REFERENCE.md`
- Auth implementation not started (discussion + plan file only)

## Files

- `docs/AUTH-PLAN.md` — agreed auth plan (suggested way + steps 1–6 + nice-to-haves)
- `docs/BACKEND-REFERENCE.md` — mentor notebook (project copy); prior session notes on session/cookie/JWT
- `docs/LEARNING.md` / `docs/MENTOR-BRIEFING.md` / `docs/POSTMAN.md` — moved under `docs/`
- `README.md` — links point at `docs/`
- `.cursor/rules/progress-log.mdc` — `docs/LEARNING.md`
- `.cursor/rules/backend-reference.mdc` / `architect-mentor.mdc` — `docs/BACKEND-REFERENCE.md`
- `HANDOFF.md` — this file (stays at repo root)
- `CHANGELOG.md` — stays at repo root (unchanged this session)
- Code tree (`models/`, `routes/`, `services/`) — unchanged; still guest cart, no users

## Decisions

- v1 auth: JWT in `Authorization` (Postman-friendly), not session cookie first.
- Guest cart needs a cookie (or guest session) for identity; full auth session store is not required just for guests.
- Session + access JWT together only later if you need revoke/refresh — not for the first cut.
- Do not wire `carts.userId` / merge in the same first pass as signup/login/`GET /me`.
- Docs layout: root = README + CHANGELOG + HANDOFF; everything else under flat `docs/` (no subfolders).

## Constraints

- Architect-mentor: don’t implement unless asked.
- Commit only when asked. Don’t force-push. Don’t retag `chapter-typeorm`.
- `synchronize` stays `false`.
- Don’t run TypeORM and Prisma on the same tables.

## Blocked / open

- None. Awaiting user to start implementing auth (or commit the docs move).

## Next

1. Commit the `docs/` reorg + `AUTH-PLAN.md` when the user asks.
2. Implement auth plan steps 1–3: `users` table, signup/login + JWT, `GET /me` (+ middleware).
3. Then guest cart cookie; then `carts.userId` + merge on login (plan steps 4–5).
