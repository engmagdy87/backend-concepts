# Auth plan

Basic auth + guest cart for this shop API. Implement in order. Skip nice-to-haves until the core flow works.

## Suggested way (this repo)

| Piece | Choice |
| --- | --- |
| Guest | Cart cookie (opaque id → server finds/creates cart). No Redis yet. |
| Logged-in | JWT access token in `Authorization` (easy with Postman). |
| Next | Link cart to `userId`; merge guest cart on login. |
| Skip for v1 | Refresh tokens, Redis sessions, OAuth, email verify. |

---

## Stages (chapter tags)

| Stage | Tag | Plan steps | Status |
| --- | --- | --- | --- |
| Users + signup/login | `chapter-auth-users` | 1, 2 (without JWT) | Done |
| JWT + `GET /me` + roles + lock `/admin` | `chapter-auth-jwt` | 2 (JWT), 3, 6 | In progress (JWT + `GET /me` done) |
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
- [x] Login issues a **JWT** (`{ userId, email }`, `JWT_EXPIRES_IN` seconds, HS256) → `{ data: { accessToken } }`
- [x] Never return the password hash (`User#toJSON`)

### 3. Proof on later requests — done

- [x] Middleware: read `Authorization: Bearer <token>` → verify → put `req.user` (`middlewares/auth.middleware.ts` → `requireAuth`; `req.user` typed in `types/express.d.ts`)
- [x] `GET /auth/me` — returns current user (proves auth works); `401` bad/missing token, `404` user deleted since the token was issued
- [x] Public stays public: shop products, guest cart (no middleware on those routers)

### 4. Guest cart cookie (before / without signup)

- [ ] On first cart touch: create cart row → `Set-Cookie` with opaque guest/cart id (`HttpOnly`)
- [ ] `getOrCreateGuest` becomes “find cart for this cookie,” not “one shared row”
- [ ] Client still sends only `productId` on add/remove — never `cartId` in the body

### 5. Tie cart to user (after login works)

- [ ] Add nullable `carts.userId`
- [ ] On login (and/or signup): find guest cart from cookie → attach/merge to that user’s cart
- [ ] Logged-in `GET /cart` resolves by `userId`; guest still by cookie

### 6. Protect what needs it

- [x] Start with `GET /me`
- [ ] Add `users.role` (`'customer' | 'admin'`, default `'customer'`) — manual SQL (`synchronize: false`)
- [ ] Signup and admin add-user never set `role` from the body (constructor copies fields explicitly — keep it)
- [ ] Create the first admin by hand in SQL, not through an API
- [ ] `requireAdmin` middleware after the auth middleware: no/bad token → **401**, valid token but not admin → **403**
- [ ] Lock the whole router in one place: `app.use("/admin", requireAuth, requireAdmin, adminRoutes)`
- [ ] Decide where `role` is read: from the JWT (stale until expiry — keep expiry short) or from the DB on each admin request

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
