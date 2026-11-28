import { AppDataSource } from "../utils/database.utils";
import { stripe, APP_URL, CURRENCY } from "../utils/stripe.utils";
import { emitOrderPaid } from "../utils/socket.utils";
import Order from "../models/order.model";
import Cart from "../models/cart.model";
import CartItem from "../models/cart-item.model";
import { getCartService } from "./cart.service";

function orderRepository() {
  return AppDataSource.getRepository(Order);
}

/** 19.99 → 1999. Stripe counts money in cents (whole numbers). */
const toCents = (price: number) => Math.round(price * 100);

export type StartCheckoutResult =
  | { ok: true; orderId: number; url: string }
  | { ok: false; reason: "empty_cart" };

/**
 * Turns the user's cart into a `pending` order and asks Stripe for a payment page.
 * Prices come from our database, never from the request.
 */
export const startCheckoutService = async (
  userId: number,
): Promise<StartCheckoutResult> => {
  const cartItems = await getCartService(userId);
  if (cartItems.length === 0) {
    return { ok: false, reason: "empty_cart" };
  }

  // Add up in cents, so 0.1 + 0.2 doesn't become 0.30000000000000004.
  const totalCents = cartItems.reduce(
    (sum, item) => sum + toCents(item.product.price) * item.quantity,
    0,
  );

  // 1. Save the order with its lines in one `save` (cascade, all or nothing).
  //    Each line copies the product's title and price as they are right now.
  const order = await orderRepository().save(
    orderRepository().create({
      userId,
      status: "pending",
      total: totalCents / 100,
      items: cartItems.map((item) => ({
        productId: item.productId,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
      })),
    }),
  );

  // 2. Ask Stripe for a hosted payment page for exactly these lines.
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: cartItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: CURRENCY,
          unit_amount: toCents(item.product.price),
          product_data: { name: item.product.title },
        },
      })),
      // Stripe swaps {CHECKOUT_SESSION_ID} for the real id when it redirects.
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/checkout/cancel`,
      metadata: { orderId: String(order.id) }, // so a Stripe session points back to our order
    });
  } catch (err) {
    // Stripe said no (or is down): don't leave an order nobody can pay.
    // Deleting the order also deletes its lines (ON DELETE CASCADE).
    await orderRepository().delete(order.id);
    throw err; // → 500 from the error handler
  }

  // 3. Remember which Stripe payment belongs to this order (used in step 4).
  await orderRepository().update(order.id, {
    stripeSessionId: session.id,
  });

  return { ok: true, orderId: order.id, url: session.url! };
};

export type ConfirmPaymentResult =
  | { ok: true; orderId: number }
  | { ok: false; reason: "not_found" | "not_paid" };

/**
 * Stripe sent the browser back to /checkout/success?session_id=...
 * We never trust that URL alone: we ask Stripe whether this session is paid.
 * Safe to call twice (refresh): an order already `paid` is left as it is.
 */
export const confirmPaymentService = async (
  sessionId: string,
): Promise<ConfirmPaymentResult> => {
  // Our order first: an id we never created is a 404, without calling Stripe.
  const order = await orderRepository().findOneBy({ stripeSessionId: sessionId });
  if (!order) {
    return { ok: false, reason: "not_found" };
  }
  if (order.status === "paid") {
    return { ok: true, orderId: order.id }; // already done (e.g. page refreshed)
  }

  // Ask Stripe, the only one who really knows whether the card was charged.
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return { ok: false, reason: "not_paid" };
  }

  // Mark the order paid AND empty the cart: two different tables, so this time
  // we write the transaction ourselves (both happen, or neither).
  // Returns true only for the request that really changed the order.
  const changed = await AppDataSource.transaction(async (db) => {
    // "only if still pending": if two requests arrive at the same moment,
    // only the first one changes a row (affected = 1); the other does nothing.
    const result = await db.update(
      Order,
      { id: order.id, status: "pending" },
      { status: "paid" },
    );
    if (result.affected !== 1) {
      return false;
    }

    const cart = await db.findOneBy(Cart, { userId: order.userId });
    if (cart) {
      await db.delete(CartItem, { cartId: cart.id });
    }
    return true;
  });

  // After the transaction is saved (never inside it: if it rolled back, the
  // message would be a lie). Only once: a refresh or a second request that
  // found the order already paid sends nothing.
  if (changed) {
    emitOrderPaid(order.userId, { orderId: order.id, total: order.total });
  }

  return { ok: true, orderId: order.id };
};
