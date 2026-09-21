# Handoff

## Goal

TypeORM cart chapter is finished: guest `Cart` + `CartItem` lines pointing at products, same `/cart` HTTP. Stay on MySQL until the next persistence move. No Prisma yet.

## Done

- MySQL (observed `SHOW CREATE TABLE`): `carts` (`id=1` guest row); `cart_items.cartId` NOT NULL; `UNIQUE (cartId, productId)`; FKs to `carts` and `products` (`ON DELETE CASCADE`).
- Dropped old unique `uq_cart_items_productId` after `ERROR 1553 (HY000): Cannot drop index 'uq_cart_items_productId': needed in a foreign key constraint` — dropped `fk_cart_items_product` first, then re-added.
- Models: `Cart` → table `carts`; `CartItem` → `cart_items`; `Product.cartItems` `@OneToMany`. Inverted `Product.cart` / `new Cart()` removed.
- `synchronize: false`. Schema was manual SQL, not TypeORM.
- TypeORM 1: `relations: { product: true }` — string array form threw `TypeORMError: String-array "relations" syntax has been removed.`
- Verified via `yarn tsx`: add product 6 twice → qty 2, nested title `Alpine Breeze Bamboo Cutting Board`; remove → qty 1; `clearForCart` → 0 rows.
- Verified HTTP: `POST /cart/items` `{"productId":6}` returned nested `product`. `GET /shop/products` still 10 rows, no `cartItems` on the JSON.
- Postman local + cloud `putCollection` `35152687-42d4f03c-deec-4df2-886e-1f1e59ad40ea` synced; `productId` variable `6`.
- Deleted leftover `data/cart.json`. README no longer says the cart is a file.
- User confirmed Postman sidebar (Admin / Shop / Cart) is the expected API. No new routes.
- No `chapter-*` tag on the cart commit — still TypeORM era. Next era tag is `chapter-prisma`.
- Cart split committed as `5b5f91f`; later `BACKEND-REFERENCE.md` commits on `main`.

## In progress

- Branch: `main` (tracks `origin/main`). This turn: rewrite `HANDOFF.md` only (Postgres on Next; Done refreshed after cart landed).
- `getCartService` still: `Cart.getOrCreateGuest()` then `CartItem.listForCart(cart.id)` — two queries. Guest find has no `relations`. Explained; user has not asked to fold into `cart.items`.
- Guest DB row state not re-checked this session.

## Files

- `models/cart.model.ts` — guest `Cart` header; `getOrCreateGuest` (`find({ take: 1 })`)
- `models/cart-item.model.ts` — add/remove/clear/list; `@ManyToOne` cart + product
- `models/product.model.ts` — `cartItems` inverse only
- `services/cart.service.ts` — published check then guest cart + items
- `utils/database.utils.ts` — entities `[Product, Cart, CartItem]`; MySQL DataSource
- `postman/backend-concepts.postman_collection.json` — cart notes; `{{productId}}`
- `BACKEND-REFERENCE.md` + `~/.cursor/skills/backend-learning-reference/BACKEND-REFERENCE.md`
- `.cursor/rules/chapter-releases.mdc` — skip tag unless new era

## Decisions

- ERD: **Cart 1 — * CartItem * — 1 Product**. Rejected `cartId` on `products`.
- One **active** cart per user is a business rule; no `users` table until auth. Today: one guest `carts` row.
- `productId` stays on the **item** (and on `POST/DELETE /cart/items` body).
- Unique is `(cartId, productId)`, not global `productId`.
- No GitHub Release / `chapter-*` tag until a new persistence era.
- User asked this session: put **Postgres** on the handoff Next list (before / alongside the Prisma move).

## Constraints

- Architect-mentor: don’t implement unless asked.
- Commit only when asked. Don’t force-push. Don’t retag `chapter-typeorm`.
- Don’t run TypeORM and Prisma on the same tables.
- `synchronize` stays `false`.

## Blocked / open

- Pass 2 (`users` + `carts.userId`) not requested.
- Optional GET improvement: load `relations: { items: { product: true } }` and return `cart.items` instead of `listForCart`.
- `BACKEND-REFERENCE.md` inbox may still have a duplicated “Cart as an array vs CartItem rows” block (cosmetic).

## Next

1. Optional TypeORM polish only if asked: fold GET cart into `relations: { items: { product: true } }` on the guest cart.
2. **Postgres** — next store move when they want it (TypeORM driver swap and/or as the DB under Prisma); update DataSource / env / schema notes; do not invent the migration path until asked.
3. Prisma era when they want it: branch `learn/prisma`, rewrite `models/` + DataSource only; then `chapter-prisma` + Release.
