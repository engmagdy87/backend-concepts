import Cart from "../models/cart.model";
import CartItem from "../models/cart-item.model";
import Product from "../models/product.model";
import type { AddToCartResult } from "../types/cart.types";

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

  const cart = await Cart.getOrCreateGuest();
  await CartItem.addToCart(cart.id, parsedProductId);
  return { ok: true, cart: await CartItem.listForCart(cart.id) };
};

export const getCartService = async (): Promise<CartItem[]> => {
  const cart = await Cart.getOrCreateGuest();
  return CartItem.listForCart(cart.id);
};

export const removeFromCartService = async (
  productId: unknown,
): Promise<CartItem[] | undefined> => {
  const parsedProductId = Product.parseId(productId);
  if (parsedProductId === null) {
    return undefined;
  }

  const cart = await Cart.getOrCreateGuest();
  await CartItem.removeFromCart(cart.id, parsedProductId);
  return CartItem.listForCart(cart.id);
};

export const clearCartService = async (): Promise<CartItem[]> => {
  const cart = await Cart.getOrCreateGuest();
  await CartItem.clearForCart(cart.id);
  return CartItem.listForCart(cart.id);
};
