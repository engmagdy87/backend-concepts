import { z } from "zod";
import { USER_ROLES } from "../types/user.types";

/**
 * A user body for signup, admin add-user, and admin update-user.
 * `role` is not here: signup and update must never set it. If a client sends
 * it anyway, it is dropped (mass-assignment protection).
 */
export const userSchema = z.object({
  email: z.email().max(255),
  // bcrypt only uses the first 72 bytes of a password, so longer ones would be cut silently.
  password: z.string().min(8).max(72),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

/** Admin add-user may also choose a role (default `customer`). */
export const addUserSchema = userSchema.extend({
  role: z.enum(USER_ROLES).default("customer"),
});

/**
 * Login checks only that both fields are there. It does NOT apply the signup
 * rules: older accounts may have shorter passwords, and a login form should not
 * explain the password policy. The real check is the database (401).
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});
