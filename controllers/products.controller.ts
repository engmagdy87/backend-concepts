import { Request, Response } from "express";
import Product from "../models/product.model";
import type {
  DeleteProductBody,
  UpdateProductBody,
  ProductInput,
} from "../types/product.types";

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

export const updateProduct = (
  req: Request<unknown, unknown, UpdateProductBody>,
  res: Response,
) => {
  const { id, ...productData } = req.body;
  const parsedId = Product.parseId(id);

  if (parsedId === null) {
    return res.status(400).json({
      message: "id must be a positive integer",
    });
  }

  const updatedProduct = Product.update(parsedId, productData);
  if (!updatedProduct) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({
    message: "Product updated successfully",
    data: updatedProduct,
  });
};

export const deleteProduct = (
  req: Request<unknown, unknown, DeleteProductBody>,
  res: Response,
) => {
  const parsedId = Product.parseId(req.body.id);

  if (parsedId === null) {
    return res.status(400).json({
      message: "id must be a positive integer",
    });
  }

  const deleted = Product.delete(parsedId);
  if (!deleted) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product deleted successfully" });
};

export const fetchProducts = (_req: Request, res: Response) => {
  const products = Product.fetchProducts();
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
