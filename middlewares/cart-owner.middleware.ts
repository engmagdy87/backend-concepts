import { randomBytes } from "node:crypto";
import { NextFunction, Request, Response } from "express";

const GUEST_COOKIE = "guestCart";
const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url
const GUEST_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Decides whose cart this request touches. Logged-in users → their `userId`.
 * Guests → an opaque `HttpOnly` cookie token (issued here on first visit).
 * Must run after `optionalAuth`.
 */
export const resolveCartOwner = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user) {
    req.cartOwner = { userId: req.user.userId };
    return next();
  }

  const cookie: unknown = req.cookies?.[GUEST_COOKIE];
  let guestToken =
    typeof cookie === "string" && GUEST_TOKEN_PATTERN.test(cookie)
      ? cookie
      : undefined;

  if (!guestToken) {
    guestToken = randomBytes(32).toString("base64url");
    res.cookie(GUEST_COOKIE, guestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/cart",
      maxAge: GUEST_COOKIE_MAX_AGE_MS,
    });
  }

  req.cartOwner = { guestToken };
  next();
};
