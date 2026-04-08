import axios, {
	type AxiosError,
	type AxiosRequestConfig,
	type InternalAxiosRequestConfig,
} from "axios";

type RequestConfigWithRetry = AxiosRequestConfig & { _retry?: boolean };

type InterceptorHandlers = {
	getAccessToken: () => string | null;
	refreshToken: () => Promise<string | null>;
	onAuthFailure: () => void;
};

const apiBaseUrl =
	import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3001";

const authPathsToSkip = ["/auth/login", "/auth/refresh"];

let getAccessToken: InterceptorHandlers["getAccessToken"] = () => null;
let requestRefreshToken: InterceptorHandlers["refreshToken"] = async () => null;
let handleAuthFailure: InterceptorHandlers["onAuthFailure"] = () => undefined;
let refreshPromise: Promise<string | null> | null = null;
let areInterceptorsAttached = false;

export const api = axios.create({
	baseURL: apiBaseUrl,
	withCredentials: true,
	timeout: 15_000,
});

export function configureApiInterceptors(handlers: InterceptorHandlers): void {
	getAccessToken = handlers.getAccessToken;
	requestRefreshToken = handlers.refreshToken;
	handleAuthFailure = handlers.onAuthFailure;

	if (areInterceptorsAttached) {
		return;
	}

	api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
		const accessToken = getAccessToken();

		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}

		return config;
	});

	api.interceptors.response.use(
		(response) => response,
		async (error: AxiosError) => {
			const status = error.response?.status;
			const config = error.config as RequestConfigWithRetry | undefined;

			if (!config || config._retry || status !== 401) {
				throw error;
			}

			const url = config.url ?? "";
			const isAuthEndpoint = authPathsToSkip.some((path) => url.includes(path));

			if (isAuthEndpoint) {
				throw error;
			}

			config._retry = true;

			if (!refreshPromise) {
				refreshPromise = requestRefreshToken().finally(() => {
					refreshPromise = null;
				});
			}

			const renewedAccessToken = await refreshPromise;

			if (!renewedAccessToken) {
				handleAuthFailure();
				throw error;
			}

			config.headers = config.headers ?? {};
			config.headers.Authorization = `Bearer ${renewedAccessToken}`;

			return api(config);
		},
	);

	areInterceptorsAttached = true;
}
