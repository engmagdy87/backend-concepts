# Backend reference

Living mentor notes. Newest inbox first. Fold durable rules into the sections below as they settle.

Canonical copy also lives at `~/.cursor/skills/backend-learning-reference/BACKEND-REFERENCE.md` (personal Cursor skill). Keep both in sync.

---

## Inbox

### 2026-08-25 — SQL: find then increment or insert

- In a file, `find` then mutate qty or `push`. In SQL that is `SELECT` by `productId`, then `UPDATE quantity + 1` or `INSERT`.
- Do not mix stores: a leftover `INSERT` plus a JSON write means `GET` (SQL) and add (file) disagree.
- `INSERT ... ON DUPLICATE KEY UPDATE` is the one-statement version; it needs `UNIQUE(productId)` and hides the check. This repo kept the explicit branch.

### 2026-08-25 — Products are MySQL; cart is still a file

- Product catalog no longer has a JSON store. `save` / `update` / `delete` / all fetches use the pool. `data/products.json` and `product.utils.ts` are gone.
- Cart still reads/writes `data/cart.json`. Add-to-cart asks MySQL `fetchPublishedById`, then mutates the cart file.
- When a fetch becomes `async`, callers must `await`. Forgetting it (cart controller) treats a Promise as a missing product.
- `DELETE ... affectedRows > 0` is a valid 404 check. `UPDATE` is not — unchanged values also report 0.

### 2026-08-25 — PUT when the client already has the full resource

- Update is `PUT /admin/products/:id`. Body is full `ProductInput`; one fixed `SET` of every column. Simpler than PATCH’s dynamic `SET`.
- After UPDATE, `SELECT` the row. Do not use `affectedRows === 0` for 404 — MySQL reports 0 when the row exists but values did not change.
- Map `isPublished` with `Boolean(...)` on that SELECT. Delete is still `POST /admin/delete-product` with `id` in the body.
- PATCH stays the right verb when the client only sends changed fields; this app chose PUT because the form is already a full product.

### 2026-08-25 — PATCH: partial SET, id in the URL

- PATCH = partial body + `SET` only for present fields. Column names stay hardcoded (never interpolate client keys into SQL).
- Practiced then replaced with PUT for a fixed full-column `UPDATE`.

### 2026-08-25 — Create returns the row, not void

- `save` awaits `INSERT` and returns `ProductRecord` (`insertId` + fields). Do not return `{ error }` from the model.
- Controller `await`s and puts that row in `201` `data`. Thrown queries still hit the app `500` middleware.
- MySQL `BOOLEAN`/`TINYINT(1)` is `0`/`1` on the wire. Map in the **model** (`Boolean(row.isPublished)`) so the API JSON is a real boolean.

### 2026-08-24 — DB credentials in `.env`

- Host / user / password / database name live in `.env`, never in source.
- Gitignore `.env`. Node does not load it by itself — use `dotenv` at startup (`import "dotenv/config"`).
- One pool reads `process.env.DB_*`; models use the pool, they do not open their own connections.

### 2026-08-24 — Cart add/remove are commands (+1 / −1)

- Quantity is **stored state** on the cart line, not an input on add.
- `POST /cart/items` `{ productId }` adds one; `DELETE /cart/items` subtracts one and drops the line at 0.
- Client-chosen quantity belongs on a later update (e.g. `PATCH`) if you need bulk add.

### 2026-08-24 — splice vs filter

- `filter` builds a **new** array (“cart without this productId”). Use it when the whole line should disappear in one step.
- `splice` **mutates** the array you already have. Use it when you already found the item (e.g. decrement qty, then drop the line at 0). Same style as `addToCart` (`push` / mutate qty).
- `indexOf(existingItem)` is reference equality. Safer: `findIndex` so you splice a known index. Never `splice(-1, 1)` — that deletes the last item.

### 2026-08-24 — Shared utils vs domain utils

- Helpers with **no product/cart meaning** (e.g. `isPositiveInteger`) go in a shared util (`number.utils.ts`), not inside a service or `cart.utils.ts`.
- Same test: duplicated JSON read/write in `product.utils.ts` / `cart.utils.ts` could become a generic `readJsonFile` / `writeJsonFile`; keep the path + typed wrappers in the domain utils.
- Domain rules stay on the model (`Product.parseId` still owns “id from number or numeric string”). Do not extract that.

