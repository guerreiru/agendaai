export type Availability = {
  id: string;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type CreateAvailabilityPayload = {
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type BatchAvailabilitySlotPayload = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type CreateBatchAvailabilityPayload = {
  professionalId: string;
  slots: BatchAvailabilitySlotPayload[];
};

export type UpdateAvailabilityPayload = {
  weekday?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
};

export type Slot = {
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
};

export type AvailabilityExceptionType = "BLOCK" | "BREAK";

export type AvailabilityException = {
  id: string;
  professionalId: string;
  type: AvailabilityExceptionType;
  startDate: string;
  endDate: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  isActive?: boolean;
};

export type CreateAvailabilityExceptionPayload = {
  professionalId: string;
  type: AvailabilityExceptionType;
  startDate: string;
  endDate: string;
  title: string;
  description?: string;
};

export type UpdateAvailabilityExceptionPayload = {
  type?: AvailabilityExceptionType;
  startDate?: string;
  endDate?: string;
  title?: string;
  description?: string;
};
