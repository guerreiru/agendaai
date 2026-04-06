import type { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  cancelAppointment,
  confirmAppointment,
  getAppointmentById,
  listMyAppointments,
  rejectAppointment,
  updateAppointmentStatus,
} from "../../services/api/appointments";
import { listCompanyServices } from "../../services/api/services";
import type { Appointment, AppointmentStatus } from "../../types/booking";
import { formatCurrency } from "../../utils/currency";
import { FormField } from "../../components/ui/formField";

type PeriodFilter = "TODAY" | "NEXT_7_DAYS" | "THIS_MONTH" | "ALL";
type StatusFilter =
  | "ALL"
  | "PENDING_PROFESSIONAL"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "NO_SHOW";
type ViewMode = "LIST" | "AGENDA";

function toStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    PENDING_PROFESSIONAL_CONFIRMATION: "Aguardando sua confirmação",
    PENDING_CLIENT_CONFIRMATION: "Aguardando cliente",
    CONFIRMED: "Confirmado",
    SCHEDULED: "Agendado",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
    REJECTED: "Rejeitado",
    NO_SHOW: "Não compareceu",
  };
  return labels[status];
}

function toStatusClasses(status: AppointmentStatus): string {
  if (status === "PENDING_PROFESSIONAL_CONFIRMATION") {
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  }
  if (status === "PENDING_CLIENT_CONFIRMATION") {
    return "bg-sky-100 text-sky-800 border-sky-300";
  }
  if (status === "CONFIRMED") {
    return "bg-green-100 text-green-800 border-green-300";
  }
  if (status === "SCHEDULED") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (status === "COMPLETED") {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
  if (status === "CANCELLED") {
    return "bg-gray-100 text-gray-700 border-gray-300";
  }
  if (status === "REJECTED") {
    return "bg-red-100 text-red-700 border-red-300";
  }
  return "bg-orange-100 text-orange-700 border-orange-300";
}

function appointmentStart(appointment: Appointment): Date {
  return new Date(
    `${appointment.date.slice(0, 10)}T${appointment.startTime}:00`,
  );
}

function appointmentEnd(appointment: Appointment): Date {
  return new Date(`${appointment.date.slice(0, 10)}T${appointment.endTime}:00`);
}

function formatDateTimeRange(appointment: Appointment): string {
  const d = new Date(appointment.date);
  const day = d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${day} • ${appointment.startTime} - ${appointment.endTime}`;
}

function getSafeTransitions(appointment: Appointment): AppointmentStatus[] {
  if (appointment.status === "CONFIRMED") {
    return ["COMPLETED", "NO_SHOW", "CANCELLED"];
  }
  if (appointment.status === "SCHEDULED") {
    return ["CONFIRMED", "CANCELLED"];
  }
  return [];
}

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  const status = axiosError.response?.status;
  const backendMessage = axiosError.response?.data?.message;

  if (backendMessage) {
    return backendMessage;
  }

  if (status === 409) {
    return "Horário não está mais disponível.";
  }

  if (status === 403) {
    return "Sem permissão para agir nesse agendamento.";
  }

  if (status === 404) {
    return "Agendamento não encontrado.";
  }

  if (status === 400) {
    return "Ação inválida para o estado atual do agendamento.";
  }

  return "Não foi possível concluir a ação. Tente novamente.";
}

export function ProfessionalDashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [serviceNameById, setServiceNameById] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailAppointment, setDetailAppointment] =
    useState<Appointment | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadAppointments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listMyAppointments();
      setAppointments(data);

      const companyIds = Array.from(
        new Set(data.map((item) => item.companyId)),
      );
      const serviceMap: Record<string, string> = {};

      await Promise.allSettled(
        companyIds.map(async (companyId) => {
          const services = await listCompanyServices(companyId);
          for (const service of services) {
            serviceMap[service.id] = service.name;
          }
        }),
      );

      setServiceNameById(serviceMap);
    } catch (e) {
      const status = (e as AxiosError).response?.status;
      if (status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (user && user.role !== "PROFESSIONAL") {
      navigate("/forbidden", { replace: true });
      return;
    }

    void loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const sevenDaysAhead = new Date(todayStart);
    sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    return appointments.filter((item) => {
      const startsAt = appointmentStart(item);

      if (periodFilter === "TODAY") {
        const sameDay = startsAt.toDateString() === todayStart.toDateString();
        if (!sameDay) {
          return false;
        }
      }

      if (periodFilter === "NEXT_7_DAYS") {
        if (startsAt < todayStart || startsAt > sevenDaysAhead) {
          return false;
        }
      }

      if (periodFilter === "THIS_MONTH") {
        if (startsAt < todayStart || startsAt > monthEnd) {
          return false;
        }
      }

      if (statusFilter !== "ALL") {
        if (
          statusFilter === "PENDING_PROFESSIONAL" &&
          !(
            item.status === "PENDING_PROFESSIONAL_CONFIRMATION" &&
            item.pendingApprovalFrom === "PROFESSIONAL"
          )
        ) {
          return false;
        }

        if (statusFilter === "CONFIRMED" && item.status !== "CONFIRMED") {
          return false;
        }

        if (statusFilter === "COMPLETED" && item.status !== "COMPLETED") {
          return false;
        }

        if (statusFilter === "CANCELLED" && item.status !== "CANCELLED") {
          return false;
        }

        if (statusFilter === "REJECTED" && item.status !== "REJECTED") {
          return false;
        }

        if (statusFilter === "NO_SHOW" && item.status !== "NO_SHOW") {
          return false;
        }
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
  }, [appointments, periodFilter, statusFilter, search]);

  const sections = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const finalStatuses: AppointmentStatus[] = [
      "COMPLETED",
      "CANCELLED",
      "REJECTED",
      "NO_SHOW",
    ];

    const requiresAction = filtered.filter(
      (a) =>
        a.status === "PENDING_PROFESSIONAL_CONFIRMATION" &&
        a.pendingApprovalFrom === "PROFESSIONAL",
    );

    const upcoming = filtered.filter((a) => {
      if (!["SCHEDULED", "CONFIRMED"].includes(a.status)) {
        return false;
      }
      return appointmentStart(a) >= todayStart;
    });

    const history = filtered.filter((a) => {
      if (finalStatuses.includes(a.status)) {
        return true;
      }
      return appointmentStart(a) < todayStart;
    });

    return { requiresAction, upcoming, history };
  }, [filtered]);

  const agendaByDay = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();

    for (const item of filtered) {
      const key = new Date(item.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        weekday: "short",
      });

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

    return Array.from(grouped.entries());
  }, [filtered]);

  const handleCriticalAction = async (
    appointmentId: string,
    action: () => Promise<void>,
  ) => {
    setIsMutatingId(appointmentId);
    try {
      await action();
      await loadAppointments();
      setToast("Ação realizada com sucesso.");
    } catch (e) {
      if ((e as AxiosError).response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setToast(getErrorMessage(e));
    } finally {
      setIsMutatingId(null);
    }
  };

  const openDetails = async (appointmentId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailAppointment(null);

    try {
      const detail = await getAppointmentById(appointmentId);
      setDetailAppointment(detail);
    } catch (e) {
      if ((e as AxiosError).response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setToast(getErrorMessage(e));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const clearFilters = () => {
    setPeriodFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
  };

  const renderCard = (appointment: Appointment) => {
    const canApproveOrReject =
      appointment.status === "PENDING_PROFESSIONAL_CONFIRMATION" &&
      appointment.pendingApprovalFrom === "PROFESSIONAL";

    const safeTransitions = getSafeTransitions(appointment);
    const now = new Date();
    const canCloseAsDoneOrNoShow =
      appointment.status === "CONFIRMED" && appointmentEnd(appointment) <= now;
    const canCancel =
      appointment.status !== "COMPLETED" && appointment.status !== "NO_SHOW";

    return (
      <article
        key={appointment.id}
        className={`rounded-xl border bg-white p-4 shadow-sm ${
          canApproveOrReject ? "border-yellow-300" : "border-slate-200"
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">
              {appointment.client?.name}
            </p>
            <p className="text-xs text-slate-600">
              {appointment.client?.email}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Empresa: {appointment.company?.name}
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toStatusClasses(appointment.status)}`}
          >
            {toStatusLabel(appointment.status)}
          </span>
        </div>

        <div className="space-y-1 text-sm text-slate-700">
          <p>{formatDateTimeRange(appointment)}</p>
          <p>
            Serviço:{" "}
            {serviceNameById[appointment.serviceId] ?? appointment.serviceId}
          </p>
          <p>Valor: {formatCurrency(appointment.price)}</p>
        </div>

        {appointment.status === "REJECTED" && appointment.rejectionReason && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            Motivo da rejeição: {appointment.rejectionReason}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => void openDetails(appointment.id)}
            type="button"
          >
            Ver detalhes
          </button>

          {canApproveOrReject && (
            <>
              <button
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                disabled={isMutatingId === appointment.id}
                onClick={() =>
                  void handleCriticalAction(appointment.id, async () => {
                    await confirmAppointment(appointment.id);
                  })
                }
                type="button"
              >
                Confirmar
              </button>

              {rejectingId === appointment.id ? (
                <>
                  <FormField
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Motivo opcional"
                    type="text"
                    value={rejectReason}
                  />
                  <button
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    disabled={isMutatingId === appointment.id}
                    onClick={() =>
                      void handleCriticalAction(appointment.id, async () => {
                        await rejectAppointment(
                          appointment.id,
                          rejectReason || undefined,
                        );
                        setRejectingId(null);
                        setRejectReason("");
                      })
                    }
                    type="button"
                  >
                    Confirmar rejeição
                  </button>
                </>
              ) : (
                <button
                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  disabled={isMutatingId === appointment.id}
                  onClick={() => {
                    setRejectingId(appointment.id);
                    setRejectReason("");
                  }}
                  type="button"
                >
                  Rejeitar
                </button>
              )}
            </>
          )}

          {safeTransitions.includes("CONFIRMED") && (
            <button
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              disabled={isMutatingId === appointment.id}
              onClick={() =>
                void handleCriticalAction(appointment.id, async () => {
                  await updateAppointmentStatus(appointment.id, "CONFIRMED");
                })
              }
              type="button"
            >
              Marcar confirmado
            </button>
          )}

          {canCloseAsDoneOrNoShow && safeTransitions.includes("COMPLETED") && (
            <button
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              disabled={isMutatingId === appointment.id}
              onClick={() =>
                void handleCriticalAction(appointment.id, async () => {
                  await updateAppointmentStatus(appointment.id, "COMPLETED");
                })
              }
              type="button"
            >
              Marcar concluído
            </button>
          )}

          {canCloseAsDoneOrNoShow && safeTransitions.includes("NO_SHOW") && (
            <button
              className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              disabled={isMutatingId === appointment.id}
              onClick={() =>
                void handleCriticalAction(appointment.id, async () => {
                  await updateAppointmentStatus(appointment.id, "NO_SHOW");
                })
              }
              type="button"
            >
              Marcar não compareceu
            </button>
          )}

          {canCancel && (
            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              disabled={isMutatingId === appointment.id}
              onClick={() => {
                const confirmed = window.confirm(
                  "Deseja realmente cancelar este agendamento?",
                );
                if (!confirmed) {
                  return;
                }

                void handleCriticalAction(appointment.id, async () => {
                  await cancelAppointment(appointment.id);
                });
              }}
              type="button"
            >
              Cancelar
            </button>
          )}
        </div>
      </article>
    );
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Agenda do profissional
        </h1>
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
              key={i}
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-2xl font-bold text-red-800">
          Agenda do profissional
        </h1>
        <p className="text-red-700">{error}</p>
        <button
          className="w-fit rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          onClick={() => void loadAppointments()}
          type="button"
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {toast && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {toast}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            Agenda do profissional
          </h1>
          <div className="hidden items-center gap-2 md:flex">
            <button
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                viewMode === "LIST"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-700"
              }`}
              onClick={() => setViewMode("LIST")}
              type="button"
            >
              Lista
            </button>
            <button
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                viewMode === "AGENDA"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-700"
              }`}
              onClick={() => setViewMode("AGENDA")}
              type="button"
            >
              Agenda por dia
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            value={periodFilter}
          >
            <option value="TODAY">Hoje</option>
            <option value="NEXT_7_DAYS">Próximos 7 dias</option>
            <option value="THIS_MONTH">Este mês</option>
            <option value="ALL">Todos</option>
          </select>

          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            value={statusFilter}
          >
            <option value="ALL">Todos os status</option>
            <option value="PENDING_PROFESSIONAL">
              Pendentes do profissional
            </option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="COMPLETED">Concluídos</option>
            <option value="CANCELLED">Cancelados</option>
            <option value="REJECTED">Rejeitados</option>
            <option value="NO_SHOW">Não compareceu</option>
          </select>

          <FormField
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome ou email"
            value={search}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          <p className="mb-3">Sem itens para os filtros atuais.</p>
          <button
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={clearFilters}
            type="button"
          >
            Limpar filtros
          </button>
        </div>
      ) : viewMode === "AGENDA" ? (
        <div className="hidden space-y-4 md:block">
          {agendaByDay.map(([day, items]) => (
            <div
              className="rounded-xl border border-slate-200 bg-white p-4"
              key={day}
            >
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
                {day}
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700">
              Requer ação
            </h2>
            {sections.requiresAction.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum item pendente de sua aprovação.
              </p>
            ) : (
              sections.requiresAction.map(renderCard)
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Próximos atendimentos
            </h2>
            {sections.upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum próximo atendimento.
              </p>
            ) : (
              sections.upcoming.map(renderCard)
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Histórico
            </h2>
            {sections.history.length === 0 ? (
              <p className="text-sm text-slate-500">
                Sem histórico para os filtros atuais.
              </p>
            ) : (
              sections.history.map(renderCard)
            )}
          </div>
        </div>
      )}

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Detalhes do agendamento
              </h3>
              <button
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                onClick={() => setDetailOpen(false)}
                type="button"
              >
                Fechar
              </button>
            </div>

            {detailLoading ? (
              <div className="space-y-2">
                <div className="h-4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 animate-pulse rounded bg-slate-100" />
              </div>
            ) : detailAppointment ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Cliente:</span>{" "}
                  {detailAppointment.client?.name} (
                  {detailAppointment.client?.email})
                </p>
                <p>
                  <span className="font-semibold">Empresa:</span>{" "}
                  {detailAppointment.company?.name}
                </p>
                <p>
                  <span className="font-semibold">Data/Hora:</span>{" "}
                  {formatDateTimeRange(detailAppointment)}
                </p>
                <p>
                  <span className="font-semibold">Status atual:</span>{" "}
                  {toStatusLabel(detailAppointment.status)}
                </p>
                <p>
                  <span className="font-semibold">Criado em:</span>{" "}
                  {new Date(detailAppointment.createdAt).toLocaleString(
                    "pt-BR",
                  )}
                </p>
                <p>
                  <span className="font-semibold">Atualizado em:</span>{" "}
                  {new Date(detailAppointment.updatedAt).toLocaleString(
                    "pt-BR",
                  )}
                </p>
                {detailAppointment.rejectionReason && (
                  <p className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700">
                    <span className="font-semibold">Motivo da rejeição:</span>{" "}
                    {detailAppointment.rejectionReason}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
