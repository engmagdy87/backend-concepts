import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { allowedOrigins } from "./cors.utils";
import { verifyToken } from "./token.utils";
import type { TokenPayload } from "../types/auth.types";

// One Socket.IO server for the whole app, created once in app.ts start().
let io: Server | undefined;

/** The private room of one user: every socket (tab) that user has open joins it. */
export const userRoom = (userId: number) => `user:${userId}`;

/**
 * The token a client sent when connecting, if any.
 * - Browser (socket.io-client): `io(url, { auth: { token } })`. A browser can't
 *   add an Authorization header to a socket, so the token travels here.
 * - Postman / other tools: the usual `Authorization: Bearer <token>` header.
 */
function tokenFromHandshake(socket: Socket): string | undefined {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === "string" && fromAuth) {
    return fromAuth.replace(/^Bearer\s+/i, ""); // accept "Bearer x" or just "x"
  }

  const [scheme, token] = socket.handshake.headers.authorization?.split(" ") ?? [];
  if (scheme?.toLowerCase() === "bearer" && token) {
    return token;
  }
  return undefined;
}

/**
 * Attaches Socket.IO to the HTTP server Express already runs on, so sockets
 * use the same port (3040). A client first sends a normal HTTP request; the
 * server agrees to "upgrade" it, and from then on the connection stays open
 * in both directions.
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins }, // same list as the HTTP routes
  });

  // Runs once per connection, before "connection" (like requireAuth for routes).
  // The login is optional: product news is public.
  //   no token     → guest
  //   valid token  → socket.data.user is set (joins its room below)
  //   bad token    → refused; the client gets "connect_error" (like a 401)
  io.use((socket, next) => {
    const token = tokenFromHandshake(socket);
    if (!token) {
      return next(); // guest
    }

    const user = verifyToken(token); // the same check as requireAuth
    if (!user) {
      return next(new Error("Invalid or expired token"));
    }

    socket.data.user = user;
    next();
  });

  io.on("connection", (socket) => {
    // socket.data is Socket.IO's free-form bag per socket (like req.user for routes).
    const user = socket.data.user as TokenPayload | undefined;
    if (user) {
      // Rooms live in the server's memory: after a reconnect the socket is
      // new, runs io.use again and joins again.
      socket.join(userRoom(user.userId));
      console.log(`socket connected ${socket.id} (user ${user.userId})`);
    } else {
      console.log(`socket connected ${socket.id} (guest)`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`socket disconnected ${socket.id} (${reason})`);
    });
  });

  return io;
}

/** The Socket.IO server, for code that wants to send an event. */
export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO is not started yet (call initSocket first)");
  }
  return io;
}

export type ProductChange = "created" | "updated" | "deleted";

/**
 * Tells every connected client "the product list changed".
 * Only the action and the id, never the product itself: it may be unpublished,
 * and guests must not see it. The client refetches GET /shop/products.
 * Call it only after the database change succeeded.
 */
export function emitProductsChanged(action: ProductChange, productId: number) {
  getIO().emit("products:changed", { action, productId });
}

/**
 * Tells one user (all their open tabs) that their order is paid.
 * Sent to their private room only: other users never see it.
 */
export function emitOrderPaid(
  userId: number,
  payload: { orderId: number; total: number },
) {
  getIO().to(userRoom(userId)).emit("order:paid", payload);
}
