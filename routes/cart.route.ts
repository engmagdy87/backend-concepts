import express from "express";
import cookieParser from "cookie-parser";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller";
import { optionalAuth } from "../middlewares/auth.middleware";
import { resolveCartOwner } from "../middlewares/cart-owner.middleware";

const router = express.Router();

// Every cart route is scoped to one owner: Bearer user, else guest cookie.
router.use(cookieParser(), optionalAuth, resolveCartOwner);

router.get("/", getCart);
router.post("/items", addToCart);
router.delete("/items", removeFromCart);
router.delete("/", clearCart);

export default router;
