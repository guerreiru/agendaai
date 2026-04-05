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