### 2026-08-24 — Postman collection in git

- Keep `postman/*.postman_collection.json` in the repo: it travels with the API, a clone can import without a Postman account, and route changes show up in git diffs.
- Postman cloud is the **working copy** for sending requests, not the source of truth.
- Two copies drift. When routes change, update the git file first, then re-import or sync to Postman.

### 2026-08-24 — Cart service (first real orchestration)

- `CartService.addToCart`: `Product.fetchPublishedById` → `Cart.addToCart` (+1).
- Result type `{ ok: true, cart } | { ok: false, reason: "not_found" }`; controller maps not found → 404.
- Mounted at `/cart`: `GET /`, `POST /items`, `DELETE /items`, `DELETE /`.

### 2026-08-24 — What a service orchestrates

- Example: delete product (Product model) + clear cart lines (Cart model) + notify (email/SMS external API).
- Service calls those pieces in one use case; it is not the database and not HTTP.
- Each model still owns its own data; notify is usually a client/adapter, not a “Notify model.”

### 2026-08-24 — Update/delete: model vs service

- Single-entity update/delete (find by id, mutate list, write file) stays on the **model**.
- Add a **service** only when the use case orchestrates several steps/models (e.g. delete product + clear cart lines + notify).

### 2026-08-24 — Product id rules

- Positive integer ids; next = `max(id) + 1`.
- `Product.parseId` is the single entry point for URL params and body `id` (number or numeric string).
- Persist with `id` first; pretty-print `products.json` on write.

### 2026-08-24 — Update and delete

- `Product.update` / `Product.delete` mutate the in-memory list by index, then write the file — never reuse `save()` for edits.
- Verb routes: `POST /admin/update-product` and `POST /admin/delete-product` with `id` in the body; REST alternative remains `PUT|PATCH|DELETE /products/:id`.
- With deletes enabled, new ids must be `max(id) + 1`, not `length + 1`.

### 2026-08-24 — PUT vs PATCH

- PUT = replace the whole resource; PATCH = change only some fields.
- This app currently uses verb POSTs (`/update-product`, `/delete-product`); REST would be `PUT|PATCH /products/:id` and `DELETE /products/:id`.

### 2026-08-24 — writeFile vs writeFileSync

- Sync blocks the Node event loop until the disk write finishes; async (`writeFile` / `fs.promises.writeFile`) does not.
- This learning app uses `writeFileSync` in `Product.save()` — fine for now; prefer async when concurrency matters.

### 2026-08-24 — Product API layering (this repo)

- Split a fat controller into **types / model / utils / controller / routes**.
- Admin vs shop: same products, different **queries** (full catalog vs published only).
- Confirmed rename `fetchAll` → `fetchProducts` (controller + model + admin route).

---

## Concepts

### Request flow

```
Request → Route → Controller (HTTP) → Model (domain + persistence)
                      ↑
                   types only
```

- **Route** — URL + HTTP method → handler.
- **Controller** — read `req`, pick status, send JSON. No file I/O, no product filters.
- **Model** — the *thing* (Product): shape, rules, save/fetch/filter.
- **Utils** — dumb helpers with no product meaning (path, read JSON).
- **Types** — shared TypeScript shapes (`ProductInput`, `ProductRecord`).

A model is **not** “the database.” Storage is the JSON file (later: Postgres). The model is the product **in your app**.

### Where logic lives

Ask: *is this a question about the product, or a whole workflow?*

| Kind | Where | Examples |
| --- | --- | --- |
| Domain / data | **Model** | published only, find by id, save + assign id, price ≥ 0 |
| HTTP glue | **Controller** | `400`/`404`, `res.json`, map `req.params.id` |
| Generic helper | **Utils** | `path.join`, parse file if empty, `isPositiveInteger` |
| Multi-step use case | **Service** (later) | cart + stock + coupon + order |

**Do not** put `isPublished` filtering in utils. That is product meaning.

**Service** is optional until one request needs several steps or several models. Do not add a service folder “because real apps have services.”

**Update / delete:** if the work is “find this product, change or remove it, save” → **model** (`Product.update` / `Product.delete`). Put it in a **service** only when the flow is bigger than one entity (e.g. delete product → also remove it from carts → send an email).

Example of a real service (not needed in this repo yet):

