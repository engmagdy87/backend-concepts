import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller";

const router = express.Router();

router.get("/", getCart);
router.post("/items", addToCart);
router.delete("/items", removeFromCart);
router.delete("/", clearCart);

export default router;
