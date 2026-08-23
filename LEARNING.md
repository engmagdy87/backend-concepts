# Learning log

Notes on backend concepts practiced in this repo. Newest entries first.

Update this file when a feature teaches a concept worth keeping. Skip chores, formatting-only changes, and WIP commits.

## 2026-08-24 — Express product API on JSON files

- Split HTTP routes by role: `admin` (full catalog + create) vs `shop` (published catalog only).
- Kept request handling in a controller, with a `Product` class for save/fetch and JSON file I/O.
- Loaded products into memory on startup and wrote the array back on create (`fs.writeFileSync`).
- Filtered the shop catalog with `isPublished` so unpublished admin products stay off the storefront.
- Ran TypeScript directly with `tsx` and `nodemon` instead of compiling on every save.
