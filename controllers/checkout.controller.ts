import { Request, Response } from "express";
import {
  confirmPaymentService,
  startCheckoutService,
} from "../services/checkout.service";

/** POST /checkout: start paying for your own cart. No body: the server reads the cart. */
export const startCheckout = async (req: Request, res: Response) => {
  const result = await startCheckoutService(req.user!.userId);

  if (!result.ok) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // The client opens `url` (Stripe's payment page). The cart stays as it is
  // until Stripe confirms the payment.
  res.status(201).json({
    message: "Checkout started",
    data: { orderId: result.orderId, url: result.url },
  });
};

/**
 * GET /checkout/success?session_id=cs_test_...
 * Public: Stripe redirects the browser here, and a redirect can't carry our token.
 * It's safe without one, because the answer comes from Stripe, not from the URL.
 */
export const checkoutSuccess = async (req: Request, res: Response) => {
  const sessionId = req.query.session_id;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return res.status(400).json({ message: "session_id is missing or invalid" });
  }

  const result = await confirmPaymentService(sessionId);

  if (!result.ok && result.reason === "not_found") {
    return res.status(404).json({ message: "Order not found" });
  }
  if (!result.ok) {
    // 402 Payment Required: Stripe says this session isn't paid.
    return res.status(402).json({ message: "Payment not completed" });
  }

  res.json({ message: "Payment received", data: { orderId: result.orderId } });
};

/** GET /checkout/cancel: the user left Stripe's page. Nothing changes. */
export const checkoutCancel = (_req: Request, res: Response) => {
  res.json({ message: "Payment cancelled. Your cart is unchanged." });
};
