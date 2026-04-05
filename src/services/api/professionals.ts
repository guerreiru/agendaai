import { api } from "./client";
import type { Service } from "../../types/service";
import type {
  CreateProfessionalPayload,
  CreateProfessionalServicePayload,
  ProfessionalServiceLink,
  ProfessionalUser,
  UpdateProfessionalPayload,
  UpdateProfessionalServicePayload,
} from "../../types/professional";

type ProfessionalsResponse = ProfessionalUser[] | { data?: ProfessionalUser[] };
type ServicesResponse = Service[] | { data?: Service[]; services?: Service[] };
type ProfessionalServicesResponse =
  | ProfessionalServiceLink[]
  | { data?: ProfessionalServiceLink[] };

function normalizeArrayResponse<T>(
  payload: T[] | { data?: T[]; services?: T[] },
): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.services)) {
    return payload.services;
  }

  return [];
}

export async function listCompanyProfessionals(
  companyId: string,
): Promise<ProfessionalUser[]> {
  const response = await api.get<ProfessionalsResponse>(
    `/users/company/${companyId}`,
  );
  return normalizeArrayResponse(response.data);
}

export async function createProfessional(
  payload: CreateProfessionalPayload,
): Promise<ProfessionalUser> {
  const response = await api.post<ProfessionalUser>("/users", payload);
  return response.data;
}

export async function updateProfessional(
  professionalId: string,
  payload: UpdateProfessionalPayload,
): Promise<ProfessionalUser> {
  const response = await api.patch<ProfessionalUser>(
    `/users/${professionalId}`,
    payload,
  );
  return response.data;
}

export async function deleteProfessional(
  professionalId: string,
): Promise<ProfessionalUser> {
  const response = await api.delete<ProfessionalUser>(
    `/users/${professionalId}`,
  );
  return response.data;
}

export async function listCompanyCatalogServices(
  companyId: string,
): Promise<Service[]> {
  const response = await api.get<ServicesResponse>(
    `/companies/${companyId}/services`,
  );
  return normalizeArrayResponse(response.data);
}

export async function listCompanyProfessionalServices(
  companyId: string,
  serviceId?: string,
): Promise<ProfessionalServiceLink[]> {
  const response = await api.get<ProfessionalServicesResponse>(
    `/companies/${companyId}/professional-services`,
    { params: serviceId ? { serviceId } : undefined },
  );

  return normalizeArrayResponse(response.data as ProfessionalServicesResponse);
}

export async function getProfessionalServiceById(
  id: string,
): Promise<ProfessionalServiceLink> {
  const response = await api.get<ProfessionalServiceLink>(
    `/professional-services/${id}`,
  );
  return response.data;
}

export async function createProfessionalService(
  payload: CreateProfessionalServicePayload,
): Promise<ProfessionalServiceLink> {
  const response = await api.post<ProfessionalServiceLink>(
    "/professional-services",
    payload,
  );
  return response.data;
}

export async function updateProfessionalService(
  id: string,
  payload: UpdateProfessionalServicePayload,
): Promise<ProfessionalServiceLink> {
  const response = await api.patch<ProfessionalServiceLink>(
    `/professional-services/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteProfessionalService(
  id: string,
): Promise<ProfessionalServiceLink> {
  const response = await api.delete<ProfessionalServiceLink>(
    `/professional-services/${id}`,
  );
  return response.data;
}
