import express from "express";
import {
  checkoutCancel,
  checkoutSuccess,
  startCheckout,
} from "../controllers/checkout.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = express.Router();

// Logged-in users only: start paying for your own cart.
router.post("/", requireAuth, startCheckout);
// Public: Stripe redirects the browser here, and a redirect can't carry our token.
router.get("/success", checkoutSuccess);
router.get("/cancel", checkoutCancel);

export default router;
