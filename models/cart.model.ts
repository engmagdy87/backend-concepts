import { getCartFromFile, writeCartToFile } from "../utils/cart.utils";

class Cart {
  static addToCart(productId: number) {
    const cart = getCartFromFile();
    const existingItem = cart.find((item) => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ productId, quantity: 1 });
    }

    writeCartToFile(cart);
  }

  static removeFromCart(productId: number) {
    const cart = getCartFromFile();
    const existingItem = cart.find((item) => item.productId === productId);

    if (!existingItem) {
      return;
    }

    existingItem.quantity -= 1;
    if (existingItem.quantity === 0) {
      cart.splice(cart.indexOf(existingItem), 1);
    }

    writeCartToFile(cart);
  }

  static clearCart() {
    writeCartToFile([]);
  }

  static getCart() {
    return getCartFromFile();
  }
}

export default Cart;
