export interface UserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** Admin add-user only. `role` is untrusted until `isUserRole` checks it. */
export interface AddUserBody extends UserInput {
  role?: unknown;
}

export const USER_REQUIRED_FIELDS: (keyof UserInput)[] = [
  "email",
  "password",
  "firstName",
  "lastName",
];

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
