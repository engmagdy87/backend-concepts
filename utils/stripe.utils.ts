import Stripe from "stripe";
import { requireEnv } from "./env.utils";

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");

// Learning project: only Stripe's test mode (fake cards, no real money).
// A live key (sk_live_...) would charge real cards, so refuse to start with one.
if (!STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  throw new Error("STRIPE_SECRET_KEY must be a test key (sk_test_...)");
}

/** The one Stripe client the app uses. Only the server ever sees the secret key. */
export const stripe = new Stripe(STRIPE_SECRET_KEY);

/** Where this API runs. Stripe sends the browser back here after paying. */
export const APP_URL = requireEnv("APP_URL");

/** All prices are in this currency. Stripe wants amounts in cents: 19.99 → 1999. */
export const CURRENCY = "usd";
