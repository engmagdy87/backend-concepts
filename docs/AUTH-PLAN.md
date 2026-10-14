# Auth plan

Basic auth + guest cart for this shop API. Implement in order. Skip nice-to-haves until the core flow works.

## Suggested way (this repo)

| Piece | Choice |
| --- | --- |
| Guest | Cart cookie (opaque id → server finds/creates cart). No Redis yet. |
| Logged-in | JWT access token in `Authorization` (easy with Postman). |
| Next | Cart chapter done (per-user / per-guest-cookie cart, guest cart attached after login). Merge rules are in “Nice to have”. |
| Skip for v1 | Refresh tokens, Redis sessions, OAuth, email verify. |

---

## Stages (chapter tags)

| Stage | Tag | Plan steps | Status |
| --- | --- | --- | --- |
| Users + signup/login | `chapter-auth-users` | 1, 2 (without JWT) | Done |
| JWT + `GET /me` + roles + lock `/admin` | `chapter-auth-jwt` | 2 (JWT), 3, 6 | Done (tag on the finishing commit) |
| Guest cart cookie + cart per user | `chapter-auth-cart` | 4, 5 | Later |

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
- [x] Public stays public: shop products, guest cart (no middleware on those routers)

### 4. Guest cart cookie (before / without signup)

- [x] On first cart touch: `Set-Cookie: guestCart=<32 random bytes, base64url>` (`HttpOnly`, `SameSite=Lax`, `Path=/cart`, 30 days, `Secure` in production) — `middlewares/cart-owner.middleware.ts`
- [x] `Cart.getOrCreate(owner)` finds the cart for this cookie (`carts.guestToken`), not “one shared row”. `UNIQUE` keys turn the get-or-create race into a caught duplicate-key error + re-read
- [x] Client still sends only `productId` on add/remove — never `cartId` in the body

### 5. Tie cart to user (after login works)

- [x] Add nullable `carts.userId`
- [x] After login: guest cart from the cookie → attached to the user if they have no cart yet (`Cart.attachGuestCart`). Happens on the first `/cart` request with a token, because the cookie is `Path=/cart` and never reaches `/auth/login`. Cookie is cleared after attach. If the user already has a cart, both are left alone (merge rules are in “Nice to have”)
- [x] Logged-in `/cart` (Bearer token, via `optionalAuth`) resolves by `userId`; guest still by cookie. A Bearer header that is present but invalid → **401** (no silent fallback to the guest cart)

SQL run for steps 4–5 (MySQL):

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
| **Guest → user cart merge rules** | Same product lines, quantities — do after basic attach works |
| **Redis for sessions** | Multi-server / serious revoke — overkill while one process |
| **OAuth (Google, etc.)** | After email/password is solid |
| **CSRF** | When login (or cart) proof is a cookie the browser auto-sends — e.g. session cookie, or a real browser FE. Less urgent while auth is Bearer JWT in Postman. Use `SameSite` on cookies first; add a CSRF token/library when cookie auth is live. |
| **XSS** | When a real frontend holds a JWT JS can read (`localStorage` / non-`HttpOnly` cookie). Bad script on *your* site can steal the token and call the API as the user. Prefer short-lived tokens; avoid storing access tokens where JS can read them if you can; sanitize rendered content. Bigger concern than CSRF for the Bearer-JWT path. |

---

## One-line summary

**Must ship:** users → signup/login + JWT → `GET /me` → roles + lock `/admin` → guest cart cookie → then `carts.userId` + merge.

**Nice later:** logout/revoke, refresh or full sessions, reset/verify, OAuth, CSRF (cookie auth), XSS (frontend + readable tokens).
