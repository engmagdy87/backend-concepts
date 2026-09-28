import { Request, Response } from "express";
import User from "../models/user.model";
import type { SignupBody, LoginBody } from "../types/auth.types";
import { signupService } from "../services/auth.service";
import bcrypt from "bcrypt";

export const signup = async (
  req: Request<unknown, unknown, SignupBody>,
  res: Response,
) => {
  try {
    const user = await signupService(req.body);

    if (!user) {
      return res.status(409).json({ message: "Email already exists" });
    }

    res
      .status(201)
      .json({ message: "User signed up successfully", data: user });
  } catch (error: unknown) {
    res.status(500).json({
      message: "Failed to sign up user",
      error: (error as Error).message,
    });
  }
};

export const login = async (
  req: Request<unknown, unknown, LoginBody>,
  res: Response,
) => {
  const { email, password } = req.body;

  const user = await User.fetchUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: "Email not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Password is incorrect" });
  }

  res.json({
    message: "User logged in successfully",
    data: user,
  });
};
