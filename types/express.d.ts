import type { TokenPayload } from "./auth.types";
import type { CartOwner } from "./cart.types";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` / `optionalAuth`; `undefined` on public routes. */
      user?: TokenPayload;
      /** Set by `resolveCartOwner` on `/cart` routes. */
      cartOwner?: CartOwner;
    }
  }
}

export {};
