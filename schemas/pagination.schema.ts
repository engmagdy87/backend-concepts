import { z } from "zod";

/** Biggest page a client may ask for, so nobody can request a million rows at once. */
export const MAX_PAGE_SIZE = 50;

/**
 * `?page=2&limit=3` on a list route.
 * Query values always arrive as strings ("2"), so `z.coerce.number()` turns
 * them into numbers first. Missing → the default. `"abc"`, `0`, `1.5` → 400.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(10),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
