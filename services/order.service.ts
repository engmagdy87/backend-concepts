import { AppDataSource } from "../utils/database.utils";
import Order from "../models/order.model";

/** The user's own orders with their lines, newest first. */
export const getOrdersService = async (userId: number): Promise<Order[]> => {
  return AppDataSource.getRepository(Order).find({
    where: { userId }, // only yours: userId comes from the token
    relations: { items: true }, // join order_items (order.items)
    order: { id: "DESC", items: { id: "ASC" } },
  });
};
