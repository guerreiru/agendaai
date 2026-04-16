import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { configureApiInterceptors, toApiError } from "../../services/api";
import {
	loginRequest,
	logoutRequest,
	meRequest,
	refreshRequest,
} from "../../services/api/auth";
import type { ApiError } from "../../types/api";
import type { User } from "../../types/user";
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
	const queryClient = useQueryClient();

	useEffect(() => {
		accessTokenRef.current = accessToken;
	}, [accessToken]);

	const clearSessionLocal = useCallback(() => {
		setAccessToken(null);
		setUser(null);
		queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
	}, [queryClient]);

	// Use React Query to manage getCurrentUser with automatic deduplication
	const { data: currentUserData } = useQuery({
		queryKey: ["auth", "me"],
		queryFn: () => meRequest(accessToken ?? undefined),
		enabled: Boolean(accessToken),
		staleTime: 10 * 60 * 1000, // 10 minutes
		retry: false,
	});

	const getCurrentUser = useCallback(
		async (token?: string): Promise<User | null> => {
			try {
				const currentUser = await meRequest(token);
				setUser(currentUser);
				queryClient.setQueryData(["auth", "me"], currentUser);
				return currentUser;
			} catch (err) {
				const parsedError = toApiError(err);
				if (parsedError.statusCode === 401) {
					clearSessionLocal();
				}
				setError(parsedError);
				return null;
			}
		},
		[clearSessionLocal, queryClient],
	);
	const refreshToken = useCallback(async (): Promise<string | null> => {
		if (refreshLockRef.current) {
			return refreshLockRef.current;
		}

		refreshLockRef.current = (async () => {
			try {
				const response = await refreshRequest();
				accessTokenRef.current = response.accessToken;
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
				accessTokenRef.current = response.accessToken;
				setAccessToken(response.accessToken);

				const currentUser = await meRequest(response.accessToken);
				setUser(currentUser);
				queryClient.setQueryData(["auth", "me"], currentUser);
			} catch (err) {
				clearSessionLocal();
				setError(toApiError(err));
				throw err;
			} finally {
				setIsLoading(false);
			}
		},
		[clearSessionLocal, queryClient],
	);

	const logout = useCallback(async (): Promise<void> => {
		setIsLoading(true);

		try {
			await logoutRequest();
		} catch (err) {
			setError(toApiError(err));
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

			await getCurrentUser(token);

			setError(null);
		} finally {
			setIsLoading(false);
		}
	}, [clearSessionLocal, getCurrentUser, refreshToken]);

	// Sync currentUserData with setUser when it updates
	useEffect(() => {
		if (currentUserData) {
			setUser(currentUserData);
		}
	}, [currentUserData]);

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
