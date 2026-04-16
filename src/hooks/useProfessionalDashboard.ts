import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApiError } from "./useApiError";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";
import { getProfessionalDashboardMe, toApiError } from "../services/api";
import {
  confirmAppointment,
  listMyAppointments,
  rejectAppointment,
  updateAppointmentStatus,
} from "../services/api/appointments";
import { listCompanyServices } from "../services/api/services";
import type { Appointment } from "../types/booking";
import type { ProfessionalDashboardResponse } from "../types/dashboard";
import { appointmentStart } from "../utils/professionalAgenda";
import { logError } from "../utils/logger";

export type PeriodFilter = "TODAY" | "NEXT_7_DAYS" | "THIS_MONTH" | "ALL";
export type StatusFilter =
  | "ALL"
  | "PENDING_PROFESSIONAL"
  | "PENDING_CLIENT"
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "NO_SHOW";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function matchesPeriodFilter(item: Appointment, periodFilter: PeriodFilter) {
  if (periodFilter === "ALL") {
    return true;
  }

  const itemDate = parseDateKey(item.date);
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (periodFilter === "TODAY") {
    return itemDate.getTime() === todayStart.getTime();
  }

  if (periodFilter === "NEXT_7_DAYS") {
    const sevenDaysAhead = new Date(todayStart);
    sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
    return itemDate >= todayStart && itemDate <= sevenDaysAhead;
  }

  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return itemDate >= todayStart && itemDate <= monthEnd;
}

function matchesStatusFilter(item: Appointment, statusFilter: StatusFilter) {
  if (statusFilter === "ALL") {
    return true;
  }

  if (statusFilter === "PENDING_PROFESSIONAL") {
    return (
      item.status === "PENDING_PROFESSIONAL_CONFIRMATION" &&
      item.pendingApprovalFrom === "PROFESSIONAL"
    );
  }

  if (statusFilter === "PENDING_CLIENT") {
    return (
      item.status === "PENDING_CLIENT_CONFIRMATION" &&
      item.pendingApprovalFrom === "CLIENT"
    );
  }

  return item.status === statusFilter;
}

type AppointmentsQueryData = {
  appointments: Appointment[];
  serviceNameById: Record<string, string>;
};

const PROFESSIONAL_APPOINTMENTS_QUERY_KEY = [
  "professional",
  "appointments",
  "from-today",
] as const;
const PROFESSIONAL_DASHBOARD_QUERY_KEY = ["professional", "dashboard"] as const;

