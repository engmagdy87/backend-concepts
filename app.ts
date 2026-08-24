import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";

import adminRoutes from "./routes/admin.route";
import shopRoutes from "./routes/shop.route";
import cartRoutes from "./routes/cart.route";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/admin", adminRoutes);
app.use("/shop", shopRoutes);
app.use("/cart", cartRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: "API not found",
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(3040);

console.log("Server is running on port 3040");
