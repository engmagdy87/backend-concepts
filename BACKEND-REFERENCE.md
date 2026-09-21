# Backend reference

Living mentor notes. Newest inbox first. Fold durable rules into the sections below as they settle.

Canonical copy also lives at `~/.cursor/skills/backend-learning-reference/BACKEND-REFERENCE.md` (personal Cursor skill). Keep both in sync.

---

## Inbox

### 2026-09-21 — `getOrCreateGuest` is domain, not a util helper

- It *feels* like a helper (short, reused). It is still **Cart meaning**: “ensure the guest basket row exists.” Keep it on the model (`Cart.getOrCreateGuest`), not `utils/`.
- Utils = no domain (`isPositiveInteger`, path join). Service = orchestrate several models. Find-or-create for one entity stays on that entity.
- Pattern name: find-or-create. Today: `find({ take: 1 })` then `save`. With auth: find by `userId` then create — same idea, different key.

### 2026-09-21 — `Cart` is the basket header (id today is enough)

- `carts` is not “a useless one-column table.” It is the **basket**. `id` is the thing `cart_items.cartId` points at. `items` is a TypeORM relation (loaded on demand), not a MySQL column.
- Today: one guest row via `getOrCreateGuest()`; every add/remove/clear/list scopes to that `cart.id`. Without a header, lines have nothing to group by once you have more than one basket.
- Later columns (with auth): `userId`, maybe `status` / timestamps — still the same header. Do not invent users just to fill the table.

### 2026-09-21 — No quantity → `@ManyToMany` (hidden join table)

- Drop `quantity` (and any other link fields) and Cart ↔ Product is still many-to-many. MySQL still needs a third table; TypeORM maps it as `@ManyToMany` + `@JoinTable` instead of a `CartItem` class.
- With payload on the link (`quantity`, `addedAt`, …) keep the association entity (two `@ManyToOne`s). Same SQL shape; you own the middle table as a model.
- A JOIN is only how SQL loads related rows. You JOIN on 1—* too. Do not add a middle table “to make joins work.”

### 2026-09-21 — `CartItem` exists for M:N, not “for joins”

- The third table is there because Cart ↔ Product is many-to-many (plus `quantity`). `@ManyToOne` twice is how we map that when the link has columns. `@ManyToMany` is the same idea with a hidden join table — skip it while qty lives on the row.
- A **JOIN** is only how SQL loads related rows (`relations: { product: true }`). You JOIN on 1—* too. Do not add `cart_items` “to make joins work.”

### 2026-09-21 — Join table vs association entity (`CartItem`)

- SQL cannot put a many-to-many on two tables alone. Cart ↔ Product needs a third table. `cart_items` is that table (`cartId` + `productId`).
- A **pure junction** is only those two FKs (TypeORM `@ManyToMany` + `@JoinTable`). Use it when the link has no extra facts.
- This repo’s `CartItem` is an **association entity**: same join, plus `quantity` and its own `id`. Two `@ManyToOne`s, not a hidden join table — you need a class to hold qty.
- Read it both ways: Cart 1—* CartItem *—1 Product (line on a receipt), and Cart *—* Product through `cart_items` (which products are in which baskets).

### 2026-09-20 — TypeORM `find`: where, then order, then skip/take, then relations

- Pick the method first: `findOneBy({ id })` for one row by columns; `find({ where })` for a list (and for `take` / `order` / `relations`). `find()` with no options is `SELECT *`.
- Inside `find({ ... })` think SQL: **`where`** (which rows) → **`order`** (sort) → **`skip` / `take`** (OFFSET / LIMIT) → **`relations`** (JOIN). Key order in the object does not matter; that sequence is how you read it.
- Writes stay as already practiced: `save` (insert/update an instance), `update(id, fields)`, `remove(entity)`, `delete(criteria)`.
- `@OneToMany items` is empty until you load it. `getOrCreateGuest` today is only the cart row (`take: 1`). `listForCart` is a second query. Same list from the cart: `find({ take: 1, relations: { items: { product: true } } })` then `cart.items`.

### 2026-09-20 — `synchronize` is “should TypeORM reshape MySQL?”

