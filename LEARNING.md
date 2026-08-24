# Learning log

Notes on backend concepts practiced in this repo. Newest entries first.

Update this file when a feature teaches a concept worth keeping. Skip chores, formatting-only changes, and WIP commits.

## 2026-08-24 — Product id rules

- Ids are positive integers; next id is `max(existing id) + 1` (safe after deletes).
- One parser (`Product.parseId`) accepts a number or numeric string for URL params and body `id`.
- Records always store `id` first; file writes use pretty-printed JSON.

## 2026-08-24 — Update and delete

- Distinguished create (`save`) from update/delete: mutate the in-memory array by index, then write the JSON file.
- Kept verb-style admin routes (`POST /update-product`, `POST /delete-product`) with `id` in the body; REST would use `PUT`/`PATCH`/`DELETE` on `/products/:id`.
- Switched new ids to `max(id) + 1` so deleting a product cannot make the next create reuse an existing id.

## 2026-08-24 — Layered product modules

- Split types, model, utils, and controller so HTTP stays thin and product rules live on the model.
- Kept one in-memory product list as the source of truth; utils only load/save the JSON file.
- Moved shop filtering onto `Product.fetchPublished` / `fetchPublishedById` instead of re-reading the file in utils.

## 2026-08-24 — Express product API on JSON files

- Split HTTP routes by role: `admin` (full catalog + create) vs `shop` (published catalog only).
- Kept request handling in a controller, with a `Product` class for save/fetch and JSON file I/O.
- Loaded products into memory on startup and wrote the array back on create (`fs.writeFileSync`).
- Filtered the shop catalog with `isPublished` so unpublished admin products stay off the storefront.
- Ran TypeScript directly with `tsx` and `nodemon` instead of compiling on every save.
