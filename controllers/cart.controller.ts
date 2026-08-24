import { Request, Response } from "express";
import {
  addToCartService,
  clearCartService,
  getCartService,
  removeFromCartService,
} from "../services/cart.service";
import type { AddToCartBody, RemoveFromCartBody } from "../types/cart.types";

export const getCart = (_req: Request, res: Response) => {
  res.json({ data: getCartService() });
};

export const addToCart = (
  req: Request<unknown, unknown, AddToCartBody>,
  res: Response,
) => {
  const result = addToCartService(req.body.productId, req.body.quantity);

  if (!result.ok) {
    if (result.reason === "invalid_quantity") {
      return res.status(400).json({
        message: "quantity must be a positive integer",
      });
    }
    return res.status(404).json({
      message: "Product not found or not published",
    });
  }

  res.status(201).json({
    message: "Product added to cart",
    data: result.cart,
  });
};

export const removeFromCart = (
  req: Request<unknown, unknown, RemoveFromCartBody>,
  res: Response,
) => {
  const cart = removeFromCartService(req.body.productId);

  if (cart === null) {
    return res.status(400).json({
      message: "productId must be a positive integer",
    });
  }

  res.json({
    message: "Product removed from cart",
    data: cart,
  });
};

export const clearCart = (_req: Request, res: Response) => {
  const cart = clearCartService();
  res.json({
    message: "Cart cleared",
    data: cart,
  });
};
