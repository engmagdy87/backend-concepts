import type { z } from "zod";
import type { cartItemSchema } from "../schemas/cart.schema";

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
}

/** Add / remove body after validation (one product, one unit). */
export type CartItemBody = z.infer<typeof cartItemSchema>;
export type AddToCartBody = CartItemBody;
export type RemoveFromCartBody = CartItemBody;

export type AddToCartResult =
  | { ok: true; cart: CartItem[] }
  | { ok: false; reason: "not_found" };
