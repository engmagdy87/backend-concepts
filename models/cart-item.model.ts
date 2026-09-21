import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { AppDataSource } from "../utils/database.utils";
import Cart from "./cart.model";
import Product from "./product.model";

function cartItemRepository() {
  return AppDataSource.getRepository(CartItem);
}

@Entity({ name: "cart_items" })
@Unique("uq_cart_items_cart_product", ["cartId", "productId"])
class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  cartId!: number;

  @Column({ type: "int" })
  productId!: number;

  @Column({ type: "int" })
  quantity!: number;

  @ManyToOne(() => Cart, (cart) => cart.items)
  @JoinColumn({ name: "cartId" })
  cart!: Cart;

  @ManyToOne(() => Product, (product) => product.cartItems)
  @JoinColumn({ name: "productId" }) // FK column for this relation (same as the productId @Column)
  product!: Product;

  static async addToCart(cartId: number, productId: number) {
    const item = await cartItemRepository().findOneBy({ cartId, productId });

    if (item) {
      await cartItemRepository().update(item.id, {
        quantity: item.quantity + 1,
      });
    } else {
      await cartItemRepository().save({ cartId, productId, quantity: 1 });
    }
  }

  static async removeFromCart(cartId: number, productId: number) {
    const item = await cartItemRepository().findOneBy({ cartId, productId });
    if (!item) {
      return;
    }

    if (item.quantity === 1) {
      await cartItemRepository().remove(item);
    } else {
      await cartItemRepository().update(item.id, {
        quantity: item.quantity - 1,
      });
    }
  }

  static async clearForCart(cartId: number) {
    await cartItemRepository().delete({ cartId });
  }

  static async listForCart(cartId: number): Promise<CartItem[]> {
    return cartItemRepository().find({
      where: { cartId },
      relations: { product: true },
    });
  }
}

export default CartItem;
