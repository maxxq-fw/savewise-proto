export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function getAuthToken() {
  return localStorage.getItem("savewise_auth_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("savewise_auth_token", token);
}

export function removeAuthToken() {
  localStorage.removeItem("savewise_auth_token");
}