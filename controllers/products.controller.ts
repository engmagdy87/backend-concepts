import { Request, Response } from "express";
import Product from "../models/product.model";
import type { DeleteProductBody, ProductInput } from "../types/product.types";

export const addProduct = async (
  req: Request<unknown, unknown, ProductInput>,
  res: Response,
) => {
  const product = new Product(req.body);
  const savedProduct = await product.save();

  res.status(201).json({
    message: "Product added successfully",
    data: savedProduct,
  });
};

export const updateProduct = async (
  req: Request<{ id: string }, unknown, ProductInput>,
  res: Response,
) => {
  const parsedId = Product.parseId(req.params.id);

  if (parsedId === null) {
    return res.status(400).json({
      message: "id must be a positive integer",
    });
  }

  const updatedProduct = await Product.update(parsedId, req.body);
  if (!updatedProduct) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({
    message: "Product updated successfully",
    data: updatedProduct,
  });
};

export const deleteProduct = async (
  req: Request<unknown, unknown, DeleteProductBody>,
  res: Response,
) => {
  const parsedId = Product.parseId(req.body.id);

  if (parsedId === null) {
    return res.status(400).json({
      message: "id must be a positive integer",
    });
  }

  const deleted = await Product.delete(parsedId);
  if (!deleted) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product deleted successfully" });
};

export const fetchProducts = async (_req: Request, res: Response) => {
  const products = await Product.fetchProducts();
  res.json({ data: products });
};

export const fetchProductById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const product = await Product.fetchProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ data: product });
};

export const fetchShoppingProducts = async (_req: Request, res: Response) => {
  const products = await Product.fetchPublished();
  res.json({ data: products });
};

export const fetchShoppingProductById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const product = await Product.fetchPublishedById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ data: product });
};
