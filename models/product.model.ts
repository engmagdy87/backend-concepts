import type { ResultSetHeader } from "mysql2";
import db from "../utils/database.utils";
import type { ProductInput, ProductRecord } from "../types/product.types";
import { isPositiveInteger } from "../utils/number.utils";

function toProductRecord(id: number, productData: ProductInput): ProductRecord {
  return {
    id,
    title: productData.title,
    price: productData.price,
    description: productData.description,
    imageUrl: productData.imageUrl,
    isPublished: productData.isPublished,
  };
}

class Product {
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  isPublished: boolean;

  constructor(productData: ProductInput) {
    this.title = productData.title;
    this.price = productData.price;
    this.description = productData.description;
    this.imageUrl = productData.imageUrl;
    this.isPublished = productData.isPublished;
  }

  async save(): Promise<ProductRecord> {
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO products (title, price, description, imageUrl, isPublished) VALUES (?, ?, ?, ?, ?)",
      [
        this.title,
        this.price,
        this.description,
        this.imageUrl,
        this.isPublished,
      ],
    );

    return toProductRecord(result.insertId, this);
  }

  /** Accepts a number or numeric string (e.g. URL param `"3"`). */
  static parseId(value: unknown): number | null {
    if (isPositiveInteger(value)) {
      return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      const id = Number(value.trim());
      return id > 0 ? id : null;
    }
    return null;
  }

  static async update(
    id: number,
    productData: ProductInput,
  ): Promise<ProductRecord | undefined> {
    await db.execute(
      "UPDATE products SET title = ?, price = ?, description = ?, imageUrl = ?, isPublished = ? WHERE id = ?",
      [
        productData.title,
        productData.price,
        productData.description,
        productData.imageUrl,
        productData.isPublished,
        id,
      ],
    );

    const [rows] = await db.execute("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    const row = (rows as ProductRecord[])[0];
    if (!row) {
      return undefined;
    }

    return { ...row, isPublished: Boolean(row.isPublished) };
  }

  static async delete(id: number): Promise<boolean> {
    await db.execute("DELETE FROM products WHERE id = ?", [id]);
    return true;
  }

  static async fetchProducts(): Promise<ProductRecord[]> {
    const [rows] = await db.execute("SELECT * FROM products");
    return (rows as ProductRecord[]).map((row) => ({
      ...row,
      isPublished: Boolean(row.isPublished),
    }));
  }

  static async fetchProductById(
    id: unknown,
  ): Promise<ProductRecord | undefined> {
    const parsedId = Product.parseId(id);
    if (parsedId === null) {
      return undefined;
    }
    const [rows] = await db.execute("SELECT * FROM products WHERE id = ?", [
      parsedId,
    ]);
    return (rows as ProductRecord[])[0];
  }

  static async fetchPublished(): Promise<ProductRecord[]> {
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE isPublished = 1",
    );
    return (rows as ProductRecord[]).map((row) => ({
      ...row,
      isPublished: Boolean(row.isPublished),
    }));
  }

  static async fetchPublishedById(
    id: unknown,
  ): Promise<ProductRecord | undefined> {
    const parsedId = Product.parseId(id);
    if (parsedId === null) {
      return undefined;
    }
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE id = ? AND isPublished = 1",
      [parsedId],
    );
    return (rows as ProductRecord[])[0];
  }
}

export default Product;
