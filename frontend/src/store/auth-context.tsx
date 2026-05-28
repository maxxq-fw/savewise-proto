import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { removeAuthToken, setAuthToken } from "../config/api";
import {
  loginRequest,
  meRequest,
  registerRequest,
  updateWalletRequest
} from "../services/auth-api";
import type { AuthUser, LoginInput, RegisterInput } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  updateWalletAddress: (walletAddress: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CURRENT_USER_STORAGE_KEY = "savewise_current_user";

function readCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeCurrentUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const response = await meRequest();

        if (!active) return;

        setUser(response.user);
        writeCurrentUser(response.user);
      } catch {
        removeAuthToken();
        writeCurrentUser(null);
        setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function register(input: RegisterInput) {
    const response = await registerRequest(input);

    setAuthToken(response.token);
    writeCurrentUser(response.user);
    setUser(response.user);
  }

  async function login(input: LoginInput) {
    const response = await loginRequest(input);

    setAuthToken(response.token);
    writeCurrentUser(response.user);
    setUser(response.user);
  }

  function logout() {
    removeAuthToken();
    writeCurrentUser(null);
    setUser(null);
  }

  async function updateWalletAddress(walletAddress: string) {
    const response = await updateWalletRequest(walletAddress);

    writeCurrentUser(response.user);
    setUser(response.user);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      register,
      login,
      logout,
      updateWalletAddress
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }

  return context;
}