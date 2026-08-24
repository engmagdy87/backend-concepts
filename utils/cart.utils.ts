import fs from "fs";
import path from "path";
import type { CartItem } from "../types/cart.types";

export const cartFilePath = path.join(__dirname, "../data/cart.json");

export function getCartFromFile(): CartItem[] {
  if (!fs.existsSync(cartFilePath)) {
    return [];
  }
  const fileContent = fs.readFileSync(cartFilePath, "utf8");
  return fileContent ? (JSON.parse(fileContent) as CartItem[]) : [];
}

export function writeCartToFile(cart: CartItem[]) {
  fs.writeFileSync(cartFilePath, JSON.stringify(cart, null, 2));
}
