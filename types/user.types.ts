import type { z } from "zod";
import type { addUserSchema, userSchema } from "../schemas/user.schema";

/** A user body after validation (signup, add-user, update-user). */
export type UserInput = z.infer<typeof userSchema>;

/** Admin add-user body after validation: `role` is checked and defaulted. */
export type AddUserBody = z.infer<typeof addUserSchema>;

export interface UserOutput extends Omit<UserInput, "password"> {
  id: number;
  role: UserRole;
  createdAt: Date;
}

/** Clients may send a number or a numeric string. */
export type UserIdInput = number | string;

export type UpdateUserResult =
  | { status: "ok"; user: UserOutput }
  | { status: "not_found" }
  | { status: "email_in_use" };

export const USER_ROLES = ["customer", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const isUserRole = (value: unknown): value is UserRole =>
  USER_ROLES.includes(value as UserRole);
