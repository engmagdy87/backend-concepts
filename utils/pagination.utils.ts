import { z } from "zod";
import { paginationSchema } from "../schemas/pagination.schema";

/**
 * Reads `?page=&limit=` from `req.query`. Used by every paginated list.
 * Not a middleware: Express 5's `req.query` is read-only, so the cleaned
 * numbers can't be put back on it. The controller gets them from here instead.
 */
export function parsePagination(query: unknown) {
  const result = paginationSchema.safeParse(query);
  if (!result.success) {
    return {
      ok: false as const,
      errors: z.flattenError(result.error).fieldErrors,
    };
  }
  return { ok: true as const, ...result.data }; // { ok, page, limit }
}

/**
 * Everything a frontend needs to draw page buttons
 * (first, previous, current, next, last), worked out from the total count.
 */
export function buildPageMeta(totalItems: number, page: number, limit: number) {
  // 15 items, 3 per page → 5 pages. 0 items still counts as 1 (empty) page.
  const lastPage = Math.max(1, Math.ceil(totalItems / limit));
  const hasNextPage = page < lastPage;
  const hasPreviousPage = page > 1;

  return {
    totalItems,
    currentPage: page,
    lastPage,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? page + 1 : null,
    // Past the end (page 99 of 5), "previous" leads back to the last real page.
    previousPage: hasPreviousPage ? Math.min(page - 1, lastPage) : null,
  };
}
