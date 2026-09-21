# Mentor briefing — what was finished

TypeScript Express learning API. Persistence path: JSON → mysql2 → **TypeORM on MySQL**. Latest chapter: the cart.

| | |
| --- | --- |
| Entities | 3 (Cart, CartItem, Product) |
| Store | MySQL |
| Cart mode | Guest (one `carts` row) |
| Add / remove | ±1 quantity on the line |

## ERD (current)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│ Cart        │  1   *  │ CartItem         │  *   1  │ Product         │
│ carts       │─────────│ cart_items       │─────────│ products        │
├─────────────┤         ├──────────────────┤         ├─────────────────┤
│ id PK       │         │ id PK            │         │ id PK           │
└─────────────┘         │ cartId FK        │         │ title           │
                        │ productId FK     │         │ price           │
                        │ quantity         │         │ description     │
                        └──────────────────┘         │ imageUrl        │
                                                     │ isPublished     │
                                                     └─────────────────┘
```

- **Cart 1 — * CartItem * — 1 Product**
- Unique `(cartId, productId)` on `cart_items`
- Guest setup: one `carts` row; no `users` / `userId` yet
- Schema: manual SQL (`synchronize: false`)
- Relations (`items`, `cart`, `product`, `cartItems`) are TypeORM links, not extra columns

## Completed

| Item | Detail |
| --- | --- |
| Entities + tables | Cart / CartItem / Product via TypeORM + manual SQL |
| HTTP (unchanged) | `POST`/`DELETE /cart/items`, clear, get — qty on the line |
| Schema ops | Dropped old unique blocking FKs; FKs re-added |
| Relations | `relations: { product: true }`; nested product on cart JSON |
| Cleanup | Removed `data/cart.json`; Postman Admin / Shop / Cart synced |
| GET polish | One find: `relations: { items: { product: true } }` → `cart.items` |

## Concepts covered

- JSON array ≠ DB rows; the line entity owns the FKs.
- “One cart per user” is a business rule until `users` exist.
- Still TypeORM era — no Prisma / `chapter-prisma` tag yet.

## Possible next

- Start Prisma / Postgres when chosen.

---

Source: `HANDOFF.md` · cart TypeORM chapter
