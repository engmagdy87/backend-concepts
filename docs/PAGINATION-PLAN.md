# Pagination plan

Practise the course module "Adding Pagination" (section 21) inside this API. Implement in order, one step at a time.

## Suggested way (this repo)

| Piece | Choice |
| --- | --- |
| Where | `GET /shop/products` first, then the same code on `GET /admin/products`. Not the cart (it's always small). |
| Query | `?page=2&limit=3`. Both optional: `page` defaults to 1, `limit` to 10, max 50. |
| Bad query | `page=0`, `page=abc`, `limit=500` → **400**, same error shape as the body validation. |
| SQL | TypeORM `findAndCount({ where, order: { id: "ASC" }, skip, take })`: one call returns the page's rows **and** the total count. |
| Response | `{ data: [...], meta: { totalItems, currentPage, lastPage, hasNextPage, hasPreviousPage, nextPage, previousPage } }` (the course's names). |
| Page after the last one | **200** with `data: []`. An empty page is a normal answer, not an error. |
| Skip for now | Sort (`?sort=price`), filter, search (`?q=`), cursor pagination (infinite scroll). |

## Decisions

- **The API sends numbers, the frontend draws buttons.** The course builds the buttons in an EJS template (lecture 343). We have no views, so the server's job ends at `meta`. A frontend (or Postman) uses `hasNextPage`, `lastPage` and so on to draw first / previous / current / next / last.
- **`limit` is the client's choice, but capped.** The course uses a fixed `ITEMS_PER_PAGE`. Here the client may ask for fewer or more, up to 50, so nobody can ask for a million rows in one request.
- **Always `order` when paginating.** Without `ORDER BY`, MySQL may return rows in a different order each time, so a product could show on page 1 and again on page 2. `id ASC` keeps pages stable.
- **Response shape stays `{ data }`.** `meta` is added next to `data`, so a client that only reads `data` still works.
- **Read the query with a zod schema in the controller**, not a `validateQuery` middleware. Express 5 makes `req.query` read-only, so a middleware can't replace it with the cleaned value like `validateBody` does with `req.body`.

## Course lectures → this repo

| Lecture | Step |
| --- | --- |
| 338 why paginate | — (read) |
| 339 page links, `?page=2` | 1 |
| 340 skip / limit | 2 |
| 341 LIMIT / OFFSET in SQL | 2 (see the SQL in the query log) |
| 342 total count + pagination data | 3 |
| 343 dynamic buttons | 3 (`meta` is what the buttons need) |
| 344 reuse the logic | 4 |

---

## Plan (do in order)

### 1. Read `page` and `limit` from the query (lecture 339)

- [x] `schemas/pagination.schema.ts`: `page` and `limit` with `z.coerce.number().int()` (query values are always strings), `page` ≥ 1, `limit` 1–50, defaults 1 and 10
- [x] Bad query → **400** `{ message: "Invalid query", errors }`

### 2. Fetch one page with skip / take (lectures 340–341)

- [x] `Product.fetchPublished({ page, limit })` → `findAndCount` with `where: { isPublished: true }`, `order: { id: "ASC" }`, `skip: (page - 1) * limit`, `take: limit`
- [ ] Look at the SQL in the `yarn start` log: `LIMIT 3 OFFSET 3` (that's lecture 341)

### 3. Build `meta` (lectures 342–343)

- [x] `lastPage = Math.max(1, Math.ceil(totalItems / limit))`, then `hasNextPage`, `hasPreviousPage`, `nextPage`, `previousPage` (`null` when there is none)
- [x] `GET /shop/products` → `{ data, meta }`

### 4. Reuse on admin products (lecture 344)

- [x] Move the query parsing + `meta` into one helper (`utils/pagination.utils.ts`)
- [x] `GET /admin/products` uses it too (all products, published or not)

Steps 1–4 tested 2026-11-25: shop list with curl (pages, past the end, 400s), admin list by the user in Postman.

### 5. Finish

- [x] Postman: `page` / `limit` in Params on both list requests, plus a "→ 400" example
- [x] README, CHANGELOG, LEARNING
- [x] Postman cloud synced 2026-11-25
- [x] Release: `chapter-pagination` (course module, the user chose to tag it)

---

## Later

- **Sort, filter, search** on the same lists (`?sort=price&order=desc`, `?isPublished=true`, `?q=book`). See `docs/BACKEND-REFERENCE.md` → List APIs.
- **Cursor pagination** (`?after=<lastId>`) for infinite scroll: stays fast on huge tables, and a new row doesn't shift every page.
- An index on the sorted column once the table is big.
