import type { z } from "zod";
import type { loginSchema } from "../schemas/user.schema";
import type { UserInput, UserRole } from "./user.types";

/** Signup uses the same shape as a user (no `role`). */
export type SignupBody = UserInput;

export type LoginBody = z.infer<typeof loginSchema>;

export interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
}
