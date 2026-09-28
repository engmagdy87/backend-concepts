# Handoff

## Goal

Implement auth for the shop API in stages (`docs/AUTH-PLAN.md`). Stage 1 (users + signup/login, no JWT) is done and tagged `chapter-auth-users`. Next is stage 2 (`chapter-auth-jwt`): JWT on login, `GET /me`, roles, lock `/admin`.

## Done

- Stage 1 on `main`, tag `chapter-auth-users` on `012410c`. Release: https://github.com/engmagdy87/backend-concepts/releases/tag/chapter-auth-users
- Delete endpoints take the id in the URL, no body:
  - `DELETE /admin/delete-product/:id` (was `POST /admin/delete-product`)
  - `DELETE /admin/delete-user/:id` (was `DELETE /admin/delete-user`)
  - `DeleteProductBody` / `DeleteUserBody` types removed; controllers use `Request<{ id: string }, unknown, unknown>` + `parseId(req.params.id)`.
- `npx tsc --noEmit -p .` → `TSC_OK` after the delete change.
- Postman local + cloud replaced (`putCollection`), item IDs kept. Cloud read-back: Delete product `DELETE {{baseUrl}}/admin/delete-product/{{productId}}`, Delete user `DELETE {{baseUrl}}/admin/delete-user/{{userId}}`.
- `docs/AUTH-PLAN.md`: roles moved from "Nice to have" into step 6 (checklist: `users.role`, never from body, first admin via SQL, `requireAdmin` 401/403, one-line lock in `app.ts`, role from JWT vs DB).
- `CHANGELOG.md` `[Unreleased]` → Changed: delete id in URL. `docs/LEARNING.md`: "Resource id in the path, not the body".
- Not verified: delete endpoints never called over HTTP (no Postman/curl run). Only type-check.

## In progress

- Branch `main`. This change set is committed and pushed together with this file (commit after `e2372c5`).
- Nothing half-done. Login still returns `{ message, data: user }` — JWT not started.

## Files

- `routes/admin.route.ts` — admin products + users routes; mount point for the future `/admin` lock.
- `routes/auth.route.ts`, `routes/shop.route.ts`, `routes/cart.route.ts` — reviewed; stay outside `/admin`.
- `app.ts` — mounts `/admin`, `/shop`, `/cart`, `/auth`; 404 + 500 handlers.
- `controllers/products.controller.ts`, `controllers/users.controller.ts` — delete reads `req.params.id`.
- `controllers/auth.controller.ts` — `signup` (400/409/201), `login` (400/401/200).
- `services/user.service.ts` — `createUserService`, `updateUserService` (result union).
- `models/user.model.ts` — constructor copies fields explicitly (protects future `role` from body); `toJSON()` hides `password`.
- `types/product.types.ts`, `types/user.types.ts` — `ProductIdInput` / `UserIdInput` still exported but now unused.
- `postman/backend-concepts.postman_collection.json` — synced with cloud UID `35152687-d8a8ccff-2ddb-4ad1-950a-5278c57b5cc8`.
- `docs/AUTH-PLAN.md` — plan, stages, step 6 roles checklist.

## Decisions

- No endpoints move into `/admin`. `/shop` (published only), `/cart`, `/auth` are customer-facing. Future `GET /me` goes under `/auth/me` or `/me`, not `/admin`.
- Admin products GET vs shop products GET is intentional (`fetchProducts` vs `fetchPublished`).
- Roles are required in stage 2, not later: signup is public, so "any logged-in user" = anyone.
- Lock `/admin` in one place: `app.use("/admin", requireAuth, requireAdmin, adminRoutes)`. 401 no/bad token, 403 not admin.
- First admin created by SQL, never via API. Signup/add-user never accept `role` from the body.
- Delete ids in the path: `DELETE` bodies are undefined in HTTP and may be dropped.
- Still RPC-style paths (`/add-product`, `/delete-user/:id`, `/update-user/:id`). REST rename (`POST/PUT/DELETE /admin/products[/:id]`, same for users) suggested, not done — optional.
- Earlier decisions (still valid): email uniqueness in service + DB unique key; update result union; full-replace `PUT` for users; `toJSON` hides hash; one login error message; `*Service` suffix; chapter tag per auth stage.
- No chapter tag for the delete change (same-chapter HTTP tweak).

## Constraints

- Side-chat style: review/explain by default; edit files only when asked.
- Short, simple-language answers, often as points.
- Commit only when asked; no force-push. Push to `main` needs explicit user confirmation.
- `synchronize: false` — schema changes are manual SQL.
- Postman: local file then cloud `putCollection` on every endpoint change; keep item IDs.
- CHANGELOG + LEARNING in the same commit as finished features.

## Blocked / open

- Cloud Postman drops per-request `description` on `putCollection` (reads back `null`); local file keeps them. Requests themselves match.
- Signup reveals existing emails via 409 (accepted until email verification).
- `findMissingFields` checks presence only: `{ "password": 123 }` passes, then bcrypt throws → 500.
- Unused `ProductIdInput` / `UserIdInput` types — remove or keep.

## Next

1. Plan step 2: login issues a JWT (`{ userId, email }`, maybe `role`; short expiry; secret from `.env`); response `{ token }`.
2. Step 3: `middlewares/` auth middleware (`Authorization: Bearer`) → `req.user`; `GET /me`.
3. Step 6: `users.role` + `requireAdmin`, lock `/admin`; Postman Bearer auth + `GET /me` (local + cloud); tag `chapter-auth-jwt`.
