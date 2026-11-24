import { z } from "zod";

/**
 * What a valid product body looks like (add and update both send the full product).
 * This runs at runtime on every request, unlike a TypeScript interface.
 * Unknown fields (e.g. `id`) are dropped from the result.
 * No `imageUrl`: the client uploads a file to `POST /admin/products/:id/image`
 * and the server sets the URL (an `imageUrl` sent here is simply dropped).
 */
export const productSchema = z.object({
  title: z.string().trim().min(1).max(255),
  price: z.number().nonnegative(),
  description: z.string().trim().min(1),
  isPublished: z.boolean(),
});
