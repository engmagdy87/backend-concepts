# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Cart API under `/cart` with service layer (published-product check, merge quantities)
- `POST /admin/update-product` to replace an existing product (body includes `id`)
- `POST /admin/delete-product` to delete a product by `id`

### Changed
- Split product handling into `types/`, `models/`, `utils/`, and thin controllers; routes renamed to `*.route.ts`
- Product ids are positive integers: created with `max(id) + 1`, parsed via `Product.parseId` (number or numeric string), written with `id` first in `products.json`
- Renamed admin update API from `edit-product` / `editProduct` to `update-product` / `updateProduct`

## [0.1.0] - 2026-08-24

### Added

- Express 5 + TypeScript app listening on port 3040
- Admin routes to add a product, list all products, and get a product by id
- Shop routes to list and get **published** products only
- JSON file persistence for products (`data/products.json`)
