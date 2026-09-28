import jwt from "jsonwebtoken";
import type { TokenPayload } from "../types/auth.types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing in .env`);
  return value;
}

const JWT_ALGORITHM = "HS256";
const JWT_SECRET = requireEnv("JWT_SECRET");
const JWT_EXPIRES_IN = Number(requireEnv("JWT_EXPIRES_IN"));

if (!Number.isInteger(JWT_EXPIRES_IN) || JWT_EXPIRES_IN <= 0) {
  throw new Error("JWT_EXPIRES_IN must be a positive number of seconds");
}

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN,
  });

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });
    if (typeof decoded === "string") return null;
    return { userId: Number(decoded.userId), email: String(decoded.email) };
  } catch {
    return null;
  }
};
