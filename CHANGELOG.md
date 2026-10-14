# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `users` table (TypeORM `User`, unique `email`) with admin CRUD: `POST /admin/add-user`, `PUT /admin/update-user/:id`, `DELETE /admin/delete-user`, `GET /admin/users`, `GET /admin/users/:id`
- `POST /auth/signup` (`201`; `409` when the email exists) and `POST /auth/login` (`401` "Invalid email or password")
- Passwords hashed with bcrypt (`utils/password.utils.ts`); user responses never include `password`
- Required-field check (`utils/validation.utils.ts`): add/update user, signup, and login return `400` listing missing fields
- Cart API under `/cart` with service layer (published-product check; add/remove one unit)
- `PUT /admin/products/:id` to replace an existing product (id in the URL)
- `POST /admin/delete-product` to delete a product by `id`
- JWT access tokens (`utils/token.utils.ts`, HS256): `JWT_SECRET` and `JWT_EXPIRES_IN` (seconds) from `.env`; the server refuses to start if either is missing or invalid
- `.env.example` listing the required environment variables
- `GET /auth/me` returns the caller's own user from the token (`401` for a missing, malformed, invalid, or expired token; `404` if the user no longer exists)
- `requireAuth` middleware (`middlewares/auth.middleware.ts`): reads `Authorization: Bearer <token>`, verifies it, and sets `req.user`
- `users.role` (`customer` | `admin`, default `customer`); first admin created by SQL
- `requireAdmin` middleware: **403** `"Admins only"` when the token is valid but the role is not `admin`
- `POST /admin/add-user` optional `role` (checked against `USER_ROLES`; omitted → `customer`)
- `optionalAuth` middleware: no `Authorization` header → continue as guest; a header that is present must be valid (**401** otherwise)
- `resolveCartOwner` middleware (`middlewares/cart-owner.middleware.ts`): logged-in → cart by `userId`; guest → `guestCart` cookie (32 random bytes, `HttpOnly`, `SameSite=Lax`, `Path=/cart`, 30 days, `Secure` in production)
- `carts.guestToken` and `carts.userId` (both `UNIQUE`, `userId` FK → `users.id` `ON DELETE CASCADE`); SQL in `docs/AUTH-PLAN.md`
- `cookie-parser` dependency
- Guest cart is attached to the user on their first `/cart` request after login when the user has no cart yet (`Cart.attachGuestCart`); the `guestCart` cookie is then cleared. If the user already has a cart, both carts are kept as they are

### Fixed
- `POST /admin/delete-product` returns `400` instead of `500` when the request has no JSON body
- `DELETE /cart/items` returns `400` when `productId` is not a positive integer (controller compared `null` to the service’s `undefined`)
- TypeORM start under `tsx`: `@Column({ type })` so column types are not guessed (`Product#title` crash)
- `GET /admin/products` and get-by-id return `isPublished` as `true`/`false` (MySQL stores `TINYINT` 0/1)
- `POST /cart/items` awaits the product lookup (add-to-cart was treating the Promise as a missing product)
- `POST /admin/delete-product` returns `404` when no MySQL row matches
- Bad JSON body returns **400** and a too-large body **413** (was always **500**); real server errors still return a generic **500**
- SQL query logs (which include emails and password hashes) only print when `NODE_ENV=development`; otherwise only errors are logged
- Every visitor shared one cart (`find({ take: 1 })`): carts are now looked up by owner with `Cart.getOrCreate(owner)`; concurrent first requests for the same owner create one row (duplicate-key → re-read)

### Changed
- `yarn start` sets `NODE_ENV=development`
- The server refuses to start if `JWT_SECRET` is shorter than 32 characters
- `X-Powered-By: Express` header is no longer sent
- `/admin` is locked: `app.use("/admin", requireAuth, requireAdmin, adminRoutes)` — **401** missing/bad token, **403** not admin
- JWT payload includes `role` (`{ userId, email, role }`); `verifyToken` returns `null` if `role` is missing or not in `USER_ROLES`
- `POST /auth/login` returns `{ data: { accessToken } }` (JWT with `userId`, `email`, and `role`, 15 minutes by default) instead of the user
- Delete takes the id in the URL, no JSON body: `DELETE /admin/delete-product/:id` (was `POST /admin/delete-product`) and `DELETE /admin/delete-user/:id` (was `DELETE /admin/delete-user`)
- `parseId` moved from `Product` to `utils/number.utils.ts` (shared by products, cart, and users)
- `GET /cart` loads the guest cart with nested `items.product` in one TypeORM find (same JSON array response)
- Cart is a header (`carts`) plus items (`cart_items` with `cartId`). `GET /cart` loads each item’s `product`. Same `/cart` routes.
- `GET /cart` (and add/remove/clear responses) include the cart line `id`
- Cart persistence is TypeORM on `cart_items` (find then increment or insert; remove/clear/get use the same repository). Leftover mysql2 `db.execute` removed.
- Product persistence is MySQL only (`data/products.json` and `product.utils.ts` removed).
- Replaced `POST /admin/update-product` with `PUT /admin/products/:id` (full body; id in the URL)
- `POST /cart/items` adds one unit (`productId` only); stored line quantity is not a request field. `DELETE /cart/items` decrements by one
- Split product handling into `types/`, `models/`, `utils/`, and thin controllers; routes renamed to `*.route.ts`
- Product ids are positive integers (`Product.parseId`); new rows use MySQL `insertId`
- Renamed admin update API from `edit-product` / `editProduct` to `update-product` / `updateProduct`

### Removed
- Stale `package-lock.json` (the project uses Yarn; `yarn.lock` is the only lockfile)
- Leftover `data/cart.json` (cart is MySQL `carts` + `cart_items`)

## [0.1.0] - 2026-08-24

### Added

- Express 5 + TypeScript app listening on port 3040
- Admin routes to add a product, list all products, and get a product by id
- Shop routes to list and get **published** products only
- JSON file persistence for products (`data/products.json`)
