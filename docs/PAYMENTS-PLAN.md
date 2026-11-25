# Payments plan

Practise the course module "Adding Payments" (section 23) inside this API. Implement in order, one step at a time.

## Suggested way (this repo)

| Piece | Choice |
| --- | --- |
| Provider | **Stripe in test mode.** Test keys only, fake cards (`4242 4242 4242 4242`), no real money. |
| Card data | Never touches our server. Stripe's hosted Checkout page collects it. |
| Orders | New tables `orders` + `order_items`. An order copies each item's title and price, so later product edits never change an old order. |
| Start checkout | `POST /checkout` (logged in): makes a **pending** order from the cart, creates a Stripe Checkout Session, answers `{ url }`. The client opens that URL. |
| Payment done | Stripe sends the browser to `GET /checkout/success?session_id=...`. The server **asks Stripe** whether that session is paid. If yes: order → `paid`, cart cleared. |
| Cancel | `GET /checkout/cancel`: nothing changes; the order stays `pending`. |
| My orders | `GET /orders` (logged in): your own orders with their items. |
| Skip for now | Webhooks, refunds, tax, shipping, stock, the invoice PDF (reuses the quote PDF code). |

## Decisions

- **Prices come from our database, never from the client.** The checkout body is empty: the server reads the cart, so nobody can send `"price": 0.01`.
- **The success page doesn't trust its URL.** In the course, opening `/checkout/success` creates the order. Anyone could open that URL without paying. Here the server asks Stripe "is session X paid?" and only then marks the order paid.
- **Safe to open twice.** `orders.stripeSessionId` is `UNIQUE`, and an order already `paid` is left alone. Refreshing the success page doesn't make a second order or clear the cart again.
- **The success route needs no login.** It's a browser redirect from Stripe, so it can't carry our `Authorization: Bearer` header. It doesn't need one: it trusts Stripe's answer, and the session id is long and random.
- **The pending order is made at checkout, not at success.** It freezes what the user agreed to pay. If the cart changes while they're on Stripe's page, the order still matches what they paid for.
- **Money in Stripe is in cents.** `19.99` → `unit_amount: 1999` (`Math.round(price * 100)`). Currency: `usd` (one constant, easy to change).
- **Redirect with `session.url`.** The course loads Stripe.js and calls `redirectToCheckout`. Stripe now recommends just sending the user to the session's `url`, which fits a JSON API: we return it, the client opens it.

## Course lectures → this repo

| Lecture | Step |
| --- | --- |
| 354–355 how payments work | — (read) |
| 356 checkout page (cart + total) | 3 (the API side: `POST /checkout` reads the cart and total) |
| 357 Stripe Checkout Session | 3 |
| 357 success route: create the order, clear the cart | 4 |
| 357 Stripe.js redirect | 3 (`{ url }` instead) |

---

## Plan (do in order)

### 1. Stripe test account + package

- [x] **You:** create a free Stripe account, stay in **test mode**, copy the **secret test key** (`sk_test_...`) into `.env` as `STRIPE_SECRET_KEY`. I never need to see it.
- [x] `yarn add stripe` (23.2.0); `.env.example` gets `STRIPE_SECRET_KEY=` and `APP_URL=http://localhost:3040` (used to build the success / cancel URLs). Client + checks in `utils/stripe.utils.ts`; `requireEnv` moved to `utils/env.utils.ts`
- [x] The server refuses to start if `STRIPE_SECRET_KEY` is missing or isn't a test key (`sk_test_`), so a live key can't be used by accident

### 2. Orders tables (manual SQL, the user runs it)

```sql
CREATE TABLE orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId INT UNSIGNED NOT NULL,
  status ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  stripeSessionId VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_orders_stripe_session UNIQUE (stripeSessionId),
  CONSTRAINT fk_orders_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  orderId INT UNSIGNED NOT NULL,
  productId INT UNSIGNED NULL, -- NULL if the product is deleted later; title/price stay
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
);
```

- [x] SQL run (2026-11-26)
- [x] Entities `Order` and `OrderItem` (`models/order.model.ts`, `models/order-item.model.ts`). DECIMAL → number via `decimalToNumber` in `utils/database.utils.ts`

### 3. Start checkout (lectures 356–357)

- [x] `POST /checkout` (login-only, like `/cart`). Empty cart → **400** "Cart is empty"
- [x] Save a `pending` order + its items (title, price, quantity copied from the cart)
- [x] `stripe.checkout.sessions.create`: `mode: "payment"`, one line item per cart line (name, cents, quantity), `success_url: APP_URL + "/checkout/success?session_id={CHECKOUT_SESSION_ID}"`, `cancel_url: APP_URL + "/checkout/cancel"`, `metadata: { orderId }`
- [x] Save `session.id` on the order → **201** `{ data: { orderId, url } }`
- [ ] Open the `url`, pay with `4242 4242 4242 4242` (any future date, any CVC)

### 4. Payment done (lecture 357)

- [x] `GET /checkout/success?session_id=...` (public): `stripe.checkout.sessions.retrieve(id)`; `payment_status === "paid"` → order `paid`, that user's cart cleared → JSON `{ message: "Payment received", data: { orderId } }`
- [x] Not paid → **402** (Payment Required); unknown session → **404**; already paid → same success answer, nothing changes
- [x] `GET /checkout/cancel` → `{ message: "Payment cancelled" }`

Steps 3–4 tested 2026-11-26: curl (401, empty cart 400, success 400/404/402, cancel) with a throwaway user; the user paid in the browser with `4242…`: order 5 `paid`, 184.77, 3 lines, cart emptied.

### 5. My orders

- [x] `GET /orders` (login-only): your own orders, newest first, with items. `stripeSessionId` is `select: false` (never in answers). Tested 2026-11-26

### 6. Finish

- [x] Postman: Checkout folder ("Start checkout", success, cancel), cloud synced 2026-11-26
- [x] Postman: "My orders" in the Checkout folder, cloud synced 2026-11-26
- [x] README, CHANGELOG, LEARNING (2026-11-26)
- [x] Release `chapter-payments`

---

## Later

- **Webhooks** (`checkout.session.completed`): Stripe calls our server directly, so the order is marked paid even if the user closes the tab before the success page loads. Needs the raw request body for the signature check and a public URL (Stripe CLI `stripe listen` for local testing). This is the production way.
- Stock checks, cancelling old `pending` orders, refunds, tax, shipping address.
- Success empties the **whole** cart, like the course. If the user added items while on Stripe's page, those go too; removing only the ordered quantities is a later fix.
- Products unpublished after they were put in the cart can still be checked out.
- Invoice PDF for a paid order (reuse `services/pdf.service.ts`).
- Live keys only when the app is really deployed.