- `synchronize: true` — on `DataSource.initialize()`, TypeORM creates/alters tables to match the entity classes. Handy on an empty throwaway DB. Dangerous on a real one: it can drop columns, indexes, or data you did not mean to drop.
- `synchronize: false` (this repo) — classes only **map** existing tables. Schema changes are your SQL (`CREATE TABLE carts`, `ALTER … cartId`). That is why pass 1 did not appear just from adding `@Entity`.
- Industry default for anything you care about: **migrations** (dated SQL files you run on purpose). Prisma’s `migrate` is the same idea. Do not turn `synchronize` on to skip the `carts` SQL.

### 2026-09-20 — Pass 1: Cart header + CartItem (applied)

- Tables: `carts` and `cart_items` (`cartId`). Class `Cart` is the basket; `CartItem` is one `{ product, quantity }`. Product has `cartItems`, not `cart`.
- One guest cart via `Cart.getOrCreateGuest()`. `find({ take: 1 })` is SQL `LIMIT 1` (`skip` is `OFFSET`). Column filters go in **`where`**: `find({ where: { id: 1 }, take: 1 })`. `take` / `skip` / `order` / `relations` are find options, not columns. Add/remove/clear use that cart’s id. Clear is `delete({ cartId })`, not `TRUNCATE` (that would wipe every cart).
- Unique is `(cartId, productId)` — one product per cart, not globally. `GET /cart` uses `relations: { product: true }` (TypeORM 1 dropped the string-array form). Users / `carts.userId` still later.

### 2026-09-20 — Cart as an array vs CartItem rows

- In memory / JSON, a cart *is* `[{ product, quantity }, …]`. `data/cart.json` was that. A `CartItem` row is one element of that array, stored in SQL.
- MySQL does not have a first-class “array of objects” column you can join and unique-index easily. Options: JSON file (old), JSON column on `carts` (load/rewrite the whole blob), or a `cart_items` table (one object → one row). Default on SQL: the table.
- Do not hang `quantity` on `Product` or embed the whole product as the source of truth. Quantity is “this cart’s hold on that product.” The catalog stays one `products` row. `GET /cart` can still *look like* the array.

### 2026-09-20 — Cart header + line (so OneToMany reads normally)

- In memory / JSON, a cart *is* `[{ product, quantity }, …]`. `data/cart.json` was that. A `CartItem` row is one element of that array, stored in SQL.
- MySQL does not have a first-class “array of objects” column you can join and unique-index easily. Options: JSON file (old), JSON column on `carts` (load/rewrite the whole blob), or a `cart_items` table (one object → one row). Default on SQL: the table.
- Do not hang `quantity` on `Product` or embed the whole product as the source of truth. Quantity is “this cart’s hold on that product.” The catalog stays one `products` row. `GET /cart` can still *look like* the array.

### 2026-09-20 — Cart header + line (so OneToMany reads normally)

- The “normal” pair is **Cart 1 — * CartItem * — 1 Product**. Cart has many items; each item belongs to one cart and one product. Product does **not** belong to a cart (`cartId` on `products` would mean a catalog row lives in one basket).
- **Line** = one row on the receipt (“2× Book”). Same thing as `CartItem` / `cart_items`. Not a special TypeORM word.
- This repo today collapsed that into one table of lines named `Cart`. That is why the decorators felt backwards. A `carts` table is a new model, not a rename of `cart_items`.
- Keep HTTP as one guest cart (`GET /cart`, `POST /cart/items` `{ productId }`). Until auth, there is one `carts` row. `productId` stays on the cart item (and in the request body); it does not move onto Product.
- Typical picture with login: one **active** cart per user. That is a business rule, not “never more than one cart row.” History of abandoned carts is optional; checkout usually becomes an **order**, not a second living cart. This repo has no `users` table yet.
- Refactor in two passes, `synchronize` still **false**. Pass 1: `CREATE TABLE carts`, `ALTER cart_items ADD cartId`, rename class `Cart` → `CartItem`, real `Cart` with `items`, Product `cartItems` (not `cart`). Guest cart = one row; service find-or-create; add/remove scoped to that cart; drop `Product.cart` / `new Cart()`. Pass 2: `users` + `carts.userId` only with auth. Do not add users just to match the ERD picture.

### 2026-09-20 — How to read a relation (one row, then name it)

