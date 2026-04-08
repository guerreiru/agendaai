import type { Service, UpsertServicePayload } from "../../types/service";
import { api } from "./client";

type ListServicesResponse =
	| Service[]
	| {
			data?: Service[];
			services?: Service[];
	  };

function normalizeServicesResponse(payload: ListServicesResponse): Service[] {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (Array.isArray(payload.services)) {
		return payload.services;
	}

	if (Array.isArray(payload.data)) {
		return payload.data;
	}

	return [];
}

export async function listCompanyServices(
	companyId: string,
): Promise<Service[]> {
	const response = await api.get<ListServicesResponse>(
		`/companies/${companyId}/services`,
	);

	return normalizeServicesResponse(response.data);
}

export async function createService(
	payload: UpsertServicePayload,
): Promise<Service> {
	const response = await api.post<Service>("/services", payload);
	return response.data;
}

export async function updateService(
	serviceId: string,
	payload: UpsertServicePayload,
): Promise<Service> {
	const response = await api.patch<Service>("/services", {
		id: serviceId,
		...payload,
	});
	return response.data;
}

export async function deleteService(serviceId: string): Promise<void> {
	await api.delete(`/services/${serviceId}`);
}
