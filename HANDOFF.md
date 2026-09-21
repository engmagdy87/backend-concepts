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
- `GET /cart` folded: `Cart.getOrCreateGuestWithItems()` with `relations: { items: { product: true } }`, return `cart.items`. Writes still use thin `getOrCreateGuest()`. HTTP body still a cart-item array. Verified via `yarn tsx`: cart id 1, 2 items, nested product title on sample.
## Files

- `models/cart.model.ts` — `getOrCreateGuest` (header); `getOrCreateGuestWithItems` (nested items.product)
- `models/cart-item.model.ts` — add/remove/clear/list; `@ManyToOne` cart + product
- `models/product.model.ts` — `cartItems` inverse only
- `services/cart.service.ts` — GET uses WithItems; mutations still listForCart after write
- `utils/database.utils.ts` — entities `[Product, Cart, CartItem]`; MySQL DataSource
- `MENTOR-BRIEFING.md` — mentor summary + ASCII ERD
- `BACKEND-REFERENCE.md` + `~/.cursor/skills/backend-learning-reference/BACKEND-REFERENCE.md`
- `.cursor/rules/chapter-releases.mdc` — skip tag unless new era

## Decisions

- ERD: **Cart 1 — * CartItem * — 1 Product**. Rejected `cartId` on `products`.
- One **active** cart per user is a business rule; no `users` table until auth. Today: one guest `carts` row.
- `productId` stays on the **item** (and on `POST/DELETE /cart/items` body).
- Unique is `(cartId, productId)`, not global `productId`.
- No GitHub Release / `chapter-*` tag until a new persistence era.
- **Postgres** lives in `BACKEND-REFERENCE.md` Drafts → What’s next (and Inbox), not on this handoff Next list.
- Nested GET load keeps response as `CartItem[]` (not wrap in a cart object).

## Constraints

- Architect-mentor: don’t implement unless asked.
- Commit only when asked. Don’t force-push. Don’t retag `chapter-typeorm`.
- Don’t run TypeORM and Prisma on the same tables.
- `synchronize` stays `false`.

## Blocked / open

- Pass 2 (`users` + `carts.userId`) not requested.
- `BACKEND-REFERENCE.md` inbox may still have a duplicated “Cart as an array vs CartItem rows” block (cosmetic).

## Next

1. Learning roadmap (list APIs, i18n, Postgres, Prisma, …) — see `BACKEND-REFERENCE.md` → Drafts → What’s next; pick when asked.
2. Prisma era when they want it: branch `learn/prisma`, rewrite `models/` + DataSource only; then `chapter-prisma` + Release.
3. Optional: verify `GET /cart` once via Postman/HTTP after pull.
