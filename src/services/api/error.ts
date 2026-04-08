import axios from "axios";
import type { ApiError } from "../../types/api";

export function toApiError(error: unknown): ApiError {
	if (axios.isAxiosError(error)) {
		const message =
			(error.response?.data as { error?: string; message?: string } | undefined)
				?.message ??
			(error.response?.data as { error?: string; message?: string } | undefined)
				?.error ??
			error.message;

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
