export interface UserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserOutput extends UserInput {
  id: number;
  createdAt: Date;
}

/** Clients may send a number or a numeric string. */
export type UserIdInput = number | string;

export interface DeleteUserBody {
  id: UserIdInput;
}

export type UpdateUserResult =
  | { status: "ok"; user: UserOutput }
  | { status: "not_found" }
  | { status: "email_in_use" };
