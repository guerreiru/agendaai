import type { ApiError } from "./api";
import type { User, UserRole } from "./user";

export type LoginPayload = {
	email: string;
	password: string;
};

export type LoginResponse = {
	accessToken: string;
	expiresIn: number;
};

export type RefreshResponse = {
	accessToken: string;
	expiresIn: number;
};

export type AuthState = {
	user: User | null;
	accessToken: string | null;
	isLoading: boolean;
	error: ApiError | null;
};

export type RegisterClientPayload = {
	name: string;
	email: string;
	password: string;
};

export type RegisterCompanyOwnerPayload = RegisterClientPayload & {
	role: Extract<UserRole, "COMPANY_OWNER">;
};

export type RegisterPayload =
	| RegisterClientPayload
	| RegisterCompanyOwnerPayload;
