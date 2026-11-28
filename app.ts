import "dotenv/config";
import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import AppDataSource from "./utils/database.utils";
import { allowedOrigins } from "./utils/cors.utils";
import { initSocket } from "./utils/socket.utils";

import adminRoutes from "./routes/admin.route";
import shopRoutes from "./routes/shop.route";
import cartRoutes from "./routes/cart.route";
import authRoutes from "./routes/auth.route";
import checkoutRoutes from "./routes/checkout.route";
import ordersRoutes from "./routes/orders.route";
import { requireAdmin, requireAuth } from "./middlewares/auth.middleware";
import { PRODUCT_IMAGES_DIR } from "./services/storage.service";

const app = express();

app.disable("x-powered-by"); // don't tell clients which framework we run

// CORS: which websites may call this API from a browser (list in .env CORS_ORIGIN).
app.use(cors({ origin: allowedOrigins }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Public product images: GET /images/<file> sends uploads/products/<file>
// (streamed, with Content-Type and caching headers). A missing file falls
// through to the 404 below.
app.use("/images", express.static(PRODUCT_IMAGES_DIR));

app.use("/admin", requireAuth, requireAdmin, adminRoutes);
app.use("/shop", shopRoutes);
// Cart is for logged-in users only. No token or a bad one → 401 (sign up / log in).
app.use("/cart", requireAuth, cartRoutes);
app.use("/auth", authRoutes);
// Payments (Stripe). Each route sets its own login rule.
app.use("/checkout", checkoutRoutes);
// Your own orders: logged-in users only.
app.use("/orders", requireAuth, ordersRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: "API not found",
  });
});

// Errors can carry an HTTP status (e.g. body-parser: 400 bad JSON, 413 body
// too large). 4xx = the client's mistake: send that status. Anything else is
// our bug: log it and send 500 without details.
app.use(
  (
    err: Error & { status?: number; expose?: boolean },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const status =
      err.status && err.status >= 400 && err.status < 500 ? err.status : 500;

    if (status === 500) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }

    res
      .status(status)
      .json({ message: err.expose ? err.message : "Bad request" });
  },
);

async function start() {
  await AppDataSource.initialize();
  // app.listen returns Node's HTTP server; Socket.IO attaches to it (same port).
  const httpServer = app.listen(3040);
  initSocket(httpServer);
  console.log("Server is running on port 3040 (HTTP + Socket.IO)");
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
