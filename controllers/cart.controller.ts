import { Request, Response } from "express";
import {
  addToCartService,
  clearCartService,
  getCartService,
  removeFromCartService,
} from "../services/cart.service";
import type { AddToCartBody, RemoveFromCartBody } from "../types/cart.types";

export const getCart = async (_req: Request, res: Response) => {
  res.json({ data: await getCartService() });
};

export const addToCart = async (
  req: Request<unknown, unknown, AddToCartBody>,
  res: Response,
) => {
  const result = await addToCartService(req.body.productId);

  if (!result.ok) {
    return res.status(404).json({
      message: "Product not found or not published",
    });
  }

  res.status(201).json({
    message: "Product added to cart",
    data: result.cart,
  });
};

export const removeFromCart = async (
  req: Request<unknown, unknown, RemoveFromCartBody>,
  res: Response,
) => {
  const cart = await removeFromCartService(req.body.productId);

  if (cart === undefined) {
    return res.status(400).json({
      message: "productId must be a positive integer",
    });
  }

  res.json({
    message: "Product removed from cart",
    data: cart,
  });
};

export const clearCart = async (_req: Request, res: Response) => {
  const cart = await clearCartService();
  res.json({
    message: "Cart cleared",
    data: cart,
  });
};