```
Controller
  → ProductService.removeProduct(id)     // use case / orchestration
       → Product.delete(id)              // Product model (this entity's data)
       → Cart.removeLinesForProduct(id)  // Cart model (another entity's data)
       → emailClient.send(...)           // external system (API/SDK), not a model
```

- **Models** = your app’s entities and their persistence (`Product`, `Cart`, later `Order`).
- **External service** = something outside your process (SendGrid, Twilio, Stripe). You usually wrap it in a small **client/adapter**, not a “Notify model.”
- **App service** = the glue that runs those steps in the right order and handles “what if step 2 fails?”

### One source of truth

Pick one:

- In-memory list loaded at startup, shop **filters that list**, writes go to memory **and** disk; or
- Always read from disk (no module cache).

Do **not** mix: admin reads memory, shop re-reads the file. Subtle bugs later.

Same rule for SQL vs a JSON file: one entity, one store. Cart add/get/clear use `cart_items`; do not also write `data/cart.json` on add.

### Naming — code

| Kind | Case | Example |
| --- | --- | --- |
| Class / interface / type | PascalCase | `Product`, `ProductInput` |
| Functions / variables | camelCase | `addProduct`, `fetchPublished` |
| Constants | camelCase or SCREAMING | `productsFilePath` |

`import Product from "../models/product.model"` is correct: you import the **class**.

**Functions: singular vs plural matches the return value**

| Returns | Name |
| --- | --- |
| Many | `fetchProducts`, `fetchShoppingProducts`, `fetchPublished` |
| One | `fetchProductById`, `fetchShoppingProductById`, `fetchPublishedById` |
| One created | `addProduct` |

`fetchShoppingProductsById` is wrong — it sounds like many products sharing one id.

### Naming — files

Pattern that worked here: **domain + role suffix**, lowercase.

```
product.model.ts
product.types.ts
product.utils.ts
products.controller.ts   # plural: many endpoints
admin.route.ts
shop.route.ts
```

- Entity files **singular**; controller **plural** is a common, intentional mix. Stick to it.
- Other valid styles exist (`Product.ts` in `models/`, kebab-case). Pick one per repo.

### REST paths

Prefer the **collection**, then the id:

| Action | Path |
| --- | --- |
| List | `GET /products` |
| One | `GET /products/:id` |
| Create | `POST /products` |
| Replace all fields | `PUT /products/:id` |
| Change some fields | `PATCH /products/:id` |
| Delete | `DELETE /products/:id` |

Prefer `/products/:id` over `/product/:id` when the list is already `/products`.

Verb routes like `POST /admin/add-product` work for learning; resource-style `POST /admin/products` is cleaner REST later.

### PUT vs PATCH

Both update an **existing** resource (identified by id in the URL). Difference is **how much** of the body you send.

| | **PUT** | **PATCH** |
| --- | --- | --- |
| Meaning | **Replace** the whole resource | **Partial** update |
| Body | Full product (all fields you care about) | Only fields that change |
| Missing field | Usually treated as “cleared / reset” (you sent the new full state) | Left unchanged |
| Typical use | Form that edits everything | “Publish this” / “change price only” |

Example product `{ id: 1, title: "Book", price: 10, isPublished: false }`:

```http
PUT /admin/products/1
{ "title": "Book", "price": 12, "description": "...", "imageUrl": "...", "isPublished": false }
```

→ Full replacement. Omitted fields should not silently keep old values if you treat PUT strictly.

```http
PATCH /admin/products/1
{ "price": 12 }
```

→ Only `price` changes; `title`, `isPublished`, etc. stay as they were.

**When to use which**

- **PUT** — client has (or rebuilds) the full resource; “save this entire product.”
- **PATCH** — client only knows what changed; toggles, single-field edits, partial admin forms.
- **Neither** — if the resource does not exist yet → **POST** (create). If removing → **DELETE**.

**Idempotency (useful idea):** repeating the same PUT with the same body should leave the same final state. PATCH is often idempotent too when you set fields to absolute values (`"price": 12`), but “increment by 1” style patches are not.

**Your app today:** update is `PUT /admin/products/:id` (full body, id in the URL). Delete is still a verb POST (`POST /admin/delete-product` with `id` in the body).

### Types vs runtime validation

TypeScript `ProductInput` is **compile-time**. `req.body` is still untrusted at runtime.

Validate on the **model** (`Product.validateInput`), return **400** from the **controller** when invalid.

