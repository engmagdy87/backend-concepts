import { z } from "zod";

/**
 * Body for add / remove one unit. Shape only: a positive whole number.
 * Whether that product exists and is published needs MySQL, so the service
 * checks it (404).
 */
export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
});
