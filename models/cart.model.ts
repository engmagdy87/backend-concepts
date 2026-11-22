import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique } from "typeorm";
import { AppDataSource, isDuplicateKeyError } from "../utils/database.utils";
import CartItem from "./cart-item.model";

function cartRepository() {
  return AppDataSource.getRepository(Cart);
}

@Entity({ name: "carts" })
@Unique("uq_carts_user_id", ["userId"])
class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  /** The logged-in user who owns this cart (one cart per user). */
  @Column({ type: "int", unsigned: true })
  userId!: number;

  @OneToMany(() => CartItem, (item) => item.cart)
  items!: CartItem[];

  /**
   * The cart for this user (never "first row").
   * `withItems` loads lines + nested product (for GET /cart).
   */
  static async getOrCreate(
    userId: number,
    { withItems = false } = {},
  ): Promise<Cart> {
    const find = () =>
      cartRepository().findOne({
        where: { userId },
        relations: withItems ? { items: { product: true } } : undefined,
      });

    const existing = await find();
    if (existing) {
      return existing;
    }

    try {
      const created = await cartRepository().save(
        cartRepository().create({ userId }),
      );
      if (withItems) {
        created.items = [];
      }
      return created;
    } catch (err) {
      // A parallel first request for this user created the cart first (UNIQUE userId).
      if (isDuplicateKeyError(err)) {
        const winner = await find();
        if (winner) {
          return winner;
        }
      }
      throw err;
    }
  }
}

export default Cart;
