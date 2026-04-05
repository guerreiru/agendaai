import { api } from "./client";
import type {
  Availability,
  CreateAvailabilityPayload,
  Slot,
  UpdateAvailabilityPayload,
} from "../../types/availability";

type AvailabilitiesResponse = Availability[] | { data?: Availability[] };
type SlotsResponse =
  | Slot[]
  | {
      data?: Slot[];
      slots?: Slot[];
    };

function normalizeArrayResponse<T>(payload: T[] | { data?: T[] }): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export async function listProfessionalAvailabilities(
  professionalId: string,
): Promise<Availability[]> {
  const response = await api.get<AvailabilitiesResponse>(
    `/professionals/${professionalId}/availabilities`,
  );

  return normalizeArrayResponse(response.data);
}

export async function createAvailability(
  payload: CreateAvailabilityPayload,
): Promise<Availability> {
  const response = await api.post<Availability>("/availabilities", payload);
  return response.data;
}

export async function updateAvailability(
  id: string,
  payload: UpdateAvailabilityPayload,
): Promise<Availability> {
  const response = await api.patch<Availability>(
    `/availabilities/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteAvailability(id: string): Promise<Availability> {
  const response = await api.delete<Availability>(`/availabilities/${id}`);
  return response.data;
}

export async function getAvailableSlots(params: {
  professionalId: string;
  serviceId: string;
  date: string;
}): Promise<Slot[]> {
  const response = await api.get<SlotsResponse>("/slots", { params });

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data.slots)) {
    return response.data.slots;
  }

  return normalizeArrayResponse(response.data);
}
