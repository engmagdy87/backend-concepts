import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { parseId } from "../utils/number.utils";

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

/**
 * Checks that the URL `:id` is a positive integer before anything else runs.
 * Bad id → 400 and the request stops here. Put it before multer, so a file is
 * never saved for a request that can't succeed.
 */
export const validateIdParam = (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  if (parseId(req.params.id) === null) {
    return res.status(400).json({ message: "id must be a positive integer" });
  }
  next();
};
