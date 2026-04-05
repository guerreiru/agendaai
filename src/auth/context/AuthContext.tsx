import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { ApiError } from "../../types/api";
import type { User } from "../../types/user";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
} from "../../services/api/auth";
import { configureApiInterceptors, toApiError } from "../../services/api";
import { AuthContext, type AuthContextValue } from "./auth-context";

/**
 * Access token is stored ONLY in memory (React state).
 * Never persisting to localStorage for security reasons.
 * Refresh token is stored in HttpOnly cookie by backend.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const accessTokenRef = useRef<string | null>(accessToken);
  const refreshLockRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const clearSessionLocal = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await meRequest();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      const parsedError = toApiError(err);
      setError(parsedError);
      return null;
    }
  }, []);
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (refreshLockRef.current) {
      return refreshLockRef.current;
    }

    refreshLockRef.current = (async () => {
      try {
        const response = await refreshRequest();
        setAccessToken(response.accessToken);
        setError(null);
        return response.accessToken;
      } catch {
        clearSessionLocal();
        return null;
      } finally {
        refreshLockRef.current = null;
      }
    })();

    return refreshLockRef.current;
  }, [clearSessionLocal]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await loginRequest({ email, password });
        setAccessToken(response.accessToken);

        const currentUser = await meRequest();
        setUser(currentUser);
      } catch (err) {
        clearSessionLocal();
        setError(toApiError(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [clearSessionLocal],
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      await logoutRequest();
    } catch {
      // Local cleanup still happens even if backend already invalidated session.
    } finally {
      clearSessionLocal();
      setError(null);
      setIsLoading(false);
    }
  }, [clearSessionLocal]);

  const initAuth = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const token = await refreshToken();

      if (!token) {
        clearSessionLocal();
        setError(null);
        return;
      }

      await getCurrentUser();
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [clearSessionLocal, getCurrentUser, refreshToken]);

  useEffect(() => {
    configureApiInterceptors({
      getAccessToken: () => accessTokenRef.current,
      refreshToken,
      onAuthFailure: clearSessionLocal,
    });
  }, [clearSessionLocal, refreshToken]);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      error,
      login,
      logout,
      refreshToken,
      getCurrentUser,
      initAuth,
    }),
    [
      user,
      accessToken,
      isLoading,
      error,
      login,
      logout,
      refreshToken,
      getCurrentUser,
      initAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
