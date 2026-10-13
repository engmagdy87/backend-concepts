import type { UserRole } from "./user.types";

export interface SignupBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
}
