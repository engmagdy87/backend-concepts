// CORS: which websites may call this API from a browser.
// A browser blocks a page on http://localhost:3000 from reading answers from
// http://localhost:3040 (another "origin") unless the API says it's allowed.
// CORS_ORIGIN in .env lists the allowed addresses, comma-separated. Missing →
// none. Postman and curl aren't browsers, so CORS never applies to them.
// Used by the HTTP routes (app.ts) and the socket (socket.utils.ts).
export const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
