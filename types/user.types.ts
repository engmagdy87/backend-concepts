export interface UserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const USER_REQUIRED_FIELDS: (keyof UserInput)[] = [
  "email",
  "password",
  "firstName",
  "lastName",
];

export interface UserOutput extends Omit<UserInput, "password"> {
  id: number;
  createdAt: Date;
}

/** Clients may send a number or a numeric string. */
export type UserIdInput = number | string;

export type UpdateUserResult =
  | { status: "ok"; user: UserOutput }
  | { status: "not_found" }
  | { status: "email_in_use" };
