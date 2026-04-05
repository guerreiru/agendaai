import { useState, useEffect, useCallback } from "react";
import type { Appointment, AppointmentStatus } from "../../types/booking";
import {
  listMyAppointments,
  confirmAppointment,
  rejectAppointment,
  cancelAppointment,
} from "../../services/api/appointments";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/formatDate";
import { sanitizeUserInput } from "../../utils/sanitize";

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING_CLIENT_CONFIRMATION: "Aguardando sua confirmação",
  PENDING_PROFESSIONAL_CONFIRMATION: "Aguardando confirmação do profissional",
  CONFIRMED: "Confirmado",
  SCHEDULED: "Agendado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
  REJECTED: "Rejeitado",
  NO_SHOW: "Não compareceu",
};

type BadgeVariant = "yellow" | "green" | "red" | "gray";

const STATUS_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  PENDING_CLIENT_CONFIRMATION: "yellow",
  PENDING_PROFESSIONAL_CONFIRMATION: "yellow",
  CONFIRMED: "green",
  SCHEDULED: "green",
  CANCELLED: "gray",
  COMPLETED: "gray",
  REJECTED: "red",
  NO_SHOW: "gray",
};

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  green: "bg-green-100 text-green-800 border-green-300",
  red: "bg-red-100 text-red-800 border-red-300",
  gray: "bg-gray-100 text-gray-700 border-gray-300",
};

const ACTIVE_STATUSES: AppointmentStatus[] = [
  "PENDING_CLIENT_CONFIRMATION",
  "PENDING_PROFESSIONAL_CONFIRMATION",
  "CONFIRMED",
  "SCHEDULED",
];

const HISTORY_STATUSES: AppointmentStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "NO_SHOW",
];

// ─── appointment card ────────────────────────────────────────────────────────

interface AppointmentCardProps {
  appointment: Appointment;
  onAction: () => void;
}

function AppointmentCard({ appointment, onAction }: AppointmentCardProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const variant = STATUS_VARIANT[appointment.status];

  const canConfirmReject =
    appointment.status === "PENDING_CLIENT_CONFIRMATION" &&
    appointment.pendingApprovalFrom === "CLIENT";

  const canCancel =
    appointment.status !== "COMPLETED" && appointment.status !== "NO_SHOW";

  const isHistory = HISTORY_STATUSES.includes(appointment.status);

  async function handleConfirm() {
    setIsActing(true);
    setActionError(null);
    try {
      await confirmAppointment(appointment.id);
      onAction();
    } catch {
      setActionError("Erro ao confirmar. Tente novamente.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleReject() {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setIsActing(true);
    setActionError(null);
    try {
      await rejectAppointment(appointment.id, rejectReason || undefined);
      onAction();
    } catch {
      setActionError("Erro ao rejeitar. Tente novamente.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    setIsActing(true);
    setActionError(null);
    try {
      await cancelAppointment(appointment.id);
      onAction();
    } catch {
      setActionError("Erro ao cancelar. Tente novamente.");
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div
      className={`rounded-lg border bg-white p-5 space-y-4 ${
        canConfirmReject ? "border-yellow-400 shadow-md" : "border-gray-200"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="font-semibold text-gray-900 text-base">
            {appointment.serviceId}
          </p>
          <p className="text-sm text-gray-500">
            Profissional: {sanitizeUserInput(appointment.professional.name)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-semibold ${VARIANT_CLASS[variant]}`}
        >
          {STATUS_LABEL[appointment.status]}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <p className="text-gray-500">Data</p>
          <p className="font-medium text-gray-900">
            {formatDate(appointment.date)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Horário</p>
          <p className="font-medium text-gray-900">
            {appointment.startTime} — {appointment.endTime}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Valor</p>
          <p className="font-medium text-green-700">
            {formatCurrency(appointment.price)}
          </p>
        </div>
      </div>

      {/* Rejection reason (history) */}
      {appointment.status === "REJECTED" && appointment.rejectionReason && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Motivo: </span>
          {appointment.rejectionReason}
        </div>
      )}

      {/* Action error */}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {/* Confirm / Reject */}
      {canConfirmReject && (
        <div className="space-y-2">
          {showRejectInput && (
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              placeholder="Motivo da rejeição (opcional)"
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          )}
          <div className="flex gap-3">
            <button
              onClick={() => void handleConfirm()}
              disabled={isActing}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isActing ? "..." : "✓ Confirmar"}
            </button>
            <button
              onClick={() => void handleReject()}
              disabled={isActing}
              className="flex-1 rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isActing
                ? "..."
                : showRejectInput
                  ? "Confirmar rejeição"
                  : "✕ Rejeitar"}
            </button>
          </div>
        </div>
      )}

      {/* Cancel button (for active, non-confirmable appointments) */}
      {!isHistory && !canConfirmReject && canCancel && (
        <div className="flex justify-end">
          <button
            onClick={() => void handleCancel()}
            disabled={isActing}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {isActing ? "Cancelando..." : "Cancelar agendamento"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── dashboard ───────────────────────────────────────────────────────────────

export function ClientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listMyAppointments();
      setAppointments(data);
    } catch {
      setError("Não foi possível carregar seus agendamentos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = appointments.filter((a) => ACTIVE_STATUSES.includes(a.status));
  const history = appointments.filter((a) =>
    HISTORY_STATUSES.includes(a.status),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-semibold">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Meus Agendamentos</h1>

      {/* Active / Upcoming */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Próximos e pendentes
        </h2>
        {active.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            Nenhum agendamento ativo no momento.
          </p>
        ) : (
          active.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onAction={load} />
          ))
        )}
      </section>

      {/* History */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Histórico
        </h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">Nenhum histórico ainda.</p>
        ) : (
          history.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onAction={load} />
          ))
        )}
      </section>
    </div>
  );
}
