# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Cart API under `/cart` with service layer (published-product check; add/remove one unit)
- `PATCH /admin/products/:id` to partially update a product (id in the URL)
- `POST /admin/delete-product` to delete a product by `id`

### Fixed
- `GET /admin/products` returns `isPublished` as `true`/`false` (MySQL stores `TINYINT` 0/1)

### Changed
- Replaced `POST /admin/update-product` with `PATCH /admin/products/:id` (partial body; id in the URL)
- `POST /cart/items` adds one unit (`productId` only); stored line quantity is not a request field. `DELETE /cart/items` decrements by one
- Split product handling into `types/`, `models/`, `utils/`, and thin controllers; routes renamed to `*.route.ts`
- Product ids are positive integers: created with `max(id) + 1`, parsed via `Product.parseId` (number or numeric string), written with `id` first in `products.json`
- Renamed admin update API from `edit-product` / `editProduct` to `update-product` / `updateProduct`

## [0.1.0] - 2026-08-24

### Added

- Express 5 + TypeScript app listening on port 3040
- Admin routes to add a product, list all products, and get a product by id
- Shop routes to list and get **published** products only
- JSON file persistence for products (`data/products.json`)
