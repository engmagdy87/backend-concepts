import { Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { AppDataSource } from "../utils/database.utils";
import CartItem from "./cart-item.model";

function cartRepository() {
  return AppDataSource.getRepository(Cart);
}

@Entity({ name: "carts" })
class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => CartItem, (item) => item.cart)
  items!: CartItem[];

  static async getOrCreateGuest(): Promise<Cart> {
    const existing = await cartRepository().find({ take: 1 });
    if (existing[0]) {
      return existing[0];
    }
    return cartRepository().save(new Cart());
  }
}

export default Cart;
