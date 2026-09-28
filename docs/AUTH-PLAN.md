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
| JWT + `GET /me` + lock `/admin` | `chapter-auth-jwt` | 2 (JWT), 3, 6 | Next |
| Guest cart cookie + cart per user | `chapter-auth-cart` | 4, 5 | Later |

---

## Plan (do in order)

### 1. Users table — done

- [x] Columns: `id`, `email` (unique), `password` (bcrypt hash), `firstName`, `lastName`, `createdAt`
- [x] TypeORM model like Product/Cart; table created by hand (`synchronize: false`), `UNIQUE (email)` in MySQL
- [x] Admin user CRUD under `/admin` (add, update, delete, list, get by id) — not in the original plan

### 2. Signup + login — in progress

- [x] `POST /auth/signup` — body → hash → insert user → **201** (**409** if the email exists)
- [x] `POST /auth/login` — email + password → compare hash (**401** "Invalid email or password")
- [ ] Login issues a **JWT** (e.g. `{ userId, email }`, short expiry) instead of returning the user
- [x] Never return the password hash (`User#toJSON`)

### 3. Proof on later requests

- [ ] Middleware: read `Authorization: Bearer <token>` → verify → put `req.user`
- [ ] `GET /me` — returns current user (proves auth works)
- [ ] Public stays public: shop products, guest cart

### 4. Guest cart cookie (before / without signup)

- [ ] On first cart touch: create cart row → `Set-Cookie` with opaque guest/cart id (`HttpOnly`)
- [ ] `getOrCreateGuest` becomes “find cart for this cookie,” not “one shared row”
- [ ] Client still sends only `productId` on add/remove — never `cartId` in the body

### 5. Tie cart to user (after login works)

- [ ] Add nullable `carts.userId`
- [ ] On login (and/or signup): find guest cart from cookie → attach/merge to that user’s cart
- [ ] Logged-in `GET /cart` resolves by `userId`; guest still by cookie

### 6. Protect what needs it

- [ ] Start with `GET /me`
- [ ] Then lock `/admin` so only a logged-in user (role later if you want)

---

## Nice to have (not in the first cut)

| Item | Why later |
| --- | --- |
| **Logout** | With JWT-only, client drops the token; real revoke needs a server denylist or sessions |
| **Refresh token / server session** | Short access JWT + revoke / “logout all devices” |
| **Session cookie instead of JWT** | Better browser-shop default once you care about cookies + logout |
| **Password reset / email verify** | Real product; extra tables + mail |
| **Roles** (`admin` vs `customer`) | When admin must not be “any logged-in user” |
| **Guest → user cart merge rules** | Same product lines, quantities — do after basic attach works |
| **Redis for sessions** | Multi-server / serious revoke — overkill while one process |
| **OAuth (Google, etc.)** | After email/password is solid |
| **CSRF** | When login (or cart) proof is a cookie the browser auto-sends — e.g. session cookie, or a real browser FE. Less urgent while auth is Bearer JWT in Postman. Use `SameSite` on cookies first; add a CSRF token/library when cookie auth is live. |
| **XSS** | When a real frontend holds a JWT JS can read (`localStorage` / non-`HttpOnly` cookie). Bad script on *your* site can steal the token and call the API as the user. Prefer short-lived tokens; avoid storing access tokens where JS can read them if you can; sanitize rendered content. Bigger concern than CSRF for the Bearer-JWT path. |

---

## One-line summary

**Must ship:** users → signup/login + JWT → `GET /me` → guest cart cookie → then `carts.userId` + merge.

**Nice later:** logout/revoke, refresh or full sessions, roles, reset/verify, OAuth, CSRF (cookie auth), XSS (frontend + readable tokens).
