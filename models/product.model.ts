import fs from "fs";
import type { ResultSetHeader } from "mysql2";
import db from "../utils/database.utils";
import type { ProductInput, ProductRecord } from "../types/product.types";
import { isPositiveInteger } from "../utils/number.utils";
import { getProductsFromFile, productsFilePath } from "../utils/product.utils";

const products: ProductRecord[] = getProductsFromFile();

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

function writeProductsToFile(): void {
  fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
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
    productData: Partial<ProductInput>,
  ): Promise<ProductRecord | undefined> {
    const setClauses: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (productData.title !== undefined) {
      setClauses.push("title = ?");
      values.push(productData.title);
    }
    if (productData.price !== undefined) {
      setClauses.push("price = ?");
      values.push(productData.price);
    }
    if (productData.description !== undefined) {
      setClauses.push("description = ?");
      values.push(productData.description);
    }
    if (productData.imageUrl !== undefined) {
      setClauses.push("imageUrl = ?");
      values.push(productData.imageUrl);
    }
    if (productData.isPublished !== undefined) {
      setClauses.push("isPublished = ?");
      values.push(productData.isPublished);
    }

    if (setClauses.length === 0) {
      return undefined;
    }

    values.push(id);
    await db.execute(
      `UPDATE products SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
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

  static delete(id: number): boolean {
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) {
      return false;
    }

    products.splice(index, 1);
    writeProductsToFile();
    return true;
  }

  static async fetchProducts(): Promise<ProductRecord[]> {
    const [rows] = await db.execute("SELECT * FROM products");
    return (rows as ProductRecord[]).map((row) => ({
      ...row,
      isPublished: Boolean(row.isPublished),
    }));
  }

  static fetchProductById(id: unknown): ProductRecord | undefined {
    const parsedId = Product.parseId(id);
    if (parsedId === null) {
      return undefined;
    }
    return products.find((product) => product.id === parsedId);
  }

  static fetchPublished(): ProductRecord[] {
    return products.filter((product) => product.isPublished);
  }

  static fetchPublishedById(id: unknown): ProductRecord | undefined {
    const parsedId = Product.parseId(id);
    if (parsedId === null) {
      return undefined;
    }
    return products.find(
      (product) => product.isPublished && product.id === parsedId,
    );
  }
}

export default Product;
