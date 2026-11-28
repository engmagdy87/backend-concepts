# Handoff

## Goal

Auth stages 1–3 are done, tagged, and released (`chapter-auth-users`, `chapter-auth-jwt`, `chapter-auth-cart`). The cart is login-only (`f7bf556` on `main`). Input validation (H3) is released as `chapter-validation` (`7476e5e`, 2026-11-22). Files (image upload + cart quote PDF) is released as `chapter-files` (`2b68799`, 2026-11-25). Pagination is released as `chapter-pagination` (2026-11-25). Payments (Stripe test mode, orders) is released as `chapter-payments` (2026-11-26). REST basics (CORS, REST admin paths, id → 400) is released as `chapter-rest` (2026-11-26). WebSockets (Socket.IO: `products:changed`, `order:paid`) is released as `chapter-websockets` (2026-11-28). Course section 22 (async requests) needed no code. Next chapter: automated tests (M7), or the next course section the user pastes.

## Done

- **WebSockets chapter (released `chapter-websockets`, 2026-11-28):** see `docs/WEBSOCKETS-PLAN.md`. Course module on WebSockets (only the module summary was pasted so far; map the integration lectures to the plan when they come). `socket.io` 4.8.4 on the same server/port (`utils/socket.utils.ts`: `initSocket`, `getIO`, `userRoom`, `emitProductsChanged`, `emitOrderPaid`); CORS list moved to `utils/cors.utils.ts` (shared with Express). `products:changed` `{ action, productId }` to everyone from the product controller (success only); optional socket login via `io.use` (`auth.token` or `Authorization` header, same `verifyToken`; bad token refused); `order:paid` `{ orderId, total }` to `user:<id>` after the paid transaction (only when it changed the order). The user tested all of it in Postman (tabs "Me"/"Guest", real 4242 payment). Their Socket.IO requests live in a separate Postman collection ("backend-concepts sockets") so the HTTP-collection sync can't wipe them. Later: SSE, chat, Redis adapter, token expiry on open sockets.
- **REST chapter (released `chapter-rest`, 2026-11-26):** see `docs/REST-PLAN.md`. Course section 24. `cors` with `CORS_ORIGIN` list (the user's `.env` has `http://localhost:3000`). Admin paths REST style (`POST /admin/products`, `DELETE /admin/products/:id`, `POST /admin/users`, `PUT|DELETE /admin/users/:id`; old paths 404). `validateIdParam` on every `:id` route (`abc` → 400, missing → 404). `CODE_REVIEW.md` (git-ignored): M5 + M11 done.
- **Payments chapter (released `chapter-payments`, 2026-11-26):** see `docs/PAYMENTS-PLAN.md`. Stripe Checkout in test mode (`utils/stripe.utils.ts`, refuses non-`sk_test_` keys; `requireEnv` in `utils/env.utils.ts`). Tables `orders` + `order_items` (user ran the SQL; also in README). `POST /checkout` (login) → pending order (cascade save) + session → `{ orderId, url }`; `GET /checkout/success` (public) verifies with `sessions.retrieve`, then marks paid + empties cart in one transaction (update only if still pending); `GET /checkout/cancel`; `GET /orders` (login). `stripeSessionId` is `select: false`; DECIMAL → number via `decimalToNumber`. The user paid order 5 (184.77) in the browser. Later: webhooks, stock, refunds, invoice PDF.
- **Pagination chapter (released `chapter-pagination`, 2026-11-25):** see `docs/PAGINATION-PLAN.md`. `?page` (≥1, default 1) + `?limit` (1–50, default 10) on `GET /shop/products` and `GET /admin/products`; `findAndCount` ordered by `id`; response `{ data, meta }`; bad query → 400 "Invalid query". Shared `utils/pagination.utils.ts` (`parsePagination`, `buildPageMeta`); parsed in the controller because Express 5's `req.query` is read-only. Lists now return 10 by default, not all.
- **Files chapter (released `chapter-files`, `2b68799`, 2026-11-25):** see `docs/FILES-PLAN.md`. Upload `POST /admin/products/:id/image` (multer, `uploads/products/`, `/images` static, old/deleted files removed), `imageUrl` nullable (user ran the SQL), `GET /cart/quote` streams a PDFKit PDF. All cases tested by the user in Postman. Later: R2/S3 storage, `sharp`, `file-type`, orders + invoice.
- **Duplicate-email race (M2, 2026-11-22, merged to `main`):** `isDuplicateKeyError` moved from `models/cart.model.ts` to `utils/database.utils.ts`; `createUserService` and `updateUserService` catch `ER_DUP_ENTRY` → 409 (anything else re-thrown → 500). Reproduced before the fix (5 parallel signups: 201 + 4×500), after: 201 + 4×409; cart parallel-create still makes one cart. Test users deleted. Docs: CHANGELOG, LEARNING (error-handling entry, mapped to the user's course module), CODE_REVIEW. No chapter tag (a fix inside the current era).
- **Input validation (released `chapter-validation`, `7476e5e`, 2026-11-22):** `zod@4.6.7`. `schemas/product.schema.ts` (`productSchema`), `schemas/user.schema.ts` (`userSchema`, `addUserSchema` with `role` enum default `customer`, looser `loginSchema`), `schemas/cart.schema.ts` (`cartItemSchema`, positive int). `middlewares/validate.middleware.ts` → `validateBody(schema)`: 400 `{ message: "Invalid body", errors: fieldErrors }`, else `req.body = result.data`. Wired on add/update product, signup, login, add/update user, cart add/remove. Body types come from `z.infer`. Removed `utils/validation.utils.ts` (`findMissingFields`), `USER_REQUIRED_FIELDS`, the add-user `isUserRole` check, and `parseId` in the cart service. Built in 3 steps, each `tsc` + HTTP-tested (test users/products/carts deleted after). Docs: README (Validation section), CHANGELOG, LEARNING, BACKEND-REFERENCE (both copies: inbox + "Types vs runtime validation" concept), CODE_REVIEW (H3 done, L6 mostly), MENTOR-BRIEFING. Postman local: descriptions updated; Signup / Add user / Update user examples use `test1234` (8+ rule), Login keeps `test123` (the user's existing accounts use it); 3 "→ 400" example requests. A slide deck "How Validation Flows" was made for the user (claude.ai artifact).
- **Cart is login-only (`f7bf556`, pushed to `main` 2026-11-22):** `app.use("/cart", requireAuth, cartRoutes)`. No token or a bad token → 401. Removed: `middlewares/cart-owner.middleware.ts`, `optionalAuth`, `Cart.attachGuestCart` / `attachGuestCartService`, `CartOwner` + `req.cartOwner`, `carts.guestToken` in the entity, and `cookie-parser` (+ types). `Cart.getOrCreate(userId)` is the only lookup; services take `userId` from `req.user`. `tsc` passes. HTTP-tested: 401 without/with bad token, no `Set-Cookie`, add/get/remove/clear, 400 bad id, 404 missing product, 3 parallel first requests → one cart. Test users/carts deleted; `carts` is empty. Docs updated: README, CHANGELOG, AUTH-PLAN, LEARNING, MENTOR-BRIEFING, BACKEND-REFERENCE (snapshot), CODE_REVIEW, Cursor Postman rule. Postman local file: Cart folder uses Bearer `{{token}}`, "Get cart (logged in)" removed. The `chapter-auth-cart` release notes got a one-line note that the guest cart was later removed (tag not moved). Postman cloud synced 2026-11-22 via the REST API `PUT` (before: cloud matched the committed file; after: read back, matches local).
  - The user discarded an earlier version of this change on 2026-11-20 and asked Claude Code to redo it.
- **Quick wins (2026-10-14, on `main`):** H1, M1, M12, L3, L4 from `CODE_REVIEW.md`, hand-tested. `yarn start` now sets `NODE_ENV=development` (query logs on); without it, only errors are logged. No chapter tag (small fixes inside the current era).
- **Stage 3 released:** `fix/per-owner-cart` fast-forwarded into `main` and pushed (`2c73c8c`); annotated tag + GitHub Release `chapter-auth-cart` (2026-10-14).
- **Stage 2 released:** `main` pushed (`0d6a67c`), and GitHub Release `chapter-auth-jwt` published on `0d6a67c` (2026-10-14).
- **Review file:** `CODE_REVIEW.md` (untracked). It was rewritten 2026-10-14 with "When: Now / Next / Later" labels for a learning project, and a status board.
- **Stage 3 on branch `fix/per-owner-cart`:**
  - `d5d083d` (committed, C1): `carts.guestToken` / `carts.userId` (both `UNIQUE`, `userId INT UNSIGNED` FK → `users.id`). `optionalAuth`, `resolveCartOwner` (`HttpOnly` `guestCart` cookie, `Path=/cart`, 30 days), `Cart.getOrCreate(owner)` with duplicate-key retry, `cookie-parser`. The user ran the SQL on the dev DB.
  - `2c73c8c` (C1a): `Cart.attachGuestCart` + `attachGuestCartService`. On the first `/cart` request with a token and the guest cookie, the guest cart goes to the user if they have no cart yet, and the cookie is cleared. If the user already has a cart, both are left alone. Also updated: README, AUTH-PLAN (step 5 ticked), CHANGELOG, LEARNING (2026-10-14 entry), and the Postman collection (Cart descriptions + new "Get cart (logged in)" request).
  - HTTP-verified by hand: separate guest carts, user cart, 401 on a bad token, one cart after parallel first requests, attach after login, existing user cart left alone. Test users and carts were deleted afterwards; `carts` is empty.
- **Postman cloud synced** 2026-10-14 via the REST API `PUT` (full replace; read back: item ids and descriptions match). Before the PUT, the cloud copy matched the committed local file.
- **`CLAUDE.md`** added. It imports `.cursor/rules/*.mdc`, so Claude Code follows the same rules.

## In progress

- Nothing in progress. WebSockets chapter released 2026-11-28 as `chapter-websockets` (`feat/websockets` merged to `main`, pushed, branch deleted; no HTTP request changed, so no Postman cloud sync).

## Decisions

- **Validation:** shape checks in zod schemas on the route (400); DB rules stay in services (404/409). Login schema is loose on purpose. `productId` must be a JSON number (`"6"` → 400). URL `:id` still uses `parseId` (a `validateParams` is a later idea).
- **No guest cart.** `/cart` is for a logged-in user only. A visitor signs up or logs in, then adds items. There is nothing to merge.
- **H5 (parallel add/remove lost updates) is parked as "Later".** An atomic-SQL + row-lock fix was written, then undone at the user's request as too advanced for now. The simple `increment`/`decrement` version is noted in `CODE_REVIEW.md`.
- **WebSockets:** HTTP for asking, socket for news. Events carry ids only (no product data, unpublished products stay hidden). Emit after the DB change commits. Socket login optional; bad token refused, not downgraded to guest.
- **REST + CORS:** resource paths everywhere; CORS allows only `CORS_ORIGIN` addresses (never `*`); no cookies, so no `credentials`.
- **Earlier decisions (still valid):**
  - The role comes from the JWT.
  - The first admin is created by SQL.
  - Delete ids go in the path.
  - Postman auth is set on folders.
  - One chapter tag per auth stage.

## Constraints

- **Learning project:** explain in simple language and keep fixes basic; label advanced topics "later".
- **One step at a time:** fix review points one at a time and wait for confirmation.
- **No unasked commits:** don't commit or push unless asked. Push to `main` needs explicit confirmation.
- **Manual schema:** `synchronize: false`, so schema changes are manual SQL that the user runs.
- **Postman:** update the local file, then do a cloud full replace on every endpoint change. The key is in `~/.cursor/mcp.json`; use it only with the user's OK.
- **Docs with code:** CHANGELOG + LEARNING go in the same commit as finished features.
- **Course-driven chapters:** the user pastes each course section; write a `docs/<TOPIC>-PLAN.md` mapping lectures → steps, build one step at a time, tag each section `chapter-<topic>`.

## Blocked / open

- **`chapter-auth-jwt` is a lightweight tag.** The chapter-releases rule wants an annotated tag. Replacing it needs a force-push of the tag, which Claude Code's permission check blocked. The user can run:
  ```bash
  git tag -f -a chapter-auth-jwt 0d6a67c -m "Auth stage 2: JWT on login, GET /auth/me, roles, /admin locked to admins"
  git push --force origin refs/tags/chapter-auth-jwt
  ```
- **Leftovers from the review:**
  - Signup reveals existing emails via 409 (accepted).
  - Unused `ProductIdInput` / `UserIdInput`.
- **`docs/BACKEND-REFERENCE.md`:** "This repo (snapshot)" updated 2026-11-21 at the user's request. The copy in `~/.cursor/skills/backend-learning-reference/` was not touched.

## Next

Agreed order (one roadmap; `CODE_REVIEW.md` holds the quality items, `docs/BACKEND-REFERENCE.md` → Drafts the feature items):

1. **Automated tests (M7)** — first, so every later change is checked automatically. A "bad body → 400" test is the easy start.
2. **Database schema file (M8)** — all the manual SQL in one file in the repo.
3. ~~API path and status cleanup (M11)~~ — done in `chapter-rest`.
4. **List APIs** — sort, filter, search on product lists (pagination done in `chapter-pagination`).
5. **Prisma era** (`chapter-prisma`), with migrations.

Also open, any time: small cleanups (L1, L5, L8, L9, L10, L12). Auth extras (logout, refresh, reset) stay in `docs/AUTH-PLAN.md` → Nice later.
