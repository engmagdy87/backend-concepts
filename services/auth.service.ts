import User from "../models/user.model";
import type { SignupBody, LoginBody, LoginResponse } from "../types/auth.types";
import { UserOutput } from "../types/user.types";
import { verifyPassword } from "../utils/password.utils";
import { signToken } from "../utils/token.utils";
import { createUserService } from "./user.service";

export const signupService = async (
  userData: SignupBody,
): Promise<UserOutput | null> => await createUserService(userData);

export const loginService = async ({
  email,
  password,
}: LoginBody): Promise<LoginResponse | null> => {
  const user = await User.fetchUserByEmail(email);
  if (!user) return null;

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) return null;

  const token = signToken({ userId: user.id, email: user.email });
  return { accessToken: token };
};
