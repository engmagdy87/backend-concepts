import { Request, Response } from "express";
import { getOrdersService } from "../services/order.service";

/** GET /orders: your own orders (paid and pending), newest first, with their lines. */
export const getOrders = async (req: Request, res: Response) => {
  res.json({ data: await getOrdersService(req.user!.userId) });
};
