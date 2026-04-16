import type { AppointmentStatus } from "../../../types/booking";
import type {
  AppointmentTransitionVariantMap,
  StatusFilter,
  AppointmentStatusTransitionMap,
  TerminalAppointmentStatus,
} from "./types";

export const TRANSITION_LABEL: AppointmentStatusTransitionMap = {
  CONFIRMED: "Confirmar",
  REJECTED: "Rejeitar",
  COMPLETED: "Marcar concluído",
  NO_SHOW: "Marcar não compareceu",
};

export const TRANSITION_CLASS: AppointmentTransitionVariantMap = {
  CONFIRMED: "success",
  REJECTED: "destructive",
  COMPLETED: "default",
  NO_SHOW: "warning",
};

export const TERMINAL_STATUSES: TerminalAppointmentStatus = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "NO_SHOW",
];

export const APPOINTMENT_STATUSES_OPTIONS: {
  label: string;
  value: StatusFilter;
}[] = [
  { label: "Todos os status", value: "ALL" },
  { label: "Agendados", value: "SCHEDULED" },
  {
    label: "Aguardando confirmação do cliente",
    value: "PENDING_CLIENT_CONFIRMATION",
  },
  {
    label: "Aguardando confirmação do profissional",
    value: "PENDING_PROFESSIONAL_CONFIRMATION",
  },
  { label: "Confirmados", value: "CONFIRMED" },
  { label: "Concluídos", value: "COMPLETED" },
  { label: "Cancelados", value: "CANCELLED" },
  { label: "Rejeitados", value: "REJECTED" },
  { label: "Não compareceu", value: "NO_SHOW" },
];

export const PERIOD_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "Todos os períodos", value: "ALL" },
  { label: "Hoje", value: "TODAY" },
  { label: "Próximos 7 dias", value: "NEXT_7_DAYS" },
  { label: "Este mês", value: "THIS_MONTH" },
];

export function getSafeTransitions(
  status: AppointmentStatus,
): AppointmentStatus[] {
  if (
    status === "PENDING_CLIENT_CONFIRMATION" ||
    status === "PENDING_PROFESSIONAL_CONFIRMATION"
  ) {
    return ["CONFIRMED", "REJECTED"];
  }
  if (status === "CONFIRMED") return ["COMPLETED", "NO_SHOW"];
  if (status === "SCHEDULED") return ["CONFIRMED"];
  return [];
}
