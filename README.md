# backend-concepts

Express and TypeScript backend learning project. Products are stored in a JSON file and served through admin (full catalog) and shop (published only) routes.

- [Changelog](CHANGELOG.md) — shipped API and product changes
- [Learning log](LEARNING.md) — backend concepts practiced here
- [Backend reference](BACKEND-REFERENCE.md) — durable mentor notes (naming, layers, drafts) for later projects
- [Postman collection](postman/backend-concepts.postman_collection.json) — import into Postman (`baseUrl` = `http://localhost:3040`). When the API changes, update this file and sync it to Postman (MCP).

## Setup

Requires [Yarn 4](https://yarnpkg.com/) (this repo uses Yarn 4.12).

```bash
yarn install
yarn start
```

The server listens on [http://localhost:3040](http://localhost:3040).

| Script | What it does |
| --- | --- |
| `yarn start` | Run `app.ts` with `tsx` and reload on `.ts` / `.json` changes |
| `yarn build` | Compile TypeScript to `dist/` |

## API

JSON request bodies are accepted. Unknown routes return `404` with `{ "message": "API not found" }`.

### Admin

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/admin/add-product` | Create a product |
| `POST` | `/admin/update-product` | Replace an existing product (body includes `id`) |
| `POST` | `/admin/delete-product` | Delete a product (body includes `id`) |
| `GET` | `/admin/products` | List all products |
| `GET` | `/admin/products/:id` | Get a product by id |

Create body:

```json
{
  "title": "A book",
  "price": 19.99,
  "description": "A useful book",
  "imageUrl": "https://example.com/book.png",
  "isPublished": true
}
```

The server assigns a positive integer `id` (`max(existing id) + 1`). Update/delete accept `id` as a number or numeric string.

Update body (same fields plus `id`):

```json
{
  "id": 1,
  "title": "A book",
  "price": 24.99,
  "description": "A useful book",
  "imageUrl": "https://example.com/book.png",
  "isPublished": true
}
```

Delete body:

```json
{
  "id": 1
}
```

### Shop

Shop routes return only products with `isPublished: true`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/shop/products` | List published products |
| `GET` | `/shop/products/:id` | Get a published product by id |

### Cart

Cart only accepts **published** products. Adding the same `productId` again increases quantity.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/cart` | Get cart lines |
| `POST` | `/cart/items` | Add item (`productId`, `quantity`) |
| `DELETE` | `/cart/items` | Remove item by `productId` in body |
| `DELETE` | `/cart` | Clear cart |

Add body:

```json
{
  "productId": 2,
  "quantity": 1
}
```

## Layout

```
app.ts                      # Express app, middleware, 404 handler
routes/admin.route.ts       # Admin product routes
routes/shop.route.ts        # Shop product routes
routes/cart.route.ts        # Cart routes
controllers/                # HTTP handlers (status codes + JSON)
services/                   # Use-case glue (cart ↔ product)
models/                     # Product / Cart domain + persistence
types/                      # Shared input / record types
utils/                      # JSON file helpers
data/products.json          # File-backed product store
data/cart.json              # File-backed cart store
```

```mermaid
flowchart LR
  Client["HTTP client"] --> App["app.ts\nExpress :3040"]
  App --> Admin["routes/admin.route.ts"]
  App --> Shop["routes/shop.route.ts"]
  App --> CartRt["routes/cart.route.ts"]
  App --> NotFound["404 JSON"]
  Admin --> ProdCtrl["products.controller.ts"]
  Shop --> ProdCtrl
  CartRt --> CartCtrl["cart.controller.ts"]
  ProdCtrl --> ProdModel["product.model.ts"]
  CartCtrl --> CartSvc["cart.service.ts"]
  CartSvc --> ProdModel
  CartSvc --> CartModel["cart.model.ts"]
```

A request hits `app.ts`, which parses the body and mounts `/admin`, `/shop`, or `/cart`. Product admin/shop handlers use the product controller and model. Cart handlers use a service that checks published products, then updates the cart file.

