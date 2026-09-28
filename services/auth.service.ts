import User from "../models/user.model";
import type { SignupBody, LoginBody } from "../types/auth.types";
import { UserOutput } from "../types/user.types";
import { createUserService } from "./user.service";

export const signupService = async (
  userData: SignupBody,
): Promise<UserOutput | null> => await createUserService(userData);
