# Mentor briefing — what was finished

TypeScript Express learning API. Persistence path: JSON → mysql2 → **TypeORM on MySQL**. Latest chapters: auth in three stages (`chapter-auth-users` → `chapter-auth-jwt` → `chapter-auth-cart`).

| | |
| --- | --- |
| Entities | 4 (User, Cart, CartItem, Product) |
| Store | MySQL |
| Auth | Signup / login → JWT (`{ userId, email, role }`) in `Authorization: Bearer` |
| Cart mode | One cart per logged-in user (`userId`). No token → 401 |
| Admin | `/admin` needs an admin token (401 no/bad token, 403 not admin) |
| Add / remove | ±1 quantity on the line |

## ERD (current)

```
┌─────────────────┐         ┌─────────────┐
│ User            │  1   1  │ Cart        │
│ users           │─────────│ carts       │
├─────────────────┤         ├─────────────┤
│ id PK           │         │ id PK       │
│ email U         │         │ userId U FK │
│ password (hash) │         └──────┬──────┘
│ firstName       │                │ 1
│ lastName        │                │
│ role            │                │ *
│ createdAt       │         ┌──────┴───────────┐         ┌─────────────────┐
└─────────────────┘         │ CartItem         │  *   1  │ Product         │
                            │ cart_items       │─────────│ products        │
                            ├──────────────────┤         ├─────────────────┤
                            │ id PK            │         │ id PK           │
                            │ cartId FK        │         │ title           │
                            │ productId FK     │         │ price           │
                            │ quantity         │         │ description     │
                            └──────────────────┘         │ imageUrl        │
                                                         │ isPublished     │
                                                         └─────────────────┘
```

- **User 1 — 1 Cart 1 — * CartItem * — 1 Product**
- Unique `(cartId, productId)` on `cart_items`
- Cart owner: `UNIQUE userId` (FK → `users`, `ON DELETE CASCADE`). `/cart` requires a Bearer token
- `role` is `customer` (default) or `admin`; the first admin is set by SQL
- Schema: manual SQL (`synchronize: false`)
- Relations (`items`, `cart`, `product`, `cartItems`) are TypeORM links, not extra columns

## Completed

| Item | Detail |
| --- | --- |
| Entities + tables | User / Cart / CartItem / Product via TypeORM + manual SQL |
| Auth | Signup, login (JWT), `GET /auth/me`, `requireAuth`, `requireAdmin` |
| Cart per user | `Cart.getOrCreate(userId)`; `UNIQUE (userId)` stops a second cart |
| Guest cart | Built, then removed. A cart needs a login |
| HTTP | `POST`/`DELETE /cart/items`, clear, get — qty on the line |
| GET polish | One find: `relations: { items: { product: true } }` → `cart.items` |
| Safety | SQL logs only in development, 400 for bad JSON, strong `JWT_SECRET` check |

## Concepts covered

- JSON array ≠ DB rows; the line entity owns the FKs.
- "Whose cart?" comes from the token (`req.user.userId`), never from a `cartId` in the body.
- The database `UNIQUE` rule is the real guarantee; the `if` in code is not enough.
- 401 = who are you? 403 = I know you, but no.

## Possible next

- Input validation (H3 in `CODE_REVIEW.md`).
- Later: tests, schema file, Prisma / `chapter-prisma`.

---

Source: `HANDOFF.md` · auth chapters (TypeORM era)
