import fs from "fs";
import type { ProductInput, ProductRecord } from "../types/product.types";
import { isPositiveInteger } from "../utils/number.utils";
import { getProductsFromFile, productsFilePath } from "../utils/product.utils";

const products: ProductRecord[] = getProductsFromFile();

function nextProductId(): number {
  return products.reduce((maxId, product) => Math.max(maxId, product.id), 0) + 1;
}

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

  save(): ProductRecord {
    const newProduct = toProductRecord(nextProductId(), this);
    products.push(newProduct);
    writeProductsToFile();
    return newProduct;
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

  static update(
    id: number,
    productData: ProductInput,
  ): ProductRecord | undefined {
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) {
      return undefined;
    }

    const updatedProduct = toProductRecord(id, productData);
    products[index] = updatedProduct;
    writeProductsToFile();
    return updatedProduct;
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

  static fetchProducts(): ProductRecord[] {
    return products;
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