export function useProfessionalDashboard() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const handleApiError = useApiError();
  const { toast, showToast } = useToast();

  const [error, setError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isDashboardNotFound, setIsDashboardNotFound] = useState(false);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("TODAY");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (user && user.role !== "PROFESSIONAL") {
      navigate("/forbidden", { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const isProfessionalUser = user?.role === "PROFESSIONAL";
  const isQueryEnabled = isAuthenticated && isProfessionalUser;

  const {
    data: appointmentsData,
    error: appointmentsQueryError,
    isLoading: isLoading,
    refetch: refetchAppointments,
  } = useQuery<AppointmentsQueryData>({
    queryKey: PROFESSIONAL_APPOINTMENTS_QUERY_KEY,
    enabled: isQueryEnabled,
    queryFn: async () => {
      const todayStartDate = toDateKey(new Date());
      const appointments = await listMyAppointments(todayStartDate, undefined);

      const companyIds = Array.from(
        new Set(appointments.map((item) => item.companyId)),
      );
      const serviceNameById: Record<string, string> = {};

      await Promise.allSettled(
        companyIds.map(async (companyId) => {
          const services = await listCompanyServices(companyId);
          for (const service of services) {
            serviceNameById[service.id] = service.name;
          }
        }),
      );

      return {
        appointments,
        serviceNameById,
      };
    },
  });

  const {
    data: dashboardMetrics,
    error: dashboardQueryError,
    isLoading: isDashboardLoading,
    refetch: refetchDashboardMetrics,
  } = useQuery<ProfessionalDashboardResponse>({
    queryKey: PROFESSIONAL_DASHBOARD_QUERY_KEY,
    enabled: isQueryEnabled,
    queryFn: getProfessionalDashboardMe,
  });

  useEffect(() => {
    if (!appointmentsQueryError) {
      setError(null);
      return;
    }

    const result = handleApiError(appointmentsQueryError);
    if (!result) {
      return;
    }

    setError(result.message);
  }, [appointmentsQueryError, handleApiError]);

  useEffect(() => {
    if (!dashboardQueryError) {
      setDashboardError(null);
      setIsDashboardNotFound(false);
      return;
    }

    const apiError = toApiError(dashboardQueryError);

    logError("Falha ao carregar dashboard do profissional", {
      statusCode: apiError.statusCode,
      details: apiError.details,
    });

    const result = handleApiError(dashboardQueryError);
    if (!result) {
      return;
    }

    if (result.type === "notFound") {
      setIsDashboardNotFound(true);
      setDashboardError(null);
      return;
    }

    if (result.type === "serverError") {
      showToast("Não foi possível carregar métricas do profissional.");
    }

    setDashboardError(result.message);
    setIsDashboardNotFound(false);
  }, [dashboardQueryError, handleApiError, showToast]);

  const appointments = appointmentsData?.appointments ?? [];
  const serviceNameById = appointmentsData?.serviceNameById ?? {};

  const loadDashboardMetrics = useCallback(async () => {
    await refetchDashboardMetrics();
  }, [refetchDashboardMetrics]);

  const filtered = useMemo(() => {
    return appointments.filter((item) => {
      if (!matchesPeriodFilter(item, periodFilter)) {
        return false;
      }

      if (!matchesStatusFilter(item, statusFilter)) {
        return false;
      }

      const query = search.trim().toLowerCase();
      if (query) {
        const haystack =
          `${item.client?.name ?? ""} ${item.client?.email ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, periodFilter, search, statusFilter]);

  const agendaByDay = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();

    for (const item of filtered) {
      const key = item.date.slice(0, 10);
      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(
        key,
        current.sort(
          (a, b) =>
            appointmentStart(a).getTime() - appointmentStart(b).getTime(),
        ),
      );
    }

    return Array.from(grouped.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [filtered]);

  const handleCriticalAction = useCallback(
    async (appointmentId: string, action: () => Promise<void>) => {
      setIsMutatingId(appointmentId);
      try {
        await action();
        await refetchAppointments();
        showToast("Ação realizada com sucesso.");
      } catch (e) {
        const result = handleApiError(e);
        if (!result) {
          return;
        }
        showToast(result.message);
      } finally {
        setIsMutatingId(null);
      }
    },
    [handleApiError, refetchAppointments, showToast],
  );

  const confirmAppointmentById = useCallback(
    async (appointmentId: string) => {
      await handleCriticalAction(appointmentId, async () => {
        await confirmAppointment(appointmentId);
      });
    },
    [handleCriticalAction],
  );

  const completeAppointmentById = useCallback(
    async (appointmentId: string) => {
      await handleCriticalAction(appointmentId, async () => {
        await updateAppointmentStatus(appointmentId, "COMPLETED");
      });
    },
    [handleCriticalAction],
  );

  const noShowAppointmentById = useCallback(
    async (appointmentId: string) => {
      await handleCriticalAction(appointmentId, async () => {
        await updateAppointmentStatus(appointmentId, "NO_SHOW");
      });
    },
    [handleCriticalAction],
  );

  const rejectAppointmentById = useCallback(
    async (appointmentId: string) => {
      await handleCriticalAction(appointmentId, async () => {
        await rejectAppointment(appointmentId);
      });
    },
    [handleCriticalAction],
  );

  const clearFilters = useCallback(() => {
    setPeriodFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
  }, []);

  const retryAll = useCallback(async () => {
    await Promise.all([refetchAppointments(), refetchDashboardMetrics()]);
  }, [refetchAppointments, refetchDashboardMetrics]);

  return {
    agendaByDay,
    appointments,
    clearFilters,
    completeAppointmentById,
    confirmAppointmentById,
    dashboardError,
    dashboardMetrics,
    error,
    filtered,
    isDashboardLoading,
    isDashboardNotFound,
    isLoading,
    isMutatingId,
    loadDashboardMetrics,
    noShowAppointmentById,
    periodFilter,
    rejectAppointmentById,
    retryAll,
    search,
    serviceNameById,
    setPeriodFilter,
    setSearch,
    setStatusFilter,
    statusFilter,
    toast,
  };
}
