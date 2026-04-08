import type {
	Appointment,
	ProfessionalServiceLink,
	TimeSlot,
} from "../../types/booking";
import type { Service } from "../../types/service";
import { createAppointment, getAvailableSlots } from "./booking";
import { api } from "./client";
import { listCompanyProfessionalServices } from "./professionals";
import { listCompanyServices } from "./services";

export type ClientSearchResult = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	role: "CLIENT";
	createdAt: string;
	updatedAt: string;
};

export type QuickCreateClientPayload = {
	name: string;
	email: string;
	phone?: string;
	password: string;
};

export async function searchClients(
	query: string,
): Promise<ClientSearchResult[]> {
	const response = await api.get<ClientSearchResult[]>("/users/search", {
		params: { query },
	});

	return Array.isArray(response.data) ? response.data : [];
}

export async function quickCreateClient(
	payload: QuickCreateClientPayload,
): Promise<ClientSearchResult> {
	const response = await api.post<ClientSearchResult>("/users", payload);
	return response.data;
}

export async function listProfessionalAvailableServices(
	companyId: string,
	professionalId: string,
): Promise<Array<{ service: Service; link: ProfessionalServiceLink }>> {
	const [services, links] = await Promise.all([
		listCompanyServices(companyId),
		listCompanyProfessionalServices(companyId),
	]);

	const availableLinks = links.filter(
		(link) => link.professionalId === professionalId && link.isActive,
	);

	const serviceMap = new Map(services.map((service) => [service.id, service]));

	return availableLinks
		.map((link) => {
			const service = serviceMap.get(link.serviceId);
			if (!service) {
				return null;
			}
			return { service, link };
		})
		.filter(
			(item): item is { service: Service; link: ProfessionalServiceLink } =>
				Boolean(item),
		);
}

export async function listSlotsForProfessionalBooking(
	professionalId: string,
	serviceId: string,
	date: string,
): Promise<TimeSlot[]> {
	return getAvailableSlots(professionalId, serviceId, date);
}

export async function createAppointmentByProfessional(payload: {
	companyId: string;
	clientId: string;
	professionalId: string;
	serviceId: string;
	date: string;
	startTime: string;
	endTime: string;
}): Promise<Appointment> {
	return createAppointment(payload);
}
