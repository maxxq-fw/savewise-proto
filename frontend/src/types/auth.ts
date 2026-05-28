export interface AuthUser {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  createdAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}