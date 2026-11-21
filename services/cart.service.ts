import Cart from "../models/cart.model";
import CartItem from "../models/cart-item.model";
import Product from "../models/product.model";
import type { AddToCartResult } from "../types/cart.types";

// `userId` always comes from the verified token (req.user), never from the body.
// `productId` was already checked by validateBody(cartItemSchema): a positive integer.

export const addToCartService = async (
  userId: number,
  productId: number,
): Promise<AddToCartResult> => {
  // Business rule (needs MySQL): the product must exist and be published.
  const product = await Product.fetchPublishedById(productId);
  if (!product) {
    return { ok: false, reason: "not_found" };
  }

  const cart = await Cart.getOrCreate(userId);
  await CartItem.addToCart(cart.id, productId);
  return { ok: true, cart: await CartItem.listForCart(cart.id) };
};

export const getCartService = async (userId: number): Promise<CartItem[]> => {
  const cart = await Cart.getOrCreate(userId, { withItems: true });
  return cart.items ?? [];
};

export const removeFromCartService = async (
  userId: number,
  productId: number,
): Promise<CartItem[]> => {
  const cart = await Cart.getOrCreate(userId);
  await CartItem.removeFromCart(cart.id, productId);
  return CartItem.listForCart(cart.id);
};

export const clearCartService = async (userId: number): Promise<CartItem[]> => {
  const cart = await Cart.getOrCreate(userId);
  await CartItem.clearForCart(cart.id);
  return CartItem.listForCart(cart.id);
};
