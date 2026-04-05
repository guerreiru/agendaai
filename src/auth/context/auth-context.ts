import { createContext } from "react";
import type { ApiError } from "../../types/api";
import type { AuthState } from "../../types/auth";
import type { User } from "../../types/user";

export type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  getCurrentUser: () => Promise<User | null>;
  initAuth: () => Promise<void>;
};

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  error: null as ApiError | null,
};

export const AuthContext = createContext<AuthContextValue | null>(null);
