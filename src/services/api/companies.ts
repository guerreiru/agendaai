import axios from "axios";
import { api } from "./index";

export type CreateCompanyPayload = {
	name: string;
	slug: string;
	ownerId: string;
	timezone: string;
	autoConfirm: boolean;
};

export type CompanyResponse = {
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

/**
 * Create a new company
 * POST /companies
 * Requires:
 * - Authorization header with Bearer token
 * - User role: COMPANY_OWNER, ADMIN, or SUPER_ADMIN
 * - If COMPANY_OWNER, ownerId must match the logged-in user's id
 */
export async function createCompany(
	payload: CreateCompanyPayload,
): Promise<CompanyResponse> {
	const response = await api.post<CompanyResponse>("/companies", payload);
	return response.data;
}

export type UpdateCompanyPayload = {
	name?: string;
	slug?: string;
	phone?: string | null;
	timezone?: string;
	autoConfirm?: boolean;
};

export type CompanySlugStatus =
	| "idle"
	| "checking"
	| "available"
	| "unavailable"
	| "invalid"
	| "error";

export async function getCompanyById(
	companyId: string,
): Promise<CompanyResponse> {
	const response = await api.get<CompanyResponse>(`/companies/${companyId}`);
	return response.data;
}

export async function updateCompany(
	companyId: string,
	payload: UpdateCompanyPayload,
): Promise<CompanyResponse> {
	const response = await api.patch<CompanyResponse>(
		`/companies/${companyId}`,
		payload,
	);
	return response.data;
}

/**
 * Check if a company slug is available
 * Returns true if available, false if already in use
 */
export async function checkCompanySlugAvailability(
	slug: string,
): Promise<boolean> {
	const result = await checkCompanySlugStatus(slug);
	return result.available;
}

export async function checkCompanySlugStatus(
	slug: string,
): Promise<{ available: boolean; status: CompanySlugStatus }> {
	const normalized = slug.trim().toLowerCase();

	if (!normalized) {
		return { available: false, status: "invalid" };
	}

	try {
		await api.get(`/agendaai/${encodeURIComponent(normalized)}`);

		// 200 means slug exists -> unavailable.
		return { available: false, status: "unavailable" };
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 404) {
				// 404 means company not found -> available.
				return { available: true, status: "available" };
			}

			if (error.response?.status === 400) {
				// 400 means invalid slug.
				return { available: false, status: "invalid" };
			}
		}

		throw error;
	}
}
