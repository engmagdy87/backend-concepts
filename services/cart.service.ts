import Cart from "../models/cart.model";
import Product from "../models/product.model";
import type { AddToCartResult, CartItem } from "../types/cart.types";

export const addToCartService = async (
  productId: unknown,
): Promise<AddToCartResult> => {
  const parsedProductId = Product.parseId(productId);

  if (parsedProductId === null) {
    return { ok: false, reason: "not_found" };
  }

  const product = await Product.fetchPublishedById(parsedProductId);
  if (!product) {
    return { ok: false, reason: "not_found" };
  }

  await Cart.addToCart(parsedProductId);
  return { ok: true, cart: await Cart.getCart() };
};

export const getCartService = async (): Promise<CartItem[]> => {
  return await Cart.getCart();
};

export const removeFromCartService = async (
  productId: unknown,
): Promise<CartItem[] | undefined> => {
  const parsedProductId = Product.parseId(productId);
  if (parsedProductId === null) {
    return undefined;
  }

  await Cart.removeFromCart(parsedProductId);
  return await Cart.getCart();
};

export const clearCartService = async (): Promise<CartItem[]> => {
  await Cart.clearCart();
  return Cart.getCart();
};
