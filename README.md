# backend-concepts

Express and TypeScript backend learning project. Products are stored in a JSON file and served through admin (full catalog) and shop (published only) routes.

- [Changelog](CHANGELOG.md) — shipped API and product changes
- [Learning log](LEARNING.md) — backend concepts practiced here

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
| `GET` | `/admin/products` | List all products |
| `GET` | `/admin/product/:id` | Get a product by id |

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

### Shop

Shop routes return only products with `isPublished: true`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/shop/products` | List published products |
| `GET` | `/shop/product/:id` | Get a published product by id |

## Layout

```
app.ts                 # Express app, middleware, 404 handler
routes/admin.ts        # Admin product routes
routes/shop.ts         # Shop product routes
controllers/           # Product model + request handlers
data/products.json     # File-backed product store
```
