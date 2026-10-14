import "dotenv/config";
import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import AppDataSource from "./utils/database.utils";

import adminRoutes from "./routes/admin.route";
import shopRoutes from "./routes/shop.route";
import cartRoutes from "./routes/cart.route";
import authRoutes from "./routes/auth.route";
import { requireAdmin, requireAuth } from "./middlewares/auth.middleware";

const app = express();

app.disable("x-powered-by"); // don't tell clients which framework we run

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/admin", requireAuth, requireAdmin, adminRoutes);
app.use("/shop", shopRoutes);
app.use("/cart", cartRoutes);
app.use("/auth", authRoutes);

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

    res.status(status).json({ message: err.expose ? err.message : "Bad request" });
  },
);

async function start() {
  await AppDataSource.initialize();
  app.listen(3040);
  console.log("Server is running on port 3040");
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
