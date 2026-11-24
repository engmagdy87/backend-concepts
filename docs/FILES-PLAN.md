# Files plan

Practise the course module "File Upload & Download" (section 20) inside this API. Implement in order, one step at a time.

## Suggested way (this repo)

| Piece | Choice |
| --- | --- |
| Upload | Product image: `POST /admin/products/:id/image`, multipart, field `image`. multer v2. |
| Storage | Local disk, `uploads/products/` (git-ignored). All file code in one service, so cloud storage can replace it later. |
| Serve | Public: `GET /images/<file>` via `express.static`. |
| Download | Cart quote PDF: `GET /cart/quote`, logged-in user, own cart only. PDFKit, streamed. Not saved to disk. |
| Skip for now | Cloud storage (R2 / S3 / GCS), presigned URLs, image resizing (`sharp`), checking real file content (`file-type`), orders + invoices. |

## Decision: product first, then image (2026-11-24)

The frontend shows **one form with one Save button**. Behind it, it sends two requests:

```js
const product = await api.post("/admin/add-product", { title, price, description, isPublished }); // JSON
if (file) await api.postForm(`/admin/products/${product.id}/image`, { image: file });          // multipart
```

- Why: the zod JSON validation stays as it is, the same image endpoint also handles "change image" on the edit page, and every image file belongs to a product that exists (no orphan files).
- If the image request fails, the product stays without an image (it's optional). The frontend shows "Image upload failed, try again".
- The client never sends a path or URL. The server chooses the file name and writes `imageUrl`.
- Not chosen: one multipart request with all fields + file (the course's way; form-data makes every field a string, so zod would need `z.coerce`), and upload-first-then-create (needs presigned URLs; "later").

## Course lectures → this repo

| Lecture | Step |
| --- | --- |
| 321–323 multipart, multer, filename and path | 3 |
| 324 filter by mimetype | 3 |
| 325 store in the database | 3 |
| 326 remove imageUrl from "Add Product" | 2 |
| 327 serve statically | 4 |
| 328–330 download with auth, headers, restrict access | 6 |
| 331 streaming vs preloading | 6 |
| 332–333 PDFKit with real data | 6 |
| 334 deleting files | 5 |

---

## Plan (do in order)

### 1. Packages + folder

- [x] `yarn add multer pdfkit` and `yarn add -D @types/multer @types/pdfkit` (multer must be **v2**): multer 2.5.0, pdfkit 0.21.0
- [x] Add `uploads/` to `.gitignore` (uploaded files are data, not code)

### 2. `imageUrl` is no longer typed by the client (lecture 326)

- [x] Manual SQL (the user ran it 2026-11-24): a new product has no image until one is uploaded.
  ```sql
  ALTER TABLE products MODIFY imageUrl VARCHAR(255) NULL;
  ```
- [x] Entity: `imageUrl` becomes `string | null` (`nullable: true`)
- [x] Remove `imageUrl` from `productSchema`; add/update product never change it
- [ ] Existing products keep their old external URLs (that's fine)

### 3. Upload endpoint

- [x] `POST /admin/products/:id/image` (admin only, already locked by `/admin`)
- [x] multer disk storage → `uploads/products/<random>.<ext>`
- [x] Only `image/jpeg`, `image/png`, `image/webp`; max 2 MB
- [x] Save `/images/<file>` in `products.imageUrl` → **200** with the product
- [x] Errors: no file / wrong type → **400**, too big → **413**, product not found → **404** (and remove the file that was just saved)

### 4. Serve images

- [x] `app.use("/images", express.static(PRODUCT_IMAGES_DIR))`
- [x] Opening `imageUrl` in the browser shows the image

### 5. Delete old files (lecture 334)

- [x] New image uploaded → delete the old file
- [x] Product deleted → delete its file
- [x] Only delete files we own (path starts with `/images/`), never external URLs. A missing file is not an error.
- [x] Delete the file **after** the database change, and never fail the request over it (a leftover file is only logged)

Steps 2–5 tested by the user in Postman (2026-11-25): no image after create, upload 200 + image opens in the browser, wrong type 400, too big 413, no file 400, unknown id 404 (no leftover file), replace deletes the old file, delete product deletes its file.

### 6. Cart quote PDF

- [x] `GET /cart/quote` (already login-only; the cart comes from `req.user`, so nobody can get another user's cart)
- [x] Empty cart → **400** "Cart is empty"
- [x] Headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="quote.pdf"`
- [x] PDFKit: title, date, one line per item (title, quantity, price, line total), grand total
- [x] Stream it: `doc.pipe(res)` then `doc.end()`, nothing written to disk

Step 6 tested by the user in Postman (2026-11-25): empty cart 400, PDF lines and total correct (184.77), headers `application/pdf` + `attachment; filename="quote.pdf"`, `Transfer-Encoding: chunked` (streamed), no token 401, a second user only sees their own cart.

### 7. Finish

- [x] Postman (local file, 2026-11-24): "Upload product image" (Body → form-data, `image` = File); Add/Update product bodies no longer send `imageUrl`
- [x] Postman (local file): "Download cart quote" (arrow next to Send → Download response)
- [x] Postman cloud synced again 2026-11-25 with "Download cart quote"
- [x] Postman cloud synced 2026-11-25 (cloud matched the committed file before the PUT; read back OK)
- [x] README, CHANGELOG, LEARNING (2026-11-25)
- [ ] Release: probably `chapter-files`

---

## Later

- **Cloud storage:** Cloudflare R2 (S3 API, no egress fees) with presigned upload/download URLs. Only the storage service changes. Do it when the app is deployed or runs on more than one server.
- **Orders + invoice PDF:** checkout turns the cart into an order; the invoice reuses the quote PDF code.
- Image resizing with `sharp`, real file-type checks with `file-type`.
