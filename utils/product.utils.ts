import fs from "fs";
import path from "path";
import type { ProductRecord } from "../types/product.types";

export const productsFilePath = path.join(__dirname, "../data/products.json");

export function getProductsFromFile(): ProductRecord[] {
  if (!fs.existsSync(productsFilePath)) {
    return [];
  }
  const fileContent = fs.readFileSync(productsFilePath, "utf8");
  return fileContent ? (JSON.parse(fileContent) as ProductRecord[]) : [];
}
