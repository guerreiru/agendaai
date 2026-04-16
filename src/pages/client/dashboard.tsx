import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { AppointmentDayHeader } from "../../components/ui/AppointmentDayHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/PageLoader";
import { listMyAppointments } from "../../services/api/appointments";
import type { Appointment } from "../../types/booking";
import { ACTIVE_STATUSES, HISTORY_STATUSES } from "../../utils/constants";
import { groupAppointmentsByDay } from "../../utils/appointmentGroup";
import { formatAgendaDayLabel } from "../../utils/professionalAgenda";
import { AppointmentCard } from "./components/AppointmentCard";

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

  const activeByDay = useMemo(() => groupAppointmentsByDay(active), [active]);
  const historyByDay = useMemo(
    () => groupAppointmentsByDay(history),
    [history],
  );

  if (isLoading) {
    return <PageLoader message="Carregando agendamentos..." />;
  }

  if (error) {
    return (
      <AlertBanner
        message={error}
        action={{ label: "Tentar novamente", onClick: () => void load() }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-950">Meus Agendamentos</h1>

      <section className="space-y-4">
        {activeByDay.length === 0 ? (
          <EmptyState message="Nenhum agendamento ativo no momento." />
        ) : (
          activeByDay.map(([day, items]) => (
            <div key={day} className="space-y-3">
              <AppointmentDayHeader
                dayLabel={formatAgendaDayLabel(day)}
                count={items.length}
              />
              <div className="space-y-3">
                {items.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onAction={load} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Histórico
        </h2>
        {historyByDay.length === 0 ? (
          <EmptyState message="Nenhum histórico ainda." />
        ) : (
          historyByDay.map(([day, items]) => (
            <div key={day} className="space-y-3">
              <AppointmentDayHeader
                dayLabel={formatAgendaDayLabel(day)}
                count={items.length}
              />
              <div className="space-y-3">
                {items.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onAction={load} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
