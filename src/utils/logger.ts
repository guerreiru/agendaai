/**
 * Logging utility that only logs in development mode
 * Prevents information disclosure in production
 */

const isDevelopment = import.meta.env.MODE === "development";

export function logDebug(message: string, data?: unknown): void {
	if (isDevelopment) {
		console.log(`[DEBUG] ${message}`, data || "");
	}
}

export function logError(message: string, error: unknown): void {
	if (isDevelopment) {
		console.error(`[ERROR] ${message}`, error);
	}
	// In production: send to error tracking service (Sentry, etc)
}

export function logWarn(message: string, data?: unknown): void {
	if (isDevelopment) {
		console.warn(`[WARN] ${message}`, data || "");
	}
}

export function logInfo(message: string, data?: unknown): void {
	if (isDevelopment) {
		console.info(`[INFO] ${message}`, data || "");
	}
}
