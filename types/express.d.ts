import type { TokenPayload } from "./auth.types";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth`; `undefined` on public routes. */
      user?: TokenPayload;
    }
  }
}

export {};
