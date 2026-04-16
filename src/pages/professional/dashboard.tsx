import { Briefcase, CalendarDays, CircleDollarSign } from "lucide-react";
import { MetricCard } from "../../components/dashboard/MetricCard";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { FormField } from "../../components/ui/formField";
import {
	type PeriodFilter,
	type StatusFilter,
	useProfessionalDashboard,
} from "../../hooks/useProfessionalDashboard";
import { formatCurrency } from "../../utils/currency";
import { formatAgendaDayLabel } from "../../utils/professionalAgenda";
import { AgendaRow } from "./components/AgendaRow";

export function ProfessionalDashboardPage() {
	const {
		agendaByDay,
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
	} = useProfessionalDashboard();

	if (isLoading) {
		return (
			<section className="space-y-4">
				<h1 className="text-2xl font-bold text-gray-800">
					Agenda do profissional
				</h1>
				<div className="grid gap-3">
					{Array.from({ length: 5 }, (_, i) => i + 1).map((skeleton) => (
						<div
							className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
							key={`loading-card-${skeleton}`}
						/>
					))}
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="space-y-4">
				<h1 className="text-2xl font-bold text-gray-800">
					Agenda do profissional
				</h1>
				<AlertBanner
					message={error}
					action={{ label: "Tentar novamente", onClick: () => void retryAll() }}
				/>
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
				{isDashboardLoading ? (
					<div className="mb-4 grid gap-3 sm:grid-cols-3">
						{[
							"metric-skeleton-1",
							"metric-skeleton-2",
							"metric-skeleton-3",
						].map((key) => (
							<div
								className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
								key={key}
							/>
						))}
					</div>
				) : isDashboardNotFound ? (
					<div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700">
						<p className="text-sm">
							Não encontramos dados de dashboard para o profissional
							autenticado.
						</p>
						<button
							className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
							onClick={() => void loadDashboardMetrics()}
							type="button"
						>
							Tentar novamente
						</button>
					</div>
				) : dashboardError ? (
					<div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
						<p className="text-sm">{dashboardError}</p>
						<button
							className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
							onClick={() => void loadDashboardMetrics()}
							type="button"
						>
							Tentar novamente
						</button>
					</div>
				) : (
					<div className="mb-4 grid gap-3 sm:grid-cols-3">
						<MetricCard
							icon={<Briefcase className="size-5 text-orange-600" />}
							iconClassName="bg-orange-100"
							title="Serviços Ativos"
							value={dashboardMetrics?.activeServiceCount.toString() ?? "0"}
						/>
						<MetricCard
							icon={<CalendarDays className="size-5 text-sky-600" />}
							iconClassName="bg-sky-100"
							title="Agendamentos Hoje"
							value={dashboardMetrics?.todayAppointmentsCount.toString() ?? "0"}
						/>
						<MetricCard
							icon={<CircleDollarSign className="size-5 text-emerald-600" />}
							iconClassName="bg-emerald-100"
							title="Receita do Mês"
							value={formatCurrency(dashboardMetrics?.monthRevenue ?? 0)}
						/>
					</div>
				)}

				<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-2xl font-bold text-gray-800">
						Agenda do profissional
					</h1>
					<p className="text-sm font-semibold text-orange-600">
						Visualização por agenda
					</p>
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
						<option value="PENDING_CLIENT">Pendentes do cliente</option>
						<option value="SCHEDULED">Agendados</option>
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
			) : (
				<div className="space-y-6">
					{agendaByDay.map(([day, items]) => (
						<div key={day}>
							<div className="mb-2 flex items-center gap-3">
								<div className="flex size-9 items-center justify-center rounded-lg bg-orange-500 text-white">
									<CalendarDays className="size-5" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-slate-800">
										{formatAgendaDayLabel(day)}
									</h2>
									<p className="text-xs text-slate-500">
										{items.length}{" "}
										{items.length === 1 ? "agendamento" : "agendamentos"}
									</p>
								</div>
							</div>

							<div className="space-y-3">
								{items.map((appointment) => (
									<AgendaRow
										key={appointment.id}
										{...appointment}
										isMutating={isMutatingId === appointment.id}
										onConfirm={() => confirmAppointmentById(appointment.id)}
										onReject={() => rejectAppointmentById(appointment.id)}
										onComplete={() => completeAppointmentById(appointment.id)}
										onNoShow={() => noShowAppointmentById(appointment.id)}
										serviceName={
											serviceNameById[appointment.serviceId] ??
											appointment.serviceId
										}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}
