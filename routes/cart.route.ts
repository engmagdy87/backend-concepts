import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartQuote,
} from "../controllers/cart.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { cartItemSchema } from "../schemas/cart.schema";

const router = express.Router();

// `requireAuth` is mounted in app.ts, so every route here has `req.user`.
router.get("/", getCart);
// Your own cart as a PDF download (the cart comes from req.user, never from the URL).
router.get("/quote", getCartQuote);
// Shape check (400) before the controller; "does the product exist?" stays in the service (404).
router.post("/items", validateBody(cartItemSchema), addToCart);
router.delete("/items", validateBody(cartItemSchema), removeFromCart);
router.delete("/", clearCart);

export default router;
