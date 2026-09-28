import { Request, Response } from "express";
import type { SignupBody, LoginBody } from "../types/auth.types";
import {
  loginService,
  meService,
  signupService,
} from "../services/auth.service";
import { findMissingFields } from "../utils/validation.utils";
import { USER_REQUIRED_FIELDS, type UserInput } from "../types/user.types";

export const signup = async (
  req: Request<unknown, unknown, SignupBody>,
  res: Response,
) => {
  const missing = findMissingFields<UserInput>(req.body, USER_REQUIRED_FIELDS);

  if (missing.length) {
    return res
      .status(400)
      .json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  const user = await signupService(req.body);

  if (!user) {
    return res.status(409).json({ message: "Email already exists" });
  }

  res.status(201).json({ message: "User signed up successfully", data: user });
};

export const login = async (
  req: Request<unknown, unknown, LoginBody>,
  res: Response,
) => {
  const missing = findMissingFields<LoginBody>(req.body, ["email", "password"]);

  if (missing.length) {
    return res
      .status(400)
      .json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  const loginResponse = await loginService(req.body);

  if (!loginResponse) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    message: "User logged in successfully",
    data: loginResponse,
  });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = await meService(req.user.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ data: user });
};
