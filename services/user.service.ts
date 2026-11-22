import User from "../models/user.model";
import type {
  UpdateUserResult,
  UserInput,
  UserOutput,
  UserRole,
} from "../types/user.types";
import { hashPassword } from "../utils/password.utils";
import { isDuplicateKeyError } from "../utils/database.utils";

export const createUserService = async (
  userData: UserInput,
  role: UserRole = "customer",
): Promise<UserOutput | null> => {
  const existingUser = await User.fetchUserByEmail(userData.email);

  if (existingUser) {
    return null;
  }
  const passwordHash = await hashPassword(userData.password);
  const user = new User({ ...userData, password: passwordHash }, role);

  try {
    return await user.save();
  } catch (err) {
    // Two signups with the same email at the same moment: both passed the
    // check above, MySQL's UNIQUE(email) stopped the second. Email taken → 409.
    if (isDuplicateKeyError(err)) return null;
    throw err; // anything else really broke → 500
  }
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

  const passwordHash = await hashPassword(userData.password);

  let updatedUser;
  try {
    updatedUser = await User.update(userId, {
      ...userData,
      password: passwordHash,
    });
  } catch (err) {
    // Someone else took this email between our check and the save → 409.
    if (isDuplicateKeyError(err)) return { status: "email_in_use" };
    throw err;
  }

  if (!updatedUser) return { status: "not_found" };

  return { status: "ok", user: updatedUser };
};
