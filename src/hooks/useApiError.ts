import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { classifyApiError, toApiError } from "../services/api/error";
import type { ApiErrorAction } from "../types/api";

/**
 * Returns a stable `handleApiError` function.
 *
 * - Automatically navigates to `/login` on `401` and `/forbidden` on `403`,
 *   then returns `null` so callers can early-return without setting state.
 * - For all other status codes, returns the classified `ApiErrorAction` with
 *   `type` and `message` so callers can react to specific situations
 *   (e.g. `notFound`, `conflict`, `serverError`).
 */
export function useApiError() {
	const navigate = useNavigate();

	const handleApiError = useCallback(
		(error: unknown): ApiErrorAction | null => {
			const apiError = toApiError(error);
			const classified = classifyApiError(
				apiError.statusCode,
				apiError.message,
			);

			if (classified.type === "unauthenticated") {
				navigate("/login", { replace: true });
				return null;
			}

			if (classified.type === "forbidden") {
				navigate("/forbidden", { replace: true });
				return null;
			}

			return classified;
		},
		[navigate],
	);

	return handleApiError;
}
