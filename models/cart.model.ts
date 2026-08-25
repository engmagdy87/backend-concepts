import { CartItem } from "../types/cart.types";
import db from "../utils/database.utils";

class Cart {
  static async addToCart(productId: number) {
    const [rows] = await db.execute(
      "SELECT * FROM cart_items WHERE productId = ?",
      [productId],
    );
    const existingItem = (rows as CartItem[])[0];

    if (existingItem) {
      await db.execute(
        "UPDATE cart_items SET quantity = quantity + 1 WHERE productId = ?",
        [productId],
      );
    } else {
      await db.execute(
        "INSERT INTO cart_items (productId, quantity) VALUES (?, ?)",
        [productId, 1],
      );
    }
  }

  static async removeFromCart(productId: number) {
    const [rows] = await db.execute(
      "SELECT * FROM cart_items WHERE productId = ?",
      [productId],
    );
    const existingItem = (rows as CartItem[])[0];

    if (!existingItem) {
      return;
    }

    if (existingItem.quantity === 1) {
      await db.execute("DELETE FROM cart_items WHERE productId = ?", [
        productId,
      ]);
    } else {
      await db.execute(
        "UPDATE cart_items SET quantity = quantity - 1 WHERE productId = ?",
        [productId],
      );
    }
  }

  static async clearCart() {
    await db.execute("DELETE FROM cart_items");
  }

  static async getCart() {
    const [rows] = await db.execute("SELECT * FROM cart_items");
    return rows as CartItem[];
  }
}

export default Cart;
