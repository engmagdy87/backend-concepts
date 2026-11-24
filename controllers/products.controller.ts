import { Request, Response } from "express";
import Product from "../models/product.model";
import type { ProductInput } from "../types/product.types";
import { parseId } from "../utils/number.utils";
import {
  deleteFile,
  deleteProductImage,
  productImageUrl,
} from "../services/storage.service";
import { buildPageMeta, parsePagination } from "../utils/pagination.utils";

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
  const parsedId = parseId(req.params.id);

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
  req: Request<{ id: string }, unknown, unknown>,
  res: Response,
) => {
  const parsedId = parseId(req.params.id);

  if (parsedId === null) {
    return res.status(400).json({
      message: "id must be a positive integer",
    });
  }

  const deleted = await Product.delete(parsedId);
  if (!deleted) {
    return res.status(404).json({ message: "Product not found" });
  }
  // The row is gone, so its image file is dead: delete it (only if it's ours).
  await deleteProductImage(deleted.imageUrl);

  res.json({ message: "Product deleted successfully" });
};

/**
 * Already ran: `validateIdParam` (the id is valid) and `uploadProductImage`
 * (the file, if any, is on disk as `req.file`).
 * If anything goes wrong from here, delete that file so it isn't left behind.
 */
export const uploadImage = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No image. Send it as form-data in the field "image"',
    });
  }

  const result = await Product.setImageUrl(
    Number(req.params.id),
    productImageUrl(req.file.filename),
  );
  if (!result) {
    await deleteFile(req.file.path);
    return res.status(404).json({ message: "Product not found" });
  }

  // Saved first, then delete the old file. If the save had failed, the product
  // would still point to the old file, so it must not be deleted before.
  await deleteProductImage(result.oldImageUrl);

  res.json({ message: "Image uploaded successfully", data: result.product });
};

export const fetchProducts = async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query); // same rules as the shop list
  if (!pagination.ok) {
    return res.status(400).json({ message: "Invalid query", errors: pagination.errors });
  }
  const { page, limit } = pagination;

  const [products, totalItems] = await Product.fetchProducts({ page, limit });
  res.json({ data: products, meta: buildPageMeta(totalItems, page, limit) });
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

export const fetchShoppingProducts = async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query); // ?page=2&limit=3, both optional
  if (!pagination.ok) {
    return res.status(400).json({ message: "Invalid query", errors: pagination.errors });
  }
  const { page, limit } = pagination;

  const [products, totalItems] = await Product.fetchPublished({ page, limit });
  res.json({ data: products, meta: buildPageMeta(totalItems, page, limit) });
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
