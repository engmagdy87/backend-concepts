import Cart from "../models/cart.model";
import CartItem from "../models/cart-item.model";
import Product from "../models/product.model";
import type { AddToCartResult } from "../types/cart.types";
import { parseId } from "../utils/number.utils";

// `userId` always comes from the verified token (req.user), never from the body.

export const addToCartService = async (
  userId: number,
  productId: unknown,
): Promise<AddToCartResult> => {
  const parsedProductId = parseId(productId);

  if (parsedProductId === null) {
    return { ok: false, reason: "not_found" };
  }

  const product = await Product.fetchPublishedById(parsedProductId);
  if (!product) {
    return { ok: false, reason: "not_found" };
  }

  const cart = await Cart.getOrCreate(userId);
  await CartItem.addToCart(cart.id, parsedProductId);
  return { ok: true, cart: await CartItem.listForCart(cart.id) };
};

export const getCartService = async (userId: number): Promise<CartItem[]> => {
  const cart = await Cart.getOrCreate(userId, { withItems: true });
  return cart.items ?? [];
};

export const removeFromCartService = async (
  userId: number,
  productId: unknown,
): Promise<CartItem[] | undefined> => {
  const parsedProductId = parseId(productId);
  if (parsedProductId === null) {
    return undefined;
  }

  const cart = await Cart.getOrCreate(userId);
  await CartItem.removeFromCart(cart.id, parsedProductId);
  return CartItem.listForCart(cart.id);
};

export const clearCartService = async (userId: number): Promise<CartItem[]> => {
  const cart = await Cart.getOrCreate(userId);
  await CartItem.clearForCart(cart.id);
  return CartItem.listForCart(cart.id);
};
