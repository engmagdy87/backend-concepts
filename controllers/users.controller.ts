import { Request, Response } from "express";
import User from "../models/user.model";
import {
  USER_REQUIRED_FIELDS,
  type UserInput,
  type DeleteUserBody,
} from "../types/user.types";
import { parseId } from "../utils/number.utils";
import { createUserService, updateUserService } from "../services/user.service";
import { findMissingFields } from "../utils/validation.utils";

export const addUser = async (
  req: Request<unknown, unknown, UserInput>,
  res: Response,
) => {
  const missing = findMissingFields<UserInput>(req.body, USER_REQUIRED_FIELDS);

  if (missing.length) {
    return res
      .status(400)
      .json({ message: `Missing fields: ${missing.join(", ")}` });
  }
  const user = await createUserService(req.body);

  if (!user) {
    return res.status(409).json({ message: "Email already exists" });
  }

  res.status(201).json({
    message: "User added successfully",
    data: user,
  });
};

export const updateUser = async (
  req: Request<{ id: string }, unknown, UserInput>,
  res: Response,
) => {
  const parsedId = parseId(req.params.id);

  if (parsedId === null) {
    return res.status(400).json({
      message: "id must be a positive integer",
    });
  }

  const missing = findMissingFields<UserInput>(req.body, USER_REQUIRED_FIELDS);

  if (missing.length) {
    return res
      .status(400)
      .json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  const result = await updateUserService(parsedId, req.body);

  if (result.status === "not_found") {
    return res.status(404).json({ message: "User not found" });
  }
  if (result.status === "email_in_use") {
    return res.status(409).json({ message: "Email already in use" });
  }

  res.json({ message: "User updated successfully", data: result.user });
};

export const deleteUser = async (
  req: Request<unknown, unknown, DeleteUserBody>,
  res: Response,
) => {
  const parsedId = parseId(req.body?.id ?? "");

  if (parsedId === null) {
    return res.status(400).json({
      message: "id must be a positive integer",
    });
  }

  const deleted = await User.delete(parsedId);
  if (!deleted) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ message: "User deleted successfully" });
};

export const fetchUsers = async (_req: Request, res: Response) => {
  const users = await User.fetchUsers();
  res.json({ data: users });
};

export const fetchUserById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const user = await User.fetchUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ data: user });
};
