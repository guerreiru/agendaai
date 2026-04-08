import type { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import {
	cancelAppointment,
	listCompanyAppointments,
	updateAppointmentStatus,
} from "../../services/api/appointments";
import { listCompanyServices } from "../../services/api/services";
import type { Appointment, AppointmentStatus } from "../../types/booking";
import { getUserCompanyId } from "../../utils/company";
import { formatCurrency } from "../../utils/currency";
import { formatDateGroupLabel, formatDateShort } from "../../utils/formatDate";
import { sanitizeUserInput } from "../../utils/sanitize";

// ─── types ────────────────────────────────────────────────────────────────────

type PeriodFilter = "ALL" | "TODAY" | "NEXT_7_DAYS" | "THIS_MONTH";
type StatusFilter =
	| "ALL"
	| "PENDING"
	| "CONFIRMED"
	| "COMPLETED"
	| "CANCELLED"
	| "REJECTED"
	| "NO_SHOW";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AppointmentStatus, string> = {
	PENDING_PROFESSIONAL_CONFIRMATION: "Aguardando profissional",
	PENDING_CLIENT_CONFIRMATION: "Aguardando cliente",
	CONFIRMED: "Confirmado",
	SCHEDULED: "Agendado",
	COMPLETED: "Concluído",
	CANCELLED: "Cancelado",
	REJECTED: "Rejeitado",
	NO_SHOW: "Não compareceu",
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
	PENDING_PROFESSIONAL_CONFIRMATION:
		"bg-yellow-100 text-yellow-800 border-yellow-300",
	PENDING_CLIENT_CONFIRMATION: "bg-sky-100 text-sky-800 border-sky-300",
	CONFIRMED: "bg-green-100 text-green-800 border-green-300",
	SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
	COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
	CANCELLED: "bg-gray-100 text-gray-700 border-gray-300",
	REJECTED: "bg-red-100 text-red-700 border-red-300",
	NO_SHOW: "bg-orange-100 text-orange-700 border-orange-300",
};

const TRANSITION_LABEL: Partial<Record<AppointmentStatus, string>> = {
	CONFIRMED: "Confirmar",
	COMPLETED: "Marcar concluído",
	NO_SHOW: "Marcar não compareceu",
};

const TRANSITION_CLASS: Partial<Record<AppointmentStatus, string>> = {
	CONFIRMED: "bg-green-600 text-white hover:bg-green-700",
	COMPLETED: "bg-emerald-600 text-white hover:bg-emerald-700",
	NO_SHOW: "bg-orange-500 text-white hover:bg-orange-600",
};

const TERMINAL_STATUSES: AppointmentStatus[] = [
	"COMPLETED",
	"CANCELLED",
	"REJECTED",
	"NO_SHOW",
];

function appointmentDate(a: Appointment): Date {
	return new Date(`${a.date.slice(0, 10)}T${a.startTime}:00`);
}

function getSafeTransitions(status: AppointmentStatus): AppointmentStatus[] {
	if (status === "CONFIRMED") return ["COMPLETED", "NO_SHOW"];
	if (status === "SCHEDULED") return ["CONFIRMED"];
	return [];
}

function getErrorMessage(error: unknown): string {
	const axiosError = error as AxiosError<{ message?: string }>;
	const msg = axiosError.response?.data?.message;
	if (msg) return msg;
	const status = axiosError.response?.status;
	if (status === 403) return "Sem permissão para agir nesse agendamento.";
	if (status === 404) return "Agendamento não encontrado.";
	if (status === 400) return "Ação inválida para o estado atual.";
	return "Não foi possível concluir a ação. Tente novamente.";
}

// ─── appointment card ─────────────────────────────────────────────────────────

interface AppointmentCardProps {
	appointment: Appointment;
	serviceName: string;
	onRefresh: () => void;
}

function AppointmentCard({
	appointment,
	serviceName,
	onRefresh,
}: AppointmentCardProps) {
	const [isActing, setIsActing] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);

	const isTerminal = TERMINAL_STATUSES.includes(appointment.status);
	const canCancel = !isTerminal;
	const transitions = getSafeTransitions(appointment.status);

	const dateLabel = formatDateShort(appointment.date);

	async function handleTransition(status: AppointmentStatus) {
		setIsActing(true);
		setActionError(null);
		try {
			await updateAppointmentStatus(appointment.id, status);
			onRefresh();
		} catch (e) {
			setActionError(getErrorMessage(e));
		} finally {
			setIsActing(false);
		}
	}

	async function handleCancel() {
		setIsActing(true);
		setActionError(null);
		try {
			await cancelAppointment(appointment.id);
			onRefresh();
		} catch (e) {
			setActionError(getErrorMessage(e));
		} finally {
			setIsActing(false);
			setShowCancelConfirm(false);
		}
	}

	const isPending = appointment.status.startsWith("PENDING");

	return (
		<div
			className={`rounded-lg border bg-white p-5 space-y-3 ${
				isPending ? "border-yellow-400 shadow-md" : "border-gray-200"
			}`}
		>
			{/* header */}
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 space-y-0.5">
					<p className="truncate font-semibold text-gray-900">
						{sanitizeUserInput(serviceName)}
					</p>
					<p className="text-sm text-gray-500">
						Cliente:{" "}
						<span className="text-gray-700">
							{sanitizeUserInput(appointment.client?.name ?? "—")}
						</span>
					</p>
					<p className="text-sm text-gray-500">
						Profissional:{" "}
						<span className="text-gray-700">
							{sanitizeUserInput(appointment.professional?.name ?? "—")}
						</span>
					</p>
				</div>
				<span
					className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-semibold ${STATUS_CLASS[appointment.status]}`}
				>
					{STATUS_LABEL[appointment.status]}
				</span>
			</div>

			{/* info grid */}
			<div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
				<div>
					<p className="text-gray-500">Data</p>
					<p className="font-medium text-gray-900">{dateLabel}</p>
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

			{/* rejection reason */}
			{appointment.status === "REJECTED" && appointment.rejectionReason && (
				<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
					<span className="font-semibold">Motivo: </span>
					{appointment.rejectionReason}
				</div>
			)}

			{actionError && <p className="text-sm text-red-600">{actionError}</p>}

			{/* status transitions */}
			{transitions.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{transitions.map((t) => (
						<button
							type="button"
							key={t}
							disabled={isActing}
							onClick={() => void handleTransition(t)}
							className={`rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${TRANSITION_CLASS[t] ?? ""}`}
						>
							{isActing ? "..." : (TRANSITION_LABEL[t] ?? t)}
						</button>
					))}
				</div>
			)}

			{/* cancel */}
			{canCancel &&
				(showCancelConfirm ? (
					<div className="flex items-center gap-3 text-sm">
						<span className="text-gray-600">Confirmar cancelamento?</span>
						<button
							type="button"
							disabled={isActing}
							onClick={() => void handleCancel()}
							className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
						>
							{isActing ? "..." : "Sim, cancelar"}
						</button>
						<button
							type="button"
							disabled={isActing}
							onClick={() => setShowCancelConfirm(false)}
							className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
						>
							Voltar
						</button>
					</div>
				) : (
					<div className="flex justify-end">
						<button
							type="button"
							disabled={isActing}
							onClick={() => setShowCancelConfirm(true)}
							className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
						>
							Cancelar agendamento
						</button>
					</div>
				))}
		</div>
	);
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function OwnerAppointmentsPage() {
	const { user } = useAuth();
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
			const startsAt = appointmentDate(a);

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

			if (statusFilter === "PENDING" && !a.status.startsWith("PENDING"))
				return false;
			if (statusFilter === "CONFIRMED" && a.status !== "CONFIRMED")
				return false;
			if (statusFilter === "COMPLETED" && a.status !== "COMPLETED")
				return false;
			if (statusFilter === "CANCELLED" && a.status !== "CANCELLED")
				return false;
			if (statusFilter === "REJECTED" && a.status !== "REJECTED") return false;
			if (statusFilter === "NO_SHOW" && a.status !== "NO_SHOW") return false;

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
			(a, b) => appointmentDate(a).getTime() - appointmentDate(b).getTime(),
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

	return (
		<section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			{/* page header */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Agendamentos</h1>
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

			{/* filters */}
			<div className="flex flex-wrap gap-3">
				<select
					value={periodFilter}
					onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
					className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
				>
					<option value="ALL">Todos os períodos</option>
					<option value="TODAY">Hoje</option>
					<option value="NEXT_7_DAYS">Próximos 7 dias</option>
					<option value="THIS_MONTH">Este mês</option>
				</select>

				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
					className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
				>
					<option value="ALL">Todos os status</option>
					<option value="PENDING">Pendentes</option>
					<option value="CONFIRMED">Confirmados</option>
					<option value="COMPLETED">Concluídos</option>
					<option value="CANCELLED">Cancelados</option>
					<option value="REJECTED">Rejeitados</option>
					<option value="NO_SHOW">Não compareceu</option>
				</select>

				<FormField
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar por cliente, profissional ou serviço..."
				/>
			</div>

			{/* error */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			{/* loading */}
			{isLoading && (
				<div className="grid place-items-center py-16 text-sm text-slate-500">
					Carregando agendamentos...
				</div>
			)}

			{/* empty */}
			{!isLoading && !error && filtered.length === 0 && (
				<div className="grid place-items-center py-16 text-sm text-slate-500">
					Nenhum agendamento encontrado.
				</div>
			)}

			{/* grouped list */}
			{!isLoading &&
				grouped.map(({ key, label, items }) => (
					<div key={key} className="space-y-3">
						<h2 className="border-b border-slate-100 pb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
							{label}
						</h2>
						<div className="space-y-3">
							{items.map((a) => (
								<AppointmentCard
									key={a.id}
									appointment={a}
									serviceName={serviceNameById[a.serviceId] ?? a.serviceId}
									onRefresh={() => void load()}
								/>
							))}
						</div>
					</div>
				))}
		</section>
	);
}