- Ignore the shop sentence (“a cart has many products”). `Cart` here is a **line** in `cart_items`, not a basket.
- Ask: for **one row of this table**, how many of the other? One cart line → one product (`product` + `@ManyToOne`). One product → many cart lines (`cartItems` + `@OneToMany`).
- The class that stores `productId` is the many side. `@JoinColumn({ name: "productId" })` goes there. Don’t invent `products.cartId`. Don’t `= new Cart()`.
- `() => Product` is “the other class.” `(product) => product.cartItems` is only “the field on the way back.” Neither one picks Many vs One — the **property type** does (object = one, array = many).
- Decorators are a JOIN. A MySQL foreign key is a separate lock. Use `relations: ["product"]` first; add the DB constraint later if you want orphans rejected.
- The table name `cart_items` is honest (each row is a line). What feels wrong is the **class** `Cart`. You can drop the extra `@Column productId` once `@ManyToOne` + `@JoinColumn` owns it — MySQL still keeps that column. Don’t rename the table to `carts` to match the shop sentence; a `carts` table is a later header (one cart per user). HTTP `{ productId }` on add/remove stays.

### 2026-09-17 — Finish TypeORM with a relation before swapping ORMs

- After two entities on TypeORM (`Product`, `Cart`), the next *concept* is a **relation**, not a second ORM. `Cart.productId` is still a plain `int` — no `@ManyToOne` / `@OneToMany`.
- Prisma is the next *era* (`chapter-prisma`): same HTTP, rewrite `models/` + `DataSource` only. Jump there when CRUD + one relation feels enough — not to “finish” the cart.
- Cart add/get/remove/clear already use `cart_items`. `data/cart.json` is leftover, not a store. Don’t run TypeORM and Prisma on the same tables.

### 2026-08-31 — SemVer versions the public API, not the ORM

- GitHub Releases commonly use `v1.0.0` / `v1.1.0` (SemVer) when others depend on the **HTTP contract**. MAJOR = breaking routes/bodies; MINOR = additive; PATCH = fix.
- This repo’s `chapter-json` / `chapter-typeorm` tags are **curriculum bookmarks**, not product versions. JSON → mysql2 → TypeORM is the same shop with a new store — not `v1.1.0` of the file era.
- `CHANGELOG.md` `[0.1.0]` is Keep a Changelog for the first JSON API. Leave it; do not relabel chapters as 1.0 / 1.1. Switch to `v*` on git when you treat `main` as a stable API others pin to.
- The agent **decides** at commit time: new `chapter-*` tag + GitHub Release only when a persistence/architecture **era** finishes (next: Prisma). Skip follow-up fixes in the same era; say so in the reply if skipped.

### 2026-08-30 — ORM still needs the driver

- TypeORM is not a replacement for `mysql2`. It sits on top of a driver. `type: "mysql"` loads `mysql2` inside TypeORM; you do not `import "mysql2"` in models.
- Keep `mysql2` in `package.json`. TypeORM lists it as an **optional peer** (Postgres would be `pg`, SQLite `better-sqlite3`). Dropping it because the app no longer calls `db.execute` breaks `DataSource.initialize()`.
- Application SQL (`db.execute`) can go once every path uses the repository. The driver package stays until you change database or ORM.

### 2026-08-30 — Same sentinel on both sides of the call

- If the service returns `undefined` for invalid input, the controller must test `undefined` (`=== null` never matches). Pick one sentinel and use it at both ends.
- Import the class as itself (`Product`, not `ProductEntity`) when there is only one class. An alias implies a second type that does not exist.

### 2026-08-30 — TypeORM columns: say the SQL type under `tsx`

- `@Column()` with no `type` needs `emitDecoratorMetadata` + `reflect-metadata` *and* a compiler that emits `design:type`. `tsc` does; **`tsx` (esbuild) does not.**
- This repo starts with `tsx app.ts`. Use `@Column({ type: "varchar" })` (etc.) so TypeORM does not guess. `reflect-metadata` in `app.ts` is still required; it is not enough by itself.
- That crash happens when the **class loads**, before MySQL. An empty database does not let you skip `type`. `synchronize: true` *creates* tables from entity metadata — it still needs those types first. `synchronize: false` here because the tables already exist; don’t let TypeORM reshape them.
- `isPublished!: boolean` is a **TypeScript** type. It is erased at runtime. `@Column()` does not read it unless the compiler emits `design:type` (`tsc`). `!` only means “I will assign this later.” Under `tsx`, `@Column({ type: "boolean" })` is the indicator.
- `logging: true` on `DataSource` prints SQL (`query: SELECT ...`) to the terminal. Fine while learning. Turn off or use `["error"]` when the noise hurts.

### 2026-08-30 — Class singular, table plural

