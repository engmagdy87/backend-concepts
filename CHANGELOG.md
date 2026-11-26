# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- CORS (`cors` package): browser pages on the addresses in `CORS_ORIGIN` (comma-separated, in `.env`) may call the API; any other address gets no permission
- Payments with Stripe Checkout (test mode): `POST /checkout` (login) turns the cart into a `pending` order and returns Stripe's payment page `url`; `GET /checkout/success` asks Stripe whether the session is paid, then marks the order `paid` and empties the cart; `GET /checkout/cancel`. Prices always come from the database
- `orders` and `order_items` tables (manual SQL in the README); each order item copies the product's title and price
- `GET /orders` (login): your own orders, newest first, with their items
- `STRIPE_SECRET_KEY` (must be `sk_test_...`) and `APP_URL` in `.env`; the server refuses to start without them
- Pagination on `GET /shop/products` and `GET /admin/products`: `?page` (≥ 1, default 1) and `?limit` (1–50, default 10). Response adds `meta` (`totalItems`, `currentPage`, `lastPage`, `hasNextPage`, `hasPreviousPage`, `nextPage`, `previousPage`). Bad query → **400** "Invalid query"
- `POST /admin/products/:id/image`: upload a product image (multer, form-data field `image`; JPEG/PNG/WebP, max 2 MB). Saved in `uploads/products/` with a random name; `imageUrl` becomes `/images/<file>`. **400** no file / wrong type, **413** too big, **404** unknown product
- `GET /images/<file>` serves uploaded images (`express.static`)
- `GET /cart/quote`: the logged-in user's cart as a PDF download (PDFKit, streamed, not saved). **400** "Cart is empty"
- `users` table (TypeORM `User`, unique `email`) with admin CRUD: `POST /admin/add-user`, `PUT /admin/update-user/:id`, `DELETE /admin/delete-user/:id`, `GET /admin/users`, `GET /admin/users/:id`
- `POST /auth/signup` (`201`; `409` when the email exists) and `POST /auth/login` (`401` "Invalid email or password")
- Passwords hashed with bcrypt (`utils/password.utils.ts`); user responses never include `password`
- Request body validation with [zod](https://zod.dev): schemas in `schemas/` (product, user, cart) and `validateBody` middleware. A bad body returns **400** `{ message: "Invalid body", errors: { field: [...] } }` listing every problem; a good body reaches the controller trimmed and with unknown fields dropped
- Signup and admin add/update user: `email` must be a valid email, `password` 8–72 characters, names 1–100 characters
- Cart API under `/cart` with service layer (published-product check; add/remove one unit)
- `PUT /admin/products/:id` to replace an existing product (id in the URL)
- `DELETE /admin/delete-product/:id` to delete a product (id in the URL)
- JWT access tokens (`utils/token.utils.ts`, HS256): `JWT_SECRET` and `JWT_EXPIRES_IN` (seconds) from `.env`; the server refuses to start if either is missing or invalid
- `.env.example` listing the required environment variables
- `GET /auth/me` returns the caller's own user from the token (`401` for a missing, malformed, invalid, or expired token; `404` if the user no longer exists)
- `requireAuth` middleware (`middlewares/auth.middleware.ts`): reads `Authorization: Bearer <token>`, verifies it, and sets `req.user`
- `users.role` (`customer` | `admin`, default `customer`); first admin created by SQL
- `requireAdmin` middleware: **403** `"Admins only"` when the token is valid but the role is not `admin`
- `POST /admin/add-user` optional `role` (checked against `USER_ROLES`; omitted → `customer`)
- `carts.userId` (`UNIQUE`, FK → `users.id` `ON DELETE CASCADE`); one cart per logged-in user. SQL in `docs/AUTH-PLAN.md`

### Fixed
- `GET /admin/products/:id`, `GET /admin/users/:id` and `GET /shop/products/:id` returned **404** for a non-number id like `abc`; every `:id` route now returns **400** for that (and **404** only for a valid id with no row)
- Two signups (or admin add-user) with the same email at the same moment returned **500** for the second one; MySQL's duplicate-email error now returns **409** "Email already exists". Same for update-user changing to an email someone just took (409 "Email already in use")
- `POST /cart/items` with a non-number `productId` (e.g. `"abc"`) returned **404**; it now returns **400**
- Add/update product with a missing or wrong-typed field returned **500** or saved bad data; it now returns **400**
- A non-string `password` (e.g. `123`) on signup crashed bcrypt (**500**); it now returns **400**
- `DELETE /cart/items` returns `400` when `productId` is not a positive integer (controller compared `null` to the service’s `undefined`)
- TypeORM start under `tsx`: `@Column({ type })` so column types are not guessed (`Product#title` crash)
- `GET /admin/products` and get-by-id return `isPublished` as `true`/`false` (MySQL stores `TINYINT` 0/1)
- `POST /cart/items` awaits the product lookup (add-to-cart was treating the Promise as a missing product)
- Deleting a product returns `404` when no MySQL row matches
- Bad JSON body returns **400** and a too-large body **413** (was always **500**); real server errors still return a generic **500**
- SQL query logs (which include emails and password hashes) only print when `NODE_ENV=development`; otherwise only errors are logged
- Every visitor shared one cart (`find({ take: 1 })`): carts are looked up by `userId` with `Cart.getOrCreate(userId)`; concurrent first requests for the same user create one row (duplicate-key → re-read)

### Changed
- Admin paths are REST style: `POST /admin/products` (was `/admin/add-product`), `DELETE /admin/products/:id` (was `/admin/delete-product/:id`), `POST /admin/users` (was `/admin/add-user`), `PUT /admin/users/:id` (was `/admin/update-user/:id`), `DELETE /admin/users/:id` (was `/admin/delete-user/:id`). The old paths return **404**
- `GET /shop/products` and `GET /admin/products` return at most `limit` products (10 by default) instead of all of them, ordered by `id`. Ask for more pages with `?page=`
- `imageUrl` is no longer part of the add/update product body (a sent one is dropped); it's `null` until an image is uploaded. Manual SQL: `ALTER TABLE products MODIFY imageUrl VARCHAR(255) NULL;`
- Uploading a new image deletes the old file, and deleting a product deletes its image file (only files we own under `/images/`, never external URLs)
- Types for request bodies (`ProductInput`, `UserInput`, `AddUserBody`, `LoginBody`, cart bodies) come from the zod schemas (`z.infer`), so the type and the runtime check can't drift apart
- `productId` in cart bodies must be a JSON number; numeric strings like `"6"` now return **400**
- A `role` sent to signup or update-user is dropped silently instead of being ignored by the controller
- `/cart` requires a logged-in user (`requireAuth`). Missing, malformed, invalid, or expired token → **401**. Sign up or log in first. The cart is that user's row (`carts.userId`)
- `yarn start` sets `NODE_ENV=development`
- The server refuses to start if `JWT_SECRET` is shorter than 32 characters
- `X-Powered-By: Express` header is no longer sent
- `/admin` is locked: `app.use("/admin", requireAuth, requireAdmin, adminRoutes)` — **401** missing/bad token, **403** not admin
- JWT payload includes `role` (`{ userId, email, role }`); `verifyToken` returns `null` if `role` is missing or not in `USER_ROLES`
- `POST /auth/login` returns `{ data: { accessToken } }` (JWT with `userId`, `email`, and `role`, 15 minutes by default) instead of the user
- Delete takes the id in the URL, no JSON body: `DELETE /admin/delete-product/:id` (was `POST /admin/delete-product`) and `DELETE /admin/delete-user/:id` (was `DELETE /admin/delete-user`)
- `parseId` moved from `Product` to `utils/number.utils.ts` (shared by products, cart, and users)
- `GET /cart` loads the user's cart with nested `items.product` in one TypeORM find (same JSON array response)
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
- `findMissingFields` (`utils/validation.utils.ts`) and the hand-written `isUserRole` check in add-user, replaced by the schemas
- Guest cart (shipped in `chapter-auth-cart`): the `guestCart` cookie, `carts.guestToken`, `optionalAuth`, `resolveCartOwner`, and attaching a guest cart after login
- `cookie-parser` (nothing reads cookies anymore)
- Stale `package-lock.json` (the project uses Yarn; `yarn.lock` is the only lockfile)
- Leftover `data/cart.json` (cart is MySQL `carts` + `cart_items`)

## [0.1.0] - 2026-08-24

### Added

- Express 5 + TypeScript app listening on port 3040
- Admin routes to add a product, list all products, and get a product by id
- Shop routes to list and get **published** products only
- JSON file persistence for products (`data/products.json`)
