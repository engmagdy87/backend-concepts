import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique } from "typeorm";
import { AppDataSource } from "../utils/database.utils";
import CartItem from "./cart-item.model";
import type { CartOwner } from "../types/cart.types";

function cartRepository() {
  return AppDataSource.getRepository(Cart);
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "ER_DUP_ENTRY"
  );
}

@Entity({ name: "carts" })
@Unique("uq_carts_guest_token", ["guestToken"])
@Unique("uq_carts_user_id", ["userId"])
class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Opaque token from the `guestCart` cookie; null for user carts. */
  @Column({ type: "char", length: 43, nullable: true })
  guestToken!: string | null;

  /** Owner for logged-in carts; null for guest carts. */
  @Column({ type: "int", unsigned: true, nullable: true })
  userId!: number | null;

  @OneToMany(() => CartItem, (item) => item.cart)
  items!: CartItem[];

  /**
   * The cart for this owner (by `userId` or `guestToken`, never "first row").
   * `withItems` loads lines + nested product (for GET /cart).
   */
  static async getOrCreate(
    owner: CartOwner,
    { withItems = false } = {},
  ): Promise<Cart> {
    const find = () =>
      cartRepository().findOne({
        where: owner,
        relations: withItems ? { items: { product: true } } : undefined,
      });

    const existing = await find();
    if (existing) {
      return existing;
    }

    try {
      const created = await cartRepository().save(
        cartRepository().create(owner),
      );
      if (withItems) {
        created.items = [];
      }
      return created;
    } catch (err) {
      // A concurrent request created this owner's cart first (UNIQUE key).
      if (isDuplicateKeyError(err)) {
        const winner = await find();
        if (winner) {
          return winner;
        }
      }
      throw err;
    }
  }

  /**
   * Gives the guest cart to a user who has no cart yet (basic attach, no merge).
   * Returns true if the guest cart now belongs to the user.
   */
  static async attachGuestCart(
    guestToken: string,
    userId: number,
  ): Promise<boolean> {
    if (await cartRepository().existsBy({ userId })) {
      return false; // user already has a cart: leave both alone (merge comes later)
    }

    try {
      const result = await cartRepository().update(
        { guestToken },
        { userId, guestToken: null },
      );
      return Boolean(result.affected);
    } catch (err) {
      // A parallel request just created this user's cart (UNIQUE userId).
      if (isDuplicateKeyError(err)) {
        return false;
      }
      throw err;
    }
  }
}

export default Cart;
