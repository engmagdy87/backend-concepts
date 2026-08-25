# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Cart API under `/cart` with service layer (published-product check; add/remove one unit)
- `PUT /admin/products/:id` to replace an existing product (id in the URL)
- `POST /admin/delete-product` to delete a product by `id`

### Fixed
- `GET /admin/products` and get-by-id return `isPublished` as `true`/`false` (MySQL stores `TINYINT` 0/1)
- `POST /cart/items` awaits the product lookup (add-to-cart was treating the Promise as a missing product)
- `POST /admin/delete-product` returns `404` when no MySQL row matches

### Changed
- `POST /cart/items` writes MySQL `cart_items`: increment quantity if the product is already in the cart, otherwise insert a row with quantity 1. Remove still uses `data/cart.json`.
- Product persistence is MySQL only (`data/products.json` and `product.utils.ts` removed). Cart remains `data/cart.json`.
- Replaced `POST /admin/update-product` with `PUT /admin/products/:id` (full body; id in the URL)
- `POST /cart/items` adds one unit (`productId` only); stored line quantity is not a request field. `DELETE /cart/items` decrements by one
- Split product handling into `types/`, `models/`, `utils/`, and thin controllers; routes renamed to `*.route.ts`
- Product ids are positive integers (`Product.parseId`); new rows use MySQL `insertId`
- Renamed admin update API from `edit-product` / `editProduct` to `update-product` / `updateProduct`

## [0.1.0] - 2026-08-24

### Added

- Express 5 + TypeScript app listening on port 3040
- Admin routes to add a product, list all products, and get a product by id
- Shop routes to list and get **published** products only
- JSON file persistence for products (`data/products.json`)
