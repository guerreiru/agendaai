import axios from "axios";
import type {
	Appointment,
	CompanyPublicData,
	CreateAppointmentPayload,
	ProfessionalServiceLink,
	TimeSlot,
} from "../../types/booking";
import { api } from "./client";

// Public API client - no auth required for most endpoints
const publicApi = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

/**
 * Step 1: Fetch company public data with services and professionals
 */
export async function getCompanyBySlug(
	slug: string,
): Promise<CompanyPublicData> {
	const response = await publicApi.get<CompanyPublicData>(`/agendaai/${slug}`);
	return response.data;
}

/**
 * Step 2: Get professional-service links filtered by service
 */
export async function getProfessionalServicesForService(
	companyId: string,
	serviceId: string,
): Promise<ProfessionalServiceLink[]> {
	const response = await publicApi.get<ProfessionalServiceLink[]>(
		`/companies/${companyId}/professional-services`,
		{ params: { serviceId } },
	);

	// Filter only active links
	return Array.isArray(response.data)
		? response.data.filter((link) => link.isActive)
		: [];
}

/**
 * Step 4: Get available time slots for a professional, service, and date
 */
export async function getAvailableSlots(
	professionalId: string,
	serviceId: string,
	date: string, // YYYY-MM-DD
): Promise<TimeSlot[]> {
	const response = await publicApi.get<TimeSlot[] | { slots: TimeSlot[] }>(
		"/slots",
		{
			params: {
				professionalId,
				serviceId,
				date,
			},
		},
	);

	// Handle different response formats
	if (Array.isArray(response.data)) {
		return response.data;
	}

	if (response.data && "slots" in response.data) {
		return response.data.slots;
	}

	return [];
}

/**
 * Step 5: Create appointment (requires authentication)
 */
export async function createAppointment(
	payload: CreateAppointmentPayload,
	accessToken?: string,
): Promise<Appointment> {
	const response = await api.post<Appointment>(
		"/appointments",
		payload,
		accessToken
			? {
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			: undefined,
	);

	return response.data;
}

export { publicApi };

export type CompanySearchResult = {
	id: string;
	name: string;
	slug: string;
	phone: string | null;
};

export async function searchPublicCompanies(
	query: string,
): Promise<CompanySearchResult[]> {
	const response = await publicApi.get<
		CompanySearchResult[] | { data?: CompanySearchResult[] }
	>("/agendaai", { params: query.trim() ? { q: query.trim() } : undefined });

	if (Array.isArray(response.data)) return response.data;
	if (Array.isArray(response.data?.data)) return response.data.data;
	return [];
}
