export type UserRole =
	| "CLIENT"
	| "PROFESSIONAL"
	| "COMPANY_OWNER"
	| "ADMIN"
	| "SUPER_ADMIN";

export type OwnedCompany = {
	id: string;
	name: string;
	slug: string;
	phone: string | null;
	ownerId: string;
	timezone: string;
	autoConfirm: boolean;
	createdAt: string;
	updatedAt: string;
};

export type User = {
	id: string;
	email: string;
	phone?: string | null;
	name: string;
	role: UserRole;
	companyId?: string | null;
	displayName?: string | null;
	ownedCompany?: OwnedCompany[];
	professionalServices?: unknown[];
	createdAt?: string;
	updatedAt?: string;
};

export type AuthUser = User;
