import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/token.utils";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res
      .status(401)
      .json({ message: "Missing or malformed Authorization header" });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.user = payload;
  next();
};
