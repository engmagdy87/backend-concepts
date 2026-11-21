import type { z } from "zod";
import type { productSchema } from "../schemas/product.schema";

/** A product body after validation. Comes from the schema, so the two can't drift apart. */
export type ProductInput = z.infer<typeof productSchema>;

/** Clients may send a number or a numeric string. */
export type ProductIdInput = number | string;
