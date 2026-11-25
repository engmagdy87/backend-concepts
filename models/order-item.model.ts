import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import Order from "./order.model";
import { decimalToNumber } from "../utils/database.utils";

/**
 * One product line in an order. Title and price are copied from the product
 * at checkout, so editing or deleting the product later never changes old orders.
 */
@Entity({ name: "order_items" })
class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", unsigned: true })
  orderId!: number;

  /** `null` once the product is deleted (the line keeps its title and price). */
  @Column({ type: "int", unsigned: true, nullable: true })
  productId!: number | null;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimalToNumber })
  price!: number;

  @Column({ type: "int", unsigned: true })
  quantity!: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: "orderId" })
  order!: Order;
}

export default OrderItem;
