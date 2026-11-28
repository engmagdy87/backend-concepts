# REST plan

Practise the course module "Working with REST APIs - The Basics" (section 24) inside this API. Most of it is already here (JSON only, HTTP methods, stateless JWT, Postman). This chapter fills the two gaps. Implement in order, one step at a time.

## Course lectures → this repo

| Lecture | In this repo |
| --- | --- |
| 360–361 what REST is, data as JSON | ✅ already: every route answers JSON |
| 362 routing & HTTP methods | ✅ mostly; admin paths fixed in step 2 |
| 363 core principles (resources in the URL, stateless) | ✅ stateless (JWT); resource URLs in step 2 |
| 364 route setup | ✅ `routes/` → `controllers/` → `services/` → `models/` |
| 365 requests & responses with Postman | ✅ the Postman collection |
| 366 clients & CORS errors | **step 1** |
| 367 POST requests | ✅ signup, add product, checkout, … |

## Decisions

- **CORS: allow a list, not everyone.** `CORS_ORIGIN` in `.env` lists the frontend addresses allowed to call the API from a browser (comma-separated). Missing → no browser on another address is allowed; Postman and curl still work (they aren't browsers). Not `origin: "*"`: that lets any website call the API from a visitor's browser.
- **No cookies, so no `credentials`.** The token travels in the `Authorization` header, which the client adds itself. CORS only has to allow that header.
- **REST paths: the URL names the thing, the method names the action.** `POST /admin/products` (not `/add-product`). Old paths are removed, not kept as aliases: nothing else uses them yet (Postman and the README are updated in the same change).
- **Invalid id → 400 everywhere.** A valid id with no row → 404 (rest of M11).

---

## Plan (do in order)

### 1. CORS (lecture 366)

- [x] `yarn add cors` (+ `@types/cors`)
- [x] `CORS_ORIGIN=http://localhost:3000` in `.env.example` (the user adds it to `.env` after seeing the error) (comma-separated list)
- [x] `app.use(cors({ origin: allowedOrigins }))` before the routes
- [x] See the error first: a tiny test page (served on another port; removed after the test) calls `GET /shop/products` with `fetch` → blocked by the browser before the change, works after
- [x] Check the preflight: `OPTIONS` with `Authorization` (what the browser sends before a `POST` with a token)

### 2. REST-style admin paths (lectures 362–363, review item M11)

| Before | After |
| --- | --- |
| `POST /admin/add-product` | `POST /admin/products` |
| `DELETE /admin/delete-product/:id` | `DELETE /admin/products/:id` |
| `POST /admin/add-user` | `POST /admin/users` |
| `PUT /admin/update-user/:id` | `PUT /admin/users/:id` |
| `DELETE /admin/delete-user/:id` | `DELETE /admin/users/:id` |

- [x] Routes changed; old paths → 404
- [x] Postman requests (local) and README updated. Tested 2026-11-26 with a temporary admin: create / replace / delete product and user on the new paths, old paths 404

### 3. Invalid id → 400 everywhere (rest of M11)

- [x] `validateIdParam` on every `:id` route (get product / user by id, shop product by id still answer 404 for `abc` today)
- [x] Controllers stop checking `parseId` themselves where the route already does. Tested 2026-11-26: every `:id` route → `abc` 400, `99999` 404, real id 200

### 4. Finish

- [x] `CODE_REVIEW.md`: M11 done, and M5 (pagination) marked done (it was finished in `chapter-pagination`)
- [x] README, CHANGELOG, LEARNING (2026-11-26)
- [x] Postman cloud sync (2026-11-26), commit, release `chapter-rest`

---

## Later

- `PATCH` for partial updates (today `PUT` replaces the whole product / user).
- API versioning (`/v1/...`) once there are real clients that can't change at the same time.
- OpenAPI description of the API.
