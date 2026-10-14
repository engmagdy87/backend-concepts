import { randomBytes } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { attachGuestCartService } from "../services/cart.service";

const GUEST_COOKIE = "guestCart";
const GUEST_COOKIE_PATH = "/cart";
const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url
const GUEST_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** The guest token from the cookie, or undefined if missing / not ours. */
const readGuestToken = (req: Request): string | undefined => {
  const cookie: unknown = req.cookies?.[GUEST_COOKIE];
  return typeof cookie === "string" && GUEST_TOKEN_PATTERN.test(cookie)
    ? cookie
    : undefined;
};

/**
 * Decides whose cart this request touches. Logged-in users → their `userId`.
 * Guests → an opaque `HttpOnly` cookie token (issued here on first visit).
 * Must run after `optionalAuth`.
 */
export const resolveCartOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const guestToken = readGuestToken(req);

  if (req.user) {
    // First cart request after login: the guest cart becomes the user's
    // cart if they don't have one yet. The cookie is only sent to /cart,
    // so this happens here rather than in /auth/login.
    if (
      guestToken &&
      (await attachGuestCartService(guestToken, req.user.userId))
    ) {
      res.clearCookie(GUEST_COOKIE, { path: GUEST_COOKIE_PATH });
    }
    req.cartOwner = { userId: req.user.userId };
    return next();
  }

  if (guestToken) {
    req.cartOwner = { guestToken };
    return next();
  }

  const newToken = randomBytes(32).toString("base64url");
  res.cookie(GUEST_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: GUEST_COOKIE_PATH,
    maxAge: GUEST_COOKIE_MAX_AGE_MS,
  });
  req.cartOwner = { guestToken: newToken };
  next();
};
