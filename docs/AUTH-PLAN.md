# Auth plan

Basic auth and a per-user cart for this shop API. Implement in order. Skip nice-to-haves until the core flow works.

## Suggested way (this repo)

| Piece | Choice |
| --- | --- |
| Guest | No cart. Sign up or log in first. |
| Logged-in | JWT access token in `Authorization` (easy with Postman). `/cart` requires it. |
| Next | Cart is login-only (one row per `userId`). Guest cookie was built, then removed. |
| Skip for v1 | Refresh tokens, Redis sessions, OAuth, email verify. |

---

## Stages (chapter tags)

| Stage | Tag | Plan steps | Status |
| --- | --- | --- | --- |
| Users + signup/login | `chapter-auth-users` | 1, 2 (without JWT) | Done |
| JWT + `GET /me` + roles + lock `/admin` | `chapter-auth-jwt` | 2 (JWT), 3, 6 | Done (tag on the finishing commit) |
| Cart per logged-in user | `chapter-auth-cart` | 4, 5 | Done (guest cookie removed afterwards; `/cart` requires a token) |

---

## Plan (do in order)

### 1. Users table — done

- [x] Columns: `id`, `email` (unique), `password` (bcrypt hash), `firstName`, `lastName`, `createdAt`
- [x] TypeORM model like Product/Cart; table created by hand (`synchronize: false`), `UNIQUE (email)` in MySQL
- [x] Admin user CRUD under `/admin` (add, update, delete, list, get by id) — not in the original plan

### 2. Signup + login — done

- [x] `POST /auth/signup` — body → hash → insert user → **201** (**409** if the email exists)
- [x] `POST /auth/login` — email + password → compare hash (**401** "Invalid email or password")
- [x] Login issues a **JWT** (`{ userId, email, role }`, `JWT_EXPIRES_IN` seconds, HS256) → `{ data: { accessToken } }`
- [x] Never return the password hash (`User#toJSON`)

### 3. Proof on later requests — done

- [x] Middleware: read `Authorization: Bearer <token>` → verify → put `req.user` (`middlewares/auth.middleware.ts` → `requireAuth`; `req.user` typed in `types/express.d.ts`)
- [x] `GET /auth/me` — returns current user (proves auth works); `401` bad/missing token, `404` user deleted since the token was issued
- [x] Public stays public: shop products (no auth middleware on that router). `/cart` is not public.

### 4. Cart for the logged-in user — done

- [x] `app.use("/cart", requireAuth, cartRoutes)`. No token, or a bad one → **401**. Sign up or log in first. A customer token is enough.
- [x] `Cart.getOrCreate(userId)` finds the cart for `req.user.userId`, not “the first row”. `UNIQUE (userId)` turns a double-create race into a caught duplicate-key error + re-read
- [x] Client still sends only `productId` on add/remove — never `cartId` in the body

### 5. Guest cart — removed

A guest cookie (`guestCart` / `carts.guestToken`) and “attach after login” were built (released in `chapter-auth-cart`), then removed. The cart belongs only to a logged-in user. There is nothing to merge.

SQL already run when the guest column was added (kept so the cleanup below makes sense):

```sql
ALTER TABLE carts
  ADD COLUMN guestToken CHAR(43) NULL,
  ADD COLUMN userId INT UNSIGNED NULL, -- must match users.id (INT UNSIGNED) for the FK
  ADD CONSTRAINT uq_carts_guest_token UNIQUE (guestToken),
  ADD CONSTRAINT uq_carts_user_id UNIQUE (userId),
  ADD CONSTRAINT fk_carts_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- The old shared guest row (both NULL) can never be matched again
DELETE FROM cart_items WHERE cartId IN (SELECT id FROM carts WHERE guestToken IS NULL AND userId IS NULL);
DELETE FROM carts WHERE guestToken IS NULL AND userId IS NULL;
```

- [x] Cleanup SQL (removes guest carts and the guest column). Run 2026-11-22: the tables were empty, so only the `ALTER` was needed. MySQL Workbench's safe update mode (error 1175) blocks the `DELETE`s; use `SET SQL_SAFE_UPDATES = 0;` for that run if there is data:

```sql
-- Guest carts have no userId. Remove their lines first, then the carts.
DELETE FROM cart_items
WHERE cartId IN (SELECT id FROM (SELECT id FROM carts WHERE userId IS NULL) AS guest_carts);
DELETE FROM carts WHERE userId IS NULL;

ALTER TABLE carts
  DROP COLUMN guestToken, -- its UNIQUE index goes with it
  MODIFY userId INT UNSIGNED NOT NULL; -- every cart now has an owner
```

### 6. Protect what needs it — done

- [x] Start with `GET /me`
- [x] Add `users.role` (`'customer' | 'admin'`, default `'customer'`) — manual SQL (`synchronize: false`)
- [x] Signup never sets `role` (always `customer`). Admin add-user may pass `role` as a **separate** `createUserService` argument after `isUserRole`; the constructor still does not copy `role` from the body
- [x] Create the first admin by hand in SQL, not through an API
- [x] `requireAdmin` middleware after the auth middleware: no/bad token → **401**, valid token but not admin → **403**
- [x] Lock the whole router in one place: `app.use("/admin", requireAuth, requireAdmin, adminRoutes)`
- [x] Role is read from the JWT (stale until expiry — 15 minutes). Re-read from the DB later if demotion must be instant

SQL run for this step (MySQL; enum values must match `USER_ROLES`):

```sql
ALTER TABLE users
  ADD COLUMN role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer';

-- First admin (existing rows got 'customer' from the default)
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Admins already logged in must log in again: older tokens have no `role` and get **401**.

Why roles are here and not "later": signup is public, so "any logged-in user" means anyone can sign up and manage users/products.

---

## Nice to have (not in the first cut)

| Item | Why later |
| --- | --- |
| **Logout** | With JWT-only, client drops the token; real revoke needs a server denylist or sessions |
| **Refresh token / server session** | Short access JWT + revoke / “logout all devices” |
| **Session cookie instead of JWT** | Better browser-shop default once you care about cookies + logout |
| **Password reset / email verify** | Real product; extra tables + mail |
| **Guest cart** | Removed. A cart exists only after signup or login |
| **Redis for sessions** | Multi-server / serious revoke — overkill while one process |
| **OAuth (Google, etc.)** | After email/password is solid |
| **CSRF** | When login (or cart) proof is a cookie the browser auto-sends — e.g. session cookie, or a real browser FE. Less urgent while auth is Bearer JWT in Postman. Use `SameSite` on cookies first; add a CSRF token/library when cookie auth is live. |
| **XSS** | When a real frontend holds a JWT JS can read (`localStorage` / non-`HttpOnly` cookie). Bad script on *your* site can steal the token and call the API as the user. Prefer short-lived tokens; avoid storing access tokens where JS can read them if you can; sanitize rendered content. Bigger concern than CSRF for the Bearer-JWT path. |

---

## One-line summary

**Must ship:** users → signup/login + JWT → `GET /me` → roles + lock `/admin` → cart per logged-in user (`requireAuth` on `/cart`).

**Nice later:** logout/revoke, refresh or full sessions, reset/verify, OAuth, CSRF (cookie auth), XSS (frontend + readable tokens).
