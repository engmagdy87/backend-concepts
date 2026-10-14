import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/token.utils";

/** Verifies the Bearer token and sets `req.user`; sends 401 and returns false on failure. */
const authenticate = (req: Request, res: Response): boolean => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    res.status(401).json({ message: "Missing or malformed Authorization header" });
    return false;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ message: "Invalid or expired token" });
    return false;
  }

  req.user = payload;
  return true;
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (authenticate(req, res)) {
    next();
  }
};

/** No Authorization header → continue as guest. A header that's present must be valid. */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers.authorization || authenticate(req, res)) {
    next();
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};
