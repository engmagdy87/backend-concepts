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
}

export interface LoginResponse {
  accessToken: string;
}
