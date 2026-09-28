import bcrypt from "bcrypt";
import User from "../models/user.model";
import type {
  UpdateUserResult,
  UserInput,
  UserOutput,
} from "../types/user.types";

export const createUserService = async (
  userData: UserInput,
): Promise<UserOutput | null> => {
  const existingUser = await User.fetchUserByEmail(userData.email);

  if (existingUser) {
    return null;
  }

  const passwordHash = await bcrypt.hash(userData.password, 10);
  const user = new User({ ...userData, password: passwordHash });
  return user.save();
};

/**
 * Full replace (PUT): `password` is required, so it is always re-hashed.
 * TODO: allow partial updates (`Partial<UserInput>`, PATCH) and hash only
 * when a new password is sent; ideally move password changes to their own
 * endpoint (e.g. `PATCH /users/:id/password`).
 */
export const updateUserService = async (
  userId: number,
  userData: UserInput,
): Promise<UpdateUserResult> => {
  const existingUser = await User.fetchUserById(userId);

  if (!existingUser) return { status: "not_found" };

  const newEmailOwner = await User.fetchUserByEmail(userData.email);

  if (newEmailOwner && newEmailOwner.id !== userId)
    return { status: "email_in_use" };

  const passwordHash = await bcrypt.hash(userData.password, 10);

  const updatedUser = await User.update(userId, {
    ...userData,
    password: passwordHash,
  });

  if (!updatedUser) return { status: "not_found" };

  return { status: "ok", user: updatedUser };
};
