import { apiRequest } from "./api-client";
import type { AuthUser, LoginInput, RegisterInput } from "../types/auth";

interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface MeResponse {
  user: AuthUser;
}

interface WalletResponse {
  user: AuthUser;
}

export function registerRequest(input: RegisterInput) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(input)
  });
}

export function loginRequest(input: LoginInput) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(input)
  });
}

export function meRequest() {
  return apiRequest<MeResponse>("/api/auth/me");
}

export function updateWalletRequest(walletAddress: string) {
  return apiRequest<WalletResponse>("/api/auth/wallet", {
    method: "PATCH",
    body: JSON.stringify({ walletAddress })
  });
}