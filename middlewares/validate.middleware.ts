import { NextFunction, Request, Response } from "express";
import { z } from "zod";

/**
 * Checks `req.body` against a schema before the controller runs.
 * Bad body → 400 listing every bad field. Good body → `req.body` becomes the
 * cleaned copy (trimmed, unknown fields dropped), then `next()`.
 */
export const validateBody =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid body",
        errors: z.flattenError(result.error).fieldErrors,
      });
    }

    req.body = result.data;
    next();
  };
