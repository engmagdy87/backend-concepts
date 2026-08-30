import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { AppDataSource } from "../utils/database.utils";

function cartRepository() {
  return AppDataSource.getRepository(Cart);
}

@Entity({ name: "cart_items" })
class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  productId!: number;

  @Column()
  quantity!: number;

  static async addToCart(productId: number) {
    const cart = await cartRepository().findOneBy({ productId });

    if (cart) {
      await cartRepository().update(cart.id, { quantity: cart.quantity + 1 });
    } else {
      await cartRepository().save({ productId, quantity: 1 });
    }
  }

  static async removeFromCart(productId: number) {
    const cart = await cartRepository().findOneBy({ productId });
    if (!cart) {
      return;
    }

    if (cart.quantity === 1) {
      await cartRepository().remove(cart);
    } else {
      await cartRepository().update(cart.id, { quantity: cart.quantity - 1 });
    }
  }

  static async clearCart() {
    await cartRepository().clear();
  }

  static async getCart(): Promise<Cart[]> {
    return cartRepository().find();
  }
}

export default Cart;
