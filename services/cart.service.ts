import Cart from "../models/cart.model";
import Product from "../models/product.model";
import type { AddToCartResult, CartItem } from "../types/cart.types";
import { isPositiveInteger } from "../utils/number.utils";

export const addToCartService = (
  productId: unknown,
  quantity: unknown,
): AddToCartResult => {
  const parsedProductId = Product.parseId(productId);

  if (parsedProductId === null) {
    return { ok: false, reason: "not_found" };
  }

  if (!isPositiveInteger(quantity)) {
    return { ok: false, reason: "invalid_quantity" };
  }

  const product = Product.fetchPublishedById(parsedProductId);
  if (!product) {
    return { ok: false, reason: "not_found" };
  }

  Cart.addToCart(parsedProductId, quantity);
  return { ok: true, cart: Cart.getCart() };
};

export const getCartService = (): CartItem[] => {
  return Cart.getCart();
};

export const removeFromCartService = (
  productId: unknown,
): CartItem[] | null => {
  const parsedProductId = Product.parseId(productId);
  if (parsedProductId === null) {
    return null;
  }

  Cart.removeFromCart(parsedProductId);
  return Cart.getCart();
};

export const clearCartService = (): CartItem[] => {
  Cart.clearCart();
  return Cart.getCart();
};
