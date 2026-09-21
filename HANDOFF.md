# Handoff

## Goal

TypeORM cart chapter finished on MySQL: guest `Cart` + `CartItem` → `Product`, same `/cart` HTTP. Next persistence era (Prisma / Postgres) only when asked. No auth yet.

## Done

- Cart ERD: **Cart 1 — * CartItem * — 1 Product**. Tables `carts`, `cart_items`, `products`. Unique `(cartId, productId)`. `synchronize: false`.
- Cart split committed earlier as `5b5f91f`. No `chapter-*` tag (still TypeORM era).
- `GET /cart` folded into one find: `Cart.getOrCreateGuestWithItems()` with `relations: { items: { product: true } }`; service returns `cart.items`. Writes still use thin `getOrCreateGuest()` then `CartItem.listForCart`.
- Verified via `yarn tsx` (with `dotenv/config`): cart id `1`, `itemCount: 2`, sample nested `productTitle: "Alpine Breeze Bamboo Cutting Board"`. TypeORM log showed JOIN of `carts` → `cart_items` → `products`.
- Committed on `main` as `f35436e` — “Refactor cart handling to optimize guest cart retrieval” (model, service, CHANGELOG, LEARNING, BACKEND-REFERENCE, MENTOR-BRIEFING, HANDOFF).
- `MENTOR-BRIEFING.md` at repo root: finished-work tone, ASCII ERD with all product columns, concepts + next.
- Docs: why no client `cartId` on add; `GET /cart` = my guest cart (not list-all); later identity = token → user → cart. User agreed: cart identity depends on user token when auth lands.
- Cursor canvas `mentor-briefing.canvas.tsx` was created under the IDE canvases folder (Publish for team share). Not required for resume.

## In progress

- Branch: `main` (tracks `origin/main`). Was clean at `f35436e` before this handoff rewrite.
- `HANDOFF.md` just updated (uncommitted) for a fresh session.

## Files

- `models/cart.model.ts` — `getOrCreateGuest()`; `getOrCreateGuestWithItems()`
- `models/cart-item.model.ts` — add/remove/clear/`listForCart`; FKs to cart + product
- `models/product.model.ts` — `cartItems` inverse only
- `services/cart.service.ts` — GET uses WithItems; mutations still list after write
- `MENTOR-BRIEFING.md` — mentor summary + full-field ASCII ERD
- `BACKEND-REFERENCE.md` (+ skill copy) — nested relations, guest vs token cart, no client `cartId`
- `LEARNING.md` / `CHANGELOG.md` — nested GET entry under Unreleased
- `HANDOFF.md` — this file

## Decisions

- Guest cart: server resolves cart (`getOrCreateGuest*`); client sends only `productId` on add/remove.
- `GET /cart` is “my cart,” not `GET /carts`. With auth: still usually `GET /cart` by user, not client-supplied cart id.
- Nested GET keeps HTTP as `CartItem[]` (not wrap in a cart object).
- `items` is the TypeORM relation name → table `cart_items` (not a table named items; not products).
- Full `product: true` for learning; nested `select` (with PKs) later if payload size matters.
- No Prisma / `chapter-prisma` until a new persistence era. Postgres stays in BACKEND-REFERENCE Drafts.

## Constraints

- Architect-mentor: don’t implement unless asked.
- Commit only when asked. Don’t force-push. Don’t retag `chapter-typeorm`.
- Don’t run TypeORM and Prisma on the same tables.
- `synchronize` stays `false`.

## Blocked / open

- None.

## Next

1. Pick from learning roadmap in `BACKEND-REFERENCE.md` → Drafts → What’s next (list APIs, i18n, Postgres, Prisma, auth/pass 2, …).
2. When auth: token → user → active cart (`carts.userId`); keep `GET /cart` / add without client `cartId`.
3. Prisma era when chosen: branch `learn/prisma`, rewrite models + DataSource only; then `chapter-prisma` + Release.
