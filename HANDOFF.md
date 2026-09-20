# Handoff

## Goal

Finish TypeORM with a real Cart + CartItem relation (guest basket, items point at products). Same `/cart` HTTP. No Prisma yet.

## Done

- MySQL (observed `SHOW CREATE TABLE`): `carts` (`id=1` guest row); `cart_items.cartId` NOT NULL; `UNIQUE (cartId, productId)`; FKs to `carts` and `products` (`ON DELETE CASCADE`).
- Dropped old unique `uq_cart_items_productId` after `ERROR 1553 (HY000): Cannot drop index 'uq_cart_items_productId': needed in a foreign key constraint` — dropped `fk_cart_items_product` first, then re-added.
- Models: `Cart` → table `carts`; `CartItem` → `cart_items`; `Product.cartItems` `@OneToMany`. Inverted `Product.cart` / `new Cart()` removed.
- `synchronize: false`. Schema was manual SQL, not TypeORM.
- TypeORM 1: `relations: { product: true }` — string array form threw `TypeORMError: String-array "relations" syntax has been removed.`
- Verified via `yarn tsx`: add product 6 twice → qty 2, nested title `Alpine Breeze Bamboo Cutting Board`; remove → qty 1; `clearForCart` → 0 rows.
- Verified HTTP: `POST /cart/items` `{"productId":6}` returned nested `product`. `GET /shop/products` still 10 rows, no `cartItems` on the JSON.
- Postman local file updated; cloud `putCollection` `35152687-42d4f03c-deec-4df2-886e-1f1e59ad40ea` succeeded (`updatedAt` `2026-09-20T21:21:23.000Z`). `productId` variable `6`.
- Deleted leftover `data/cart.json`. README no longer says the cart is a file.
- User confirmed Postman sidebar (Admin / Shop / Cart) is the expected API. No new routes.
- User asked “do we need a release?” — **no**. Still TypeORM era. Do not retag `chapter-typeorm`. Next era tag is `chapter-prisma`.
- Prior `git commit` in this session **aborted** (`Command failed to spawn`). Changes still staged on `main` @ `f3adba5`, up to date with `origin/main`.

## In progress

- Branch: `main` (tracks `origin/main`).
- Staged (12 files) plus this `HANDOFF.md` (overwrite of previous chapter-tag handoff): `BACKEND-REFERENCE.md`, `CHANGELOG.md`, `LEARNING.md`, `README.md`, `data/cart.json` (delete), `models/cart-item.model.ts` (new), `models/cart.model.ts`, `models/product.model.ts`, `postman/backend-concepts.postman_collection.json`, `services/cart.service.ts`, `types/cart.types.ts`, `utils/database.utils.ts`.
- `getCartService` still: `Cart.getOrCreateGuest()` then `CartItem.listForCart(cart.id)` — two queries. Guest find has no `relations`. Explained; user has not asked to fold into `cart.items`.
- Guest cart contents after HTTP POST: one line for product 6 unless cleared since. Not re-checked after README/`cart.json` delete.

## Files

- `models/cart.model.ts` — guest `Cart` header; `getOrCreateGuest` (`find({ take: 1 })`)
- `models/cart-item.model.ts` — add/remove/clear/list; `@ManyToOne` cart + product
- `models/product.model.ts` — `cartItems` inverse only
- `services/cart.service.ts` — published check then guest cart + items
- `utils/database.utils.ts` — entities `[Product, Cart, CartItem]`
- `postman/backend-concepts.postman_collection.json` — cart notes; `{{productId}}`
- `BACKEND-REFERENCE.md` + `~/.cursor/skills/backend-learning-reference/BACKEND-REFERENCE.md` — inbox (skill copy not in git)
- `.cursor/rules/chapter-releases.mdc` — skip tag unless new era

## Decisions

- ERD: **Cart 1 — * CartItem * — 1 Product**. Rejected `cartId` on `products`.
- One **active** cart per user is a business rule; no `users` table until auth. Today: one guest `carts` row.
- `productId` stays on the **item** (and on `POST/DELETE /cart/items` body). Not removed from MySQL.
- Array `{ product, quantity }[]` is the in-memory shape; SQL stores one row per object.
- Unique is `(cartId, productId)`, not global `productId`.
- No GitHub Release / `chapter-*` tag on this commit. User may override.

## Constraints

- Architect-mentor: don’t implement unless asked. This session they asked: apply pass 1, Postman, remove `cart.json`, commit+push.
- Commit only when asked. Don’t force-push. Don’t retag `chapter-typeorm`.
- Don’t run TypeORM and Prisma on the same tables.
- `synchronize` stays `false`.

## Blocked / open

- Pass 2 (`users` + `carts.userId`) not requested.
- Optional GET improvement: load `relations: { items: { product: true } }` and return `cart.items` instead of `listForCart`.
- `BACKEND-REFERENCE.md` inbox has a duplicated “Cart as an array vs CartItem rows” block under “Cart header + line”. Cosmetic.

## Next

1. Commit the staged work + this handoff; `git push origin main`. Skip `chapter-*` tag; say so.
2. If continuing TypeORM: fold GET cart into `relations` on the guest cart (only if asked).
3. Prisma era when they want it: branch `learn/prisma`, rewrite `models/` + DataSource only; then `chapter-prisma` + Release.