Rules practiced: non-empty trimmed strings for `title` / `description` / `imageUrl`; `price` number ≥ 0; `isPublished` boolean.

### IDs

`products.length + 1` breaks after deletes/gaps.

Safer for a file store: `max(id) + 1` (or a counter).

In this app:

- Stored type: positive integer (`ProductRecord.id`).
- Create: `nextProductId()` = `max(id) + 1`.
- Input: `Product.parseId(value)` accepts `number` or numeric `string` (URL params are always strings).
- On disk: `id` is the first field; writes use `JSON.stringify(..., null, 2)`.

---

### Sync vs async file I/O (`writeFile` vs `writeFileSync`)

| API | Style | Effect |
| --- | --- | --- |
| `fs.writeFileSync(path, data)` | Synchronous | Function returns only after the write finishes. **Blocks** the event loop — other requests wait. |
| `fs.writeFile(path, data, cb)` | Callback async | Returns immediately; calls `cb` when done. |
| `fs.promises.writeFile(path, data)` | Promise async | Use with `async`/`await`. Preferred modern style. |

Same idea for `readFile` / `readFileSync`.

**Why it matters in Express:** one blocked `writeFileSync` on a large file (or slow disk) stalls *every* handler on that process, not only the request that saved.

**Rule of thumb:** learning / tiny JSON store → Sync is OK and simpler. Production APIs → async (`fs.promises`). Databases replace file writes later anyway.

Your code today:

```ts
fs.writeFileSync(productsFilePath, JSON.stringify(products));
```

Later shape:

```ts
await fs.promises.writeFile(productsFilePath, JSON.stringify(products));
```

(`save()` would become `async`, and controllers would `await product.save()`.)

---

## Side notes

- `readFileSync` / `writeFileSync` block the event loop. Fine for a learning JSON store. Real APIs: `fs.promises` (async).
- Default-export the class (`export default Product`) so `new Product` / `Product.fetchProducts()` read naturally.
- Dead imports (controller importing unused file helpers) hide who owns I/O. Controllers should not touch file utils.
- `CHANGELOG.md` = public API/behavior. `LEARNING.md` = short “I practiced X on this date.” This file = mindset for the next project.
- Skip changelog for internal refactors with no API change; still log the concept here if it is reusable.
- `.env` is local secrets. Gitignore it. Node needs `dotenv` to read it.

---

## Drafts

Ideas not implemented, or “next when ready”:

- [x] `PUT /admin/products/:id` (full body; id in the URL)
- [ ] `PATCH /admin/products/:id` if you later want partial updates
- [ ] `DELETE /admin/products/:id` (still `POST /admin/delete-product`)
- [ ] Shared 404/400 response helpers (optional; DRY JSON shape)
- [ ] Async file I/O (`fs.promises`)
- [ ] Service layer only when a use case spans multiple models/steps
- [ ] Align create route with REST (`POST /admin/products`) if you want textbook REST
- [ ] README layout must stay in sync when folders/files change (easy to forget)
- [ ] Ping MySQL at boot (`SELECT 1`) before `app.listen`
- [x] Product model on MySQL (`data/products.json` removed)
- [ ] Cart remove still JSON (`data/cart.json`); add / get / clear use `cart_items`

---

## Quick enhance checklist (learning order)

1. Validate create body → 400
2. ~~Safer ids (`max(id) + 1`)~~ done (needed once delete exists)
3. Keep docs (README diagram) matching layers
4. ~~Update / delete endpoints~~ done (verb-style POSTs; REST verbs still optional)
5. Async I/O
6. Service only if workflows appear

---

## This repo (snapshot)

Useful only as an example of the rules above — not a second source of truth.

This project only: when an endpoint is added, changed, or removed, update `postman/backend-concepts.postman_collection.json` and sync it to Postman over MCP (see `.cursor/rules/postman-collection.mdc`).

```
app.ts
routes/admin.route.ts
routes/shop.route.ts
routes/cart.route.ts
controllers/products.controller.ts
controllers/cart.controller.ts
services/cart.service.ts
models/product.model.ts
models/cart.model.ts
types/product.types.ts
utils/database.utils.ts
data/cart.json
```

Shop: `Product.fetchPublished` / `fetchPublishedById`  
Admin: `addProduct`, `updateProduct`, `deleteProduct`, `fetchProducts`, `fetchProductById`  
Model: `save`, `update`, `delete`, plus fetch helpers
