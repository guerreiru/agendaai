export type ApiError = {
	message: string;
	statusCode?: number;
	details?: unknown;
};

export type ApiErrorAction =
	| { type: "validation"; message: string }
	| { type: "unauthenticated"; message: string }
	| { type: "forbidden"; message: string }
	| { type: "notFound"; message: string }
	| { type: "conflict"; message: string }
	| { type: "rateLimit"; message: string }
	| { type: "serverError"; message: string };
