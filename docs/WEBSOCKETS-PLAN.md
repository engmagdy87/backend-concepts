# WebSockets plan

Practise the course module on WebSockets inside this API. Every route stays plain HTTP; a socket is added only where the **server** has news to push. Implement in order, one step at a time.

## Suggested way (this repo)

| Piece | Choice |
| --- | --- |
| Library | **Socket.IO** (`socket.io`, like the course): auto-reconnect, named events, rooms |
| Where | The **same server and port** (3040). Socket.IO attaches to the HTTP server Express already runs on |
| Event 1 | `products:changed`: an admin added, replaced, deleted a product or uploaded its image → **everyone** connected |
| Event 2 | `order:paid`: the Stripe success route marked an order paid → **only that user** |
| Login | Optional. Guests connect for `products:changed`; with a valid JWT the socket also joins the user's private room |
| Testing | Postman → **New → Socket.IO** request (listen to events), plus the normal HTTP requests that trigger them |

## Decisions

- **HTTP for asking, socket for news.** The client still loads data with `GET /shop/products`. The socket only says "something changed".
- **Small messages, no product data.** `products:changed` sends `{ action: "created" | "updated" | "deleted", productId }`, not the product. A product may be unpublished, and guests must never see it. The client refetches the list over HTTP (which already hides unpublished ones).
- **Same CORS list.** The socket uses `CORS_ORIGIN` from `.env` (your FE on `http://localhost:3000`), like the HTTP routes.
- **Same JWT.** A browser can't add an `Authorization` header to a socket, so Socket.IO sends the token in its handshake `auth` field: `io(url, { auth: { token } })`. The server also accepts the `Authorization: Bearer` header (Postman can send headers). No token → guest. Bad or expired token → the connection is refused (`connect_error`), like a 401.
- **Rooms for private messages.** A logged-in socket joins the room `user:<id>`. `order:paid` goes to that room only, so other users never see it. One user with two tabs gets it in both.
- **Emit after the database change succeeded**, never before: the message must be true when it arrives.
- **Why not SSE?** Both events only go server → client, so SSE would work too. We follow the course (Socket.IO); SSE stays in "Later".

## Course lectures → this repo

| Module topic | Step |
| --- | --- |
| HTTP request / response, where it falls short (polling) | — (read; already the whole API) |
| WebSockets: HTTP handshake that upgrades, server can push | 1 |
| Using both protocols in one app | 2, 4 (HTTP routes trigger socket events) |
| Integrating WebSockets in the project (next lectures) | 1–4 (map again when the lecture list is pasted) |

---

## Plan (do in order)

### 1. Socket.IO on the same server

- [x] Branch `feat/websockets`; `yarn add socket.io` (4.8.4)
- [x] `utils/socket.utils.ts`: `initSocket(httpServer)` creates the `Server` with `cors: { origin: allowedOrigins }`; `getIO()` returns it (throws if not started yet)
- [x] `app.ts`: the CORS list moves to `utils/cors.utils.ts` (shared); `start()` keeps the server that `app.listen(3040)` returns and passes it to `initSocket`
- [x] Log `connected <socket id>` / `disconnected` on the server
- [x] Test: Postman Socket.IO request to `http://localhost:3040` → connected; close → server logs disconnect. Tested 2026-11-28 by the user; a `socket.io-client` script reconnected by itself after a server restart (new socket id), Postman doesn't

### 2. `products:changed` to everyone

- [x] After a successful add / replace / delete / image upload, the product controller calls `emitProductsChanged(action, productId)` (`utils/socket.utils.ts`, which does `getIO().emit(...)`). An image upload counts as `updated`
- [x] Failed requests (400, 404) emit nothing. Tested 2026-11-28 with a socket.io-client listener and a temporary admin: create / update / image / delete → 4 events; bad body 400, missing 404, delete again 404 → none
- [x] Test: Postman Socket.IO request listening to `products:changed`; in another tab `POST /admin/products` → the event arrives. Tested 2026-11-28 by the user (product 78, `created`)

### 3. Login on the socket (optional token)

- [x] `io.use(...)` middleware: token from `socket.handshake.auth.token` or the `Authorization` header → `verifyToken` (the same one `requireAuth` uses)
- [x] Valid → `socket.data.user = payload`, `socket.join("user:<id>")`. No token → guest. Bad token → `next(new Error("Invalid or expired token"))`
- [x] Test: no token connects; a real token connects (server logs the user id); a broken token is refused. Tested 2026-11-28 with socket.io-client: guest, `auth.token`, `auth.token` with "Bearer ", `Authorization` header → connected; broken token → `connect_error "Invalid or expired token"`

### 4. `order:paid` to that user only

- [x] When `confirmPaymentService` really changes the order to `paid` (affected = 1), emit `order:paid` `{ orderId, total }` to `user:<userId>`. A refresh of the success page (already paid) emits nothing. Emitted **after** the transaction (`emitOrderPaid` in `utils/socket.utils.ts`, `io.to("user:<id>")`)
- [x] Test: user A's socket (with token) and a guest socket; A pays with `4242…` → only A gets `order:paid`. Tested 2026-11-28 by the user in Postman (tabs "Me" with `Authorization: Bearer`, "Guest" without): Me got `order:paid`, Guest nothing

### 5. Finish

- [x] README (Real-time section: URL, events, payloads, token), CHANGELOG, LEARNING (2026-11-28)
- [x] Postman: the Socket.IO requests live in the user's Postman app, in a separate collection ("backend-concepts sockets"), because the exported collection file is HTTP only and our sync replaces the cloud copy. Setup steps are in the README. No HTTP request changed, so no cloud sync was needed
- [x] Commit, release `chapter-websockets`

---

## Later

- **SSE** (`text/event-stream` + `EventSource`) for one-way news without a library.
- Two-way features: chat, "typing…", read receipts.
- More than one server: the Redis adapter, so an event from server A reaches sockets on server B.
- Token expiry while connected (today a socket stays logged in until it reconnects).
- Rate limits on socket connections and events.