- Class `Product` = one row. Table `products` = the set. `@Entity({ name })` must match the real table, not the class name.
- TypeORM’s **entity** is the class. The decorator’s `name` is the **table**. Don’t say “entity name” for `products` — that’s the table name.
- This repo already has `products` and `cart_items`. Do not rename to `product` for taste.

### 2026-08-30 — Don’t map the entity 1:1

- `getCart` can `return repository.find()`. A `.map` that copies every column except `id` is a fake DTO — the PK is useful on the wire.
- Project (map/pick) only when the API must hide fields. Until then the entity *is* the row.

### 2026-08-30 — TypeORM `clear()` vs `delete`

- `repository.clear()` is built-in. It **TRUNCATE**s the table (empty `cart_items`). Fine for “clear the cart.”
- `repository.delete({})` is **DELETE FROM** (row deletes; autoincrement usually stays). Use when you need a normal DML delete (transactions, FKs).
- Same table outcome, different input: `remove(entity)` needs the loaded row (`remove(cart)` after `findOneBy`). `delete(criteria)` is a query (`delete({ productId })`) — no entity required, no cascades/listeners.
- Pair with `save`/`remove` (work on instances) vs `insert`/`update`/`delete` (work on criteria). `Product.delete` in this repo is *our* wrapper; inside it calls TypeORM `remove`.

### 2026-08-30 — One write path when moving to TypeORM

- After a method uses `repository.update` / `save`, delete the leftover `db.execute` in the same branch. Two writes = two increments (add-to-cart +1 twice).
- One table name for the entity (`@Entity({ name })` must match the real table). Do not query `cart_items` while the entity is mapped to `cart`.
- Register the entity on `DataSource.entities` and map columns (`id`, `productId`, `quantity`) or `findOneBy` / `update` have nothing to map. `Property 'quantity' does not exist on type 'Cart'` is TypeScript saying the same thing: `@Entity` without `@Column` fields is an empty class.

### 2026-08-30 — TypeORM: one class, don’t collide with BaseEntity

- Map the table on the same model (`@Entity` on `Product`). Do not keep a `ProductEntity` plus a mysql2 `Product`.
- `save()` is TypeORM’s insert: it fills `id`. Drop `toProductRecord(insertId, this)`.
- Do not `extends BaseEntity` if you still want `Product.update` / `Product.delete` with your own signatures — TypeORM already owns those static names. Use `getRepository(Product)` instead.

### 2026-08-29 — Architect review: assumptions then lenses

- State constraints and assumptions first (one process, no auth, which store each entity uses). Then only the lenses that apply: ownership, coupling, API, failures, smells, reversible next step.
- YAGNI: do not run an enterprise checklist (microservices, CQRS, service mesh) on a learning monolith. An ADR in this project is a `BACKEND-REFERENCE.md` bullet.

### 2026-08-29 — Architect mentor: options then now

- For a topic: briefly all real options, best practice, why this repo now, when to switch, what is advanced. Do not lock to one library.
- Do not implement unless explicitly asked. Teach as do / don't + why.

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
- SQL tables here are **plural / collective** (`products`, `cart_items`). The class stays singular (`Product`, `Cart`). `@Entity({ name })` is the table name, not a style vote — it must match MySQL.
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

TypeScript `ProductInput` is **compile-time**. `req.body` is still untrusted at runtime. Same for entity fields: `isPublished!: boolean` is gone after compile; TypeORM `@Column()` only sees it if `tsc` emitted decorator metadata. `tsx` does not, so `@Column({ type: "boolean" })` is the runtime type.

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
- [x] Cart on MySQL `cart_items` (TypeORM). `data/cart.json` is leftover file, not a store
- [x] Cart header + CartItem line (`carts` + `cart_items`); relations Cart 1—* CartItem *—1 Product; drop the inverted Product.cart mapping
- [ ] Prisma era when TypeORM CRUD + one relation feels enough (keep routes; swap models + DataSource)
- [x] Drop leftover `data/cart.json` and fix README (still says the cart is a JSON file)

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
models/cart-item.model.ts
types/product.types.ts
utils/database.utils.ts
```

Shop: `Product.fetchPublished` / `fetchPublishedById`  
Admin: `addProduct`, `updateProduct`, `deleteProduct`, `fetchProducts`, `fetchProductById`  
Model: `save`, `update`, `delete`, plus fetch helpers
