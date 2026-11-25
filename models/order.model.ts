import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import OrderItem from "./order-item.model";
import { decimalToNumber } from "../utils/database.utils";

export const ORDER_STATUSES = ["pending", "paid"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * One checkout. Starts `pending` when the user starts paying; becomes `paid`
 * only after Stripe confirms the payment.
 */
@Entity({ name: "orders" })
class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", unsigned: true })
  userId!: number;

  @Column({ type: "enum", enum: ORDER_STATUSES, default: "pending" })
  status!: OrderStatus;

  /** What the user agreed to pay, worked out on the server from our prices. */
  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimalToNumber })
  total!: number;

  /**
   * Stripe's id for this payment (UNIQUE: one payment → one order).
   * `select: false`: left out of every find, so it never shows up in API answers.
   * Searching by it (`where`) still works.
   */
  @Column({ type: "varchar", length: 255, nullable: true, select: false })
  stripeSessionId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  /**
   * `cascade: ["insert"]`: saving a new order also saves its new items, in one
   * `save` that TypeORM runs as a transaction (all or nothing).
   */
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: ["insert"] })
  items!: OrderItem[];
}

export default Order;
