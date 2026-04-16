import axios from "axios";
import type { ApiError, ApiErrorAction } from "../../types/api";

export function toApiError(error: unknown): ApiError {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as
			| { error?: string; message?: string }
			| undefined;
		const message = data?.error ?? data?.message ?? error.message;

		return {
			message,
			statusCode: error.response?.status,
			details: error.response?.data,
		};
	}

	if (error instanceof Error) {
		return { message: error.message };
	}

	return { message: "Unexpected error." };
}

export function classifyApiError(
	statusCode: number | undefined,
	message: string,
): ApiErrorAction {
	switch (statusCode) {
		case 400:
			return { type: "validation", message };
		case 401:
			return { type: "unauthenticated", message };
		case 403:
			return { type: "forbidden", message };
		case 404:
			return { type: "notFound", message };
		case 409:
			return { type: "conflict", message };
		case 429:
			return { type: "rateLimit", message };
		default:
			return { type: "serverError", message };
	}
}
