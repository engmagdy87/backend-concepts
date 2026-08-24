import { getCartFromFile, writeCartToFile } from "../utils/cart.utils";

class Cart {
  static addToCart(productId: number, quantity: number) {
    const cart = getCartFromFile();
    const existingItem = cart.find((item) => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    writeCartToFile(cart);
  }

  static removeFromCart(productId: number) {
    const cart = getCartFromFile();
    const newCart = cart.filter((item) => item.productId !== productId);
    writeCartToFile(newCart);
  }

  static clearCart() {
    writeCartToFile([]);
  }

  static getCart() {
    return getCartFromFile();
  }
}

export default Cart;
