# Backend reference

Living mentor notes. Newest inbox first. Fold durable rules into the sections below as they settle.

Canonical copy also lives at `~/.cursor/skills/backend-learning-reference/BACKEND-REFERENCE.md` (personal Cursor skill). Keep both in sync.

---

## Inbox

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
| Generic helper | **Utils** | `path.join`, parse file if empty |
| Multi-step use case | **Service** (later) | cart + stock + coupon + order |

**Do not** put `isPublished` filtering in utils. That is product meaning.

**Service** is optional until one request needs several steps or several models. Do not add a service folder “because real apps have services.”

### One source of truth

Pick one:

- In-memory list loaded at startup, shop **filters that list**, writes go to memory **and** disk; or
- Always read from disk (no module cache).

Do **not** mix: admin reads memory, shop re-reads the file. Subtle bugs later.

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

Prefer `/products/:id` over `/product/:id` when the list is already `/products`.

Verb routes like `POST /admin/add-product` work for learning; resource-style `POST /admin/products` is cleaner REST later.

### Types vs runtime validation

TypeScript `ProductInput` is **compile-time**. `req.body` is still untrusted at runtime.

Validate on the **model** (`Product.validateInput`), return **400** from the **controller** when invalid.

Rules practiced: non-empty trimmed strings for `title` / `description` / `imageUrl`; `price` number ≥ 0; `isPublished` boolean.

### IDs

`products.length + 1` breaks after deletes/gaps.

Safer for a file store: `max(id) + 1` (or a counter). Use that **before** you add delete/update.

---

## Side notes

- `readFileSync` / `writeFileSync` block the event loop. Fine for a learning JSON store. Real APIs: `fs.promises` (async).
- Default-export the class (`export default Product`) so `new Product` / `Product.fetchProducts()` read naturally.
- Dead imports (controller importing unused file helpers) hide who owns I/O. Controllers should not touch file utils.
- `CHANGELOG.md` = public API/behavior. `LEARNING.md` = short “I practiced X on this date.” This file = mindset for the next project.
- Skip changelog for internal refactors with no API change; still log the concept here if it is reusable.

---

## Drafts

Ideas not implemented, or “next when ready”:

- [ ] Shared 404/400 response helpers (optional; DRY JSON shape)
- [ ] Async file I/O (`fs.promises`)
- [ ] `PUT` / `PATCH` / `DELETE` after validation + stable ids
- [ ] Service layer only when a use case spans multiple models/steps
- [ ] Align create route with REST (`POST /admin/products`) if you want textbook REST
- [ ] README layout must stay in sync when folders/files change (easy to forget)

---

## Quick enhance checklist (learning order)

1. Validate create body → 400
2. Safer ids (`max(id) + 1`)
3. Keep docs (README diagram) matching layers
4. Update / delete endpoints
5. Async I/O
6. Service only if workflows appear

---

## This repo (snapshot)

Useful only as an example of the rules above — not a second source of truth.

```
app.ts
routes/admin.route.ts
routes/shop.route.ts
controllers/products.controller.ts
models/product.model.ts
types/product.types.ts
utils/product.utils.ts
data/products.json
```

Shop: `Product.fetchPublished` / `fetchPublishedById`  
Admin: `Product.fetchProducts` / `fetchProductById` + `addProduct` with validation
