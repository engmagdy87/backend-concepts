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
