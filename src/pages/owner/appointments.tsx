import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { AppointmentDayHeader } from "../../components/ui/AppointmentDayHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { FormField } from "../../components/ui/formField";
import { Select } from "../../components/ui/select";
import { useAuth } from "../../hooks/useAuth";
import { listCompanyAppointments } from "../../services/api/appointments";
import { listCompanyServices } from "../../services/api/services";
import { queryKeys } from "../../services/queryKeys";
import type { Appointment } from "../../types/booking";
import { getUserCompanyId } from "../../utils/company";
import {
	appointmentDateTime,
	formatDateGroupLabel,
} from "../../utils/formatDate";
import {
	APPOINTMENT_STATUSES_OPTIONS,
	PERIOD_FILTER_OPTIONS,
} from "./appointments/constants";
import type { PeriodFilter, StatusFilter } from "./appointments/types";
import { AppointmentCard } from "./components/AppointmentCard";

export function OwnerAppointmentsPage() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const companyId = useMemo(() => getUserCompanyId(user), [user]);

	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [serviceNameById, setServiceNameById] = useState<
		Record<string, string>
	>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("ALL");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [search, setSearch] = useState("");

	const load = useCallback(async () => {
		if (!companyId) return;
		setIsLoading(true);
		setError(null);
		try {
			const [data, services] = await Promise.all([
				listCompanyAppointments(),
				listCompanyServices(companyId),
			]);
			setAppointments(data);
			const map: Record<string, string> = {};
			for (const s of services) {
				map[s.id] = s.name;
			}
			setServiceNameById(map);
		} catch {
			setError("Não foi possível carregar os agendamentos.");
		} finally {
			setIsLoading(false);
		}
	}, [companyId]);

	useEffect(() => {
		if (!companyId) {
			navigate("/owner/dashboard", { replace: true });
			return;
		}
		void load();
	}, [companyId, load, navigate]);

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

		return appointments.filter((a) => {
			const startsAt = appointmentDateTime(a.date, a.startTime);

			if (
				periodFilter === "TODAY" &&
				startsAt.toDateString() !== todayStart.toDateString()
			)
				return false;
			if (
				periodFilter === "NEXT_7_DAYS" &&
				(startsAt < todayStart || startsAt > sevenDaysAhead)
			)
				return false;
			if (
				periodFilter === "THIS_MONTH" &&
				(startsAt < todayStart || startsAt > monthEnd)
			)
				return false;

			if (statusFilter !== "ALL" && a.status !== statusFilter) return false;

			const query = search.trim().toLowerCase();
			if (query) {
				const haystack = [
					a.client?.name ?? "",
					a.client?.email ?? "",
					a.professional?.name ?? "",
					serviceNameById[a.serviceId] ?? "",
				]
					.join(" ")
					.toLowerCase();
				if (!haystack.includes(query)) return false;
			}

			return true;
		});
	}, [appointments, periodFilter, statusFilter, search, serviceNameById]);

	const grouped = useMemo(() => {
		const sorted = [...filtered].sort(
			(a, b) =>
				appointmentDateTime(a.date, a.startTime).getTime() -
				appointmentDateTime(b.date, b.startTime).getTime(),
		);
		const groups: { key: string; label: string; items: Appointment[] }[] = [];
		const seen = new Map<string, Appointment[]>();

		for (const a of sorted) {
			const key = a.date.slice(0, 10);
			if (!seen.has(key)) {
				const label = formatDateGroupLabel(key);
				const items: Appointment[] = [];
				seen.set(key, items);
				groups.push({ key, label, items });
			}
			seen.get(key)?.push(a);
		}
		return groups;
	}, [filtered]);

	const pendingCount = useMemo(
		() => appointments.filter((a) => a.status.startsWith("PENDING")).length,
		[appointments],
	);

	const refreshAfterMutation = useCallback(async () => {
		await load();

		if (companyId) {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.ownerDashboard(companyId),
			});
		}
	}, [companyId, load, queryClient]);

	return (
		<section className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-950">Agendamentos</h1>
					{pendingCount > 0 && (
						<p className="mt-0.5 text-sm text-yellow-700">
							{pendingCount}{" "}
							{pendingCount === 1
								? "aguardando confirmação"
								: "aguardando confirmação"}
						</p>
					)}
				</div>
				<button
					type="button"
					onClick={() => void load()}
					disabled={isLoading}
					className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
				>
					{isLoading ? "Carregando..." : "Atualizar"}
				</button>
			</div>

			<div className="flex flex-wrap gap-3">
				<Select
					value={periodFilter}
					onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
					options={PERIOD_FILTER_OPTIONS.map(({ label, value }) => ({
						label,
						value,
					}))}
				/>

				<Select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
					options={APPOINTMENT_STATUSES_OPTIONS.map(({ label, value }) => ({
						label,
						value,
					}))}
				/>

				<FormField
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar por cliente, profissional ou serviço..."
				/>
			</div>

			{error && <AlertBanner message={error} />}

			{isLoading && <EmptyState message="Carregando agendamentos..." />}

			{!isLoading && !error && filtered.length === 0 && (
				<EmptyState message="Nenhum agendamento encontrado." />
			)}

			{!isLoading &&
				grouped.map(({ key, label, items }) => (
					<div key={key} className="space-y-3">
						<AppointmentDayHeader dayLabel={label} count={items.length} />
						<div className="space-y-3">
							{items.map((a) => (
								<AppointmentCard
									key={a.id}
									appointment={a}
									currentUserRole={user?.role}
									serviceName={serviceNameById[a.serviceId] ?? a.serviceId}
									onRefresh={() => void refreshAfterMutation()}
								/>
							))}
						</div>
					</div>
				))}
		</section>
	);
}
