import type {
  Availability,
  AvailabilityException,
  CreateAvailabilityExceptionPayload,
  CreateBatchAvailabilityPayload,
  CreateAvailabilityPayload,
  Slot,
  UpdateAvailabilityExceptionPayload,
  UpdateAvailabilityPayload,
} from "../../types/availability";
import { api } from "./client";

type AvailabilitiesResponse = Availability[] | { data?: Availability[] };
type SlotsResponse =
  | Slot[]
  | {
      data?: Slot[];
      slots?: Slot[];
    };

type ApiAvailabilityException = {
  id: string;
  professionalId: string;
  type: "BLOCK" | "BREAK";
  startDate?: string | null;
  endDate?: string | null;
  title?: string | null;
  description?: string | null;
  isActive?: boolean;
};

function toLocalDateParts(isoDate: string | null | undefined) {
  if (!isoDate) {
    return { date: "", time: null as string | null };
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return { date: isoDate.slice(0, 10), time: null as string | null };
  }

  const datePart = date.toISOString().slice(0, 10);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return { date: datePart, time: `${hours}:${minutes}` };
}

function mapApiAvailabilityException(
  exception: ApiAvailabilityException,
): AvailabilityException {
  const start = toLocalDateParts(exception.startDate);
  const end = toLocalDateParts(exception.endDate);

  return {
    id: exception.id,
    professionalId: exception.professionalId,
    type: exception.type,
    startDate: exception.startDate ?? "",
    endDate: exception.endDate ?? "",
    title: exception.title ?? "",
    description: exception.description ?? null,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    reason: exception.description ?? null,
    isActive: exception.isActive,
  };
}

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

export async function createBatchAvailabilities(
  payload: CreateBatchAvailabilityPayload,
): Promise<Availability[]> {
  const response = await api.post<AvailabilitiesResponse>(
    "/availabilities/batch",
    payload,
  );

  return normalizeArrayResponse(response.data);
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

export async function listProfessionalAvailabilityExceptions(
  professionalId: string,
): Promise<AvailabilityException[]> {
  const response = await api.get<
    ApiAvailabilityException[] | { data?: ApiAvailabilityException[] }
  >(`/professionals/${professionalId}/schedule-exceptions`);

  return normalizeArrayResponse(response.data).map(mapApiAvailabilityException);
}

export async function createAvailabilityException(
  payload: CreateAvailabilityExceptionPayload,
): Promise<AvailabilityException> {
  const { professionalId, ...body } = payload;
  const response = await api.post<ApiAvailabilityException>(
    `/professionals/${professionalId}/schedule-exceptions`,
    body,
  );

  return mapApiAvailabilityException(response.data);
}

export async function getAvailabilityExceptionById(
  id: string,
): Promise<AvailabilityException> {
  const response = await api.get<ApiAvailabilityException>(
    `/schedule-exceptions/${id}`,
  );

  return mapApiAvailabilityException(response.data);
}

export async function updateAvailabilityException(
  professionalId: string,
  id: string,
  payload: UpdateAvailabilityExceptionPayload,
): Promise<AvailabilityException> {
  const response = await api.patch<ApiAvailabilityException>(
    `/professionals/${professionalId}/schedule-exceptions/${id}`,
    payload,
  );

  return mapApiAvailabilityException(response.data);
}

export async function deleteAvailabilityException(
  professionalId: string,
  id: string,
): Promise<AvailabilityException> {
  const response = await api.delete<ApiAvailabilityException>(
    `/professionals/${professionalId}/schedule-exceptions/${id}`,
  );

  return mapApiAvailabilityException(response.data);
}
