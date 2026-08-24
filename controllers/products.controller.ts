import { Request, Response } from "express";
import Product from "../models/product.model";
import type { ProductInput } from "../types/product.types";

export const addProduct = (
  req: Request<unknown, unknown, ProductInput>,
  res: Response,
) => {
  const product = new Product(req.body);
  const savedProduct = product.save();
  res.status(201).json({
    message: "Product added successfully",
    data: savedProduct,
  });
};

export const fetchAll = (_req: Request, res: Response) => {
  const products = Product.fetchAll();
  res.json({ data: products });
};

export const fetchProductById = (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const product = Product.fetchProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ data: product });
};

export const fetchShoppingProducts = (_req: Request, res: Response) => {
  const products = Product.fetchPublished();
  res.json({ data: products });
};

export const fetchShoppingProductById = (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const product = Product.fetchPublishedById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ data: product });
};
