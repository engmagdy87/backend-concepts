# Handoff

## Goal

Implement auth for the shop API in stages (`docs/AUTH-PLAN.md`). Stage 1 (`chapter-auth-users`) is tagged. Stage 2 (`chapter-auth-jwt`: JWT on login, `GET /auth/me`, roles, lock `/admin`) is implemented and pushed but **not tagged yet**. Current work: fixing the review list from the stage 2 change set, one point at a time with user confirmation.

## Done

- Stage 2 on `main` and `origin/main`:
  - `d954efc` — login issues a JWT (`{ data: { accessToken } }`, HS256, `JWT_EXPIRES_IN` seconds).
  - `7cecc7a` — `requireAuth` middleware (`Authorization: Bearer`) → `req.user`; `GET /auth/me`.
  - `a263ab2` — `users.role` (`customer` | `admin`), `requireAdmin` (403 `"Admins only"`), `app.use("/admin", requireAuth, requireAdmin, adminRoutes)`, role in the JWT, `verifyToken` rejects tokens without a valid role, admin add-user takes optional `role`.
- Review fixes (local, **uncommitted**):
  1. `controllers/users.controller.ts` — `req.body?.role` so add-user with no body returns 400, not 500.
  2. (no change) staged/unstaged split was resolved by commit `a263ab2`.
  3. `postman/backend-concepts.postman_collection.json` — Bearer `{{token}}` auth on the Admin and User folders (inherited by every request), descriptions updated, Add user body has `"role"`. Cloud synced via Postman REST API `PUT /collections/{uid}` and read back (auth, body, item IDs match).
  4. `README.md` — Auth section, admin users table, delete paths fixed, `.env` setup, first-admin SQL, layout + diagram with `middlewares/`, `auth.route.ts`, user/auth services. This file rewritten.
- `npx tsc --noEmit -p .` → `TSC_OK` after fix 1.
- HTTP-verified against the local server (2026-10-13, 23/23 pass, throwaway `@claude-test.local` users deleted afterwards): `/admin` no/bad token 401, customer 403, admin 200; old token without `role` and unknown role 401; signup with `"role": "admin"` → `customer`; `/auth/me` 200/401; add-user no body / missing fields / bad role → 400, `role: "admin"` → 201.

## In progress

- Review point 5 done (local): `docs/AUTH-PLAN.md` step 6 now records the `ALTER TABLE users ADD COLUMN role ...` + first-admin `UPDATE` (matches `SHOW CREATE TABLE users` on the dev DB).
- Review point 6 done (local): `requireAdmin` returns 401 when `req.user` is missing; `role` removed from `UserInput` (now `AddUserBody.role?: unknown` for add-user only, `UserOutput.role: UserRole`); `addUser` checks missing fields before `role`. `TSC_OK`.

## Files

- `app.ts` — mounts `/admin` (locked), `/shop`, `/cart`, `/auth`; 404 + 500 handlers.
- `middlewares/auth.middleware.ts` — `requireAuth`, `requireAdmin`.
- `utils/token.utils.ts` — `signToken`, `verifyToken` (pinned HS256, validates `userId`/`email`/`role`), `requireEnv`.
- `types/user.types.ts` — `USER_ROLES`, `UserRole`, `isUserRole`; `types/express.d.ts` — `req.user`.
- `models/user.model.ts` — `role` enum column; constructor takes `role` as a separate argument (never from the body).
- `services/user.service.ts` — `createUserService(userData, role = "customer")`, `updateUserService` (does not touch role).
- `controllers/users.controller.ts` — add-user validates `role`.
- `postman/backend-concepts.postman_collection.json` — cloud UID `35152687-d8a8ccff-2ddb-4ad1-950a-5278c57b5cc8`.

## Decisions

- `/shop`, `/cart`, `/auth` stay customer-facing; only `/admin` is locked, in one place in `app.ts`.
- Role is read from the JWT (stale until expiry, 15 minutes). Re-read from the DB later if demotion must be instant.
- First admin by SQL, never via API. Signup is always `customer`; only admin add-user may set `role`.
- Change-role on an existing user is a later endpoint (`PATCH`), not part of full-replace `PUT`.
- Postman auth is set on the folders, not per request.
- Earlier decisions (still valid): delete ids in the path; email uniqueness in service + DB unique key; update result union; `toJSON` hides hash; one login error message; `*Service` suffix; chapter tag per auth stage; RPC-style paths kept (REST rename optional).

## Constraints

- Fix review points one at a time; wait for user confirmation before the next.
- Change locally only — do not commit or push unless asked. Push to `main` needs explicit confirmation; no force-push.
- Short, simple-language answers, often as points.
- `synchronize: false` — schema changes are manual SQL.
- Postman: local file, then cloud full replace on every endpoint change; keep item IDs. No Postman MCP in Claude Code — the key lives in `~/.cursor/mcp.json` (`postman-api-mcp`); use it only with the user's OK.
- CHANGELOG + LEARNING in the same commit as finished features.

## Blocked / open

- Signup reveals existing emails via 409 (accepted until email verification).
- `findMissingFields` checks presence only: `{ "password": 123 }` passes, then bcrypt throws → 500.
- Unused `ProductIdInput` / `UserIdInput` types — remove or keep.
- `docs/MENTOR-BRIEFING.md` and the "This repo (snapshot)" in `docs/BACKEND-REFERENCE.md` still describe the cart chapter only.
- Earlier note "cloud Postman drops request descriptions": not seen with the REST API `PUT` (descriptions read back fine).

## Next

1. Commit the review fixes when asked; then tag `chapter-auth-jwt` + GitHub Release.
2. Stage 3 (`chapter-auth-cart`): guest cart cookie, then `carts.userId` + merge (plan steps 4–5).
