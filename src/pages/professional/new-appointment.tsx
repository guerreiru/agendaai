import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { StepIndicator } from "../../components/ui/StepIndicator";
import { useApiError } from "../../hooks/useApiError";
import { useAuth } from "../../hooks/useAuth";
import {
	type ClientSearchResult,
	createAppointmentByProfessional,
	listProfessionalAvailableServices,
	listSlotsForProfessionalBooking,
	quickCreateClient,
	searchClients,
} from "../../services/api/professional-booking";
import type { Appointment, TimeSlot } from "../../types/booking";
import type { Service } from "../../types/service";
import { getAppointmentStatusLabelSafe } from "../../utils/appointmentStatus";
import { formatCurrency } from "../../utils/currency";
import { sanitizeUserInput } from "../../utils/sanitize";

type Step = 1 | 2 | 3 | 4;
type CreateStatus = "idle" | "loading" | "success" | "error";

const quickCreateClientSchema = z.object({
	name: z.string().trim().min(1, "Nome é obrigatório"),
	email: z.email("Email inválido"),
	phone: z
		.string()
		.trim()
		.optional()
		.refine(
			(value) => {
				if (!value) return true;
				const digits = value.replace(/\D/g, "");
				return digits.length >= 10 && digits.length <= 11;
			},
			{ message: "Telefone inválido" },
		),
	temporaryPassword: z
		.string()
		.min(6, "Senha provisória deve ter no mínimo 6 caracteres"),
});

type QuickCreateClientForm = z.infer<typeof quickCreateClientSchema>;

function isValidEmail(input: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

function isValidPhone(input: string): boolean {
	const digits = input.replace(/\D/g, "");
	return digits.length >= 10 && digits.length <= 11;
}
function toFriendlyPendingOwner(owner?: string | null): string {
	if (owner === "CLIENT") {
		return "cliente";
	}
	if (owner === "PROFESSIONAL") {
		return "profissional";
	}

	return "nenhuma parte";
}

export function ProfessionalNewAppointmentPage() {
	const navigate = useNavigate();
	const { isAuthenticated, user } = useAuth();

	const [step, setStep] = useState<Step>(1);

	const [selectedClient, setSelectedClient] =
		useState<ClientSearchResult | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);
	const [searchEmpty, setSearchEmpty] = useState(false);
	const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
	const [createClientLoading, setCreateClientLoading] = useState(false);
	const [createClientError, setCreateClientError] = useState<string | null>(
		null,
	);

	const {
		register: registerQuickClient,
		handleSubmit: handleSubmitQuickClient,
		formState: { errors: quickClientErrors },
		reset: resetQuickClient,
		setValue: setQuickClientValue,
	} = useForm<QuickCreateClientForm>({
		resolver: zodResolver(quickCreateClientSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			temporaryPassword: "",
		},
	});

	const [servicesLoading, setServicesLoading] = useState(false);
	const [servicesError, setServicesError] = useState<string | null>(null);

	const handleApiError = useApiError();
	const [serviceOptions, setServiceOptions] = useState<
		Array<{ service: Service; price: number }>
	>([]);
	const [selectedServiceId, setSelectedServiceId] = useState<string>("");

	const [selectedDate, setSelectedDate] = useState("");
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [slotsError, setSlotsError] = useState<string | null>(null);
	const [slots, setSlots] = useState<TimeSlot[]>([]);
	const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

	const [createStatus, setCreateStatus] = useState<CreateStatus>("idle");
	const [createError, setCreateError] = useState<string | null>(null);
	const [createdAppointment, setCreatedAppointment] =
		useState<Appointment | null>(null);

	const professionalId = user?.id ?? "";
	const companyId = user?.companyId ?? "";

	const selectedService = useMemo(
		() =>
			serviceOptions.find((item) => item.service.id === selectedServiceId) ??
			null,
		[selectedServiceId, serviceOptions],
	);

	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login", { replace: true });
			return;
		}

		if (user && user.role !== "PROFESSIONAL") {
			navigate("/forbidden", { replace: true });
			return;
		}
	}, [isAuthenticated, user, navigate]);

	useEffect(() => {
		if (!companyId || !professionalId) {
			return;
		}

		const loadServices = async () => {
			setServicesLoading(true);
			setServicesError(null);

			try {
				const available = await listProfessionalAvailableServices(
					companyId,
					professionalId,
				);
				setServiceOptions(
					available.map((item) => ({
						service: item.service,
						price: item.link.price,
					})),
				);
			} catch (error) {
				const result = handleApiError(error);
				if (!result) return;
				setServicesError(result.message);
			} finally {
				setServicesLoading(false);
			}
		};

		void loadServices();
	}, [companyId, professionalId, handleApiError]);

	useEffect(() => {
		const query = searchQuery.trim();

		if (selectedClient) {
			return;
		}

		const shouldSearch = isValidEmail(query) || isValidPhone(query);

		if (!shouldSearch) {
			setSearchResults([]);
			setSearchError(null);
			setSearchEmpty(false);
			return;
		}

		const timeout = setTimeout(() => {
			void (async () => {
				setSearchLoading(true);
				setSearchError(null);
				setSearchEmpty(false);

				try {
					const users = await searchClients(query);
					setSearchResults(users);
					setSearchEmpty(users.length === 0);
				} catch (error) {
					const result = handleApiError(error);
					if (!result) return;
					setSearchError(result.message);
					setSearchResults([]);
				} finally {
					setSearchLoading(false);
				}
			})();
		}, 400);

		return () => clearTimeout(timeout);
	}, [searchQuery, selectedClient, handleApiError]);

	useEffect(() => {
		if (!selectedDate || !selectedServiceId || !professionalId) {
			setSlots([]);
			setSelectedSlot(null);
			return;
		}

		const loadSlots = async () => {
			setSlotsLoading(true);
			setSlotsError(null);

			try {
				const availableSlots = await listSlotsForProfessionalBooking(
					professionalId,
					selectedServiceId,
					selectedDate,
				);
				setSlots(availableSlots);
			} catch (error) {
				const result = handleApiError(error);
				if (!result) return;
				setSlotsError(result.message);
				setSlots([]);
			} finally {
				setSlotsLoading(false);
			}
		};

		void loadSlots();
	}, [selectedDate, selectedServiceId, professionalId, handleApiError]);

	const canGoStep2 = Boolean(selectedClient);
	const canGoStep3 = Boolean(selectedServiceId);
	const canGoStep4 = Boolean(selectedDate && selectedSlot);
	const canSubmit = Boolean(
		selectedClient && selectedServiceId && selectedDate && selectedSlot,
	);

	const resetAfterClientChange = () => {
		setSelectedServiceId("");
		setSelectedDate("");
		setSelectedSlot(null);
		setSlots([]);
		setCreateStatus("idle");
		setCreateError(null);
		setCreatedAppointment(null);
		setStep(1);
	};

	const handleSelectClient = (client: ClientSearchResult) => {
		setSelectedClient(client);
		setSearchResults([]);
		setSearchError(null);
		setSearchEmpty(false);
		setSearchQuery(client.email);
		setStep(2);
	};

	const handleChangeClient = () => {
		setSelectedClient(null);
		setSearchQuery("");
		resetAfterClientChange();
	};

	const handleServiceChange = (serviceId: string) => {
		setSelectedServiceId(serviceId);
		setSelectedDate("");
		setSelectedSlot(null);
		setSlots([]);
		setCreateStatus("idle");
		setCreateError(null);
		setCreatedAppointment(null);
	};

	const handleDateChange = (date: string) => {
		setSelectedDate(date);
		setSelectedSlot(null);
		setCreateStatus("idle");
		setCreateError(null);
		setCreatedAppointment(null);
	};

	const handleCreateClient = async (data: QuickCreateClientForm) => {
		setCreateClientLoading(true);
		setCreateClientError(null);

		try {
			const normalizedPhone = data.phone?.replace(/\D/g, "") || undefined;

			const client = await quickCreateClient({
				name: data.name.trim(),
				email: data.email.trim(),
				phone: normalizedPhone,
				password: data.temporaryPassword,
			});

			setSelectedClient(client);
			setSearchQuery(client.email);
			setIsCreateClientOpen(false);
			resetQuickClient();
			setStep(2);
		} catch (error) {
			const result = handleApiError(error);
			if (!result) return;
			setCreateClientError(result.message);
		} finally {
			setCreateClientLoading(false);
		}
	};

	const handleCreateAppointment = async () => {
		if (!canSubmit || !selectedClient || !selectedSlot) {
			setCreateError("Preencha todos os dados antes de criar o agendamento.");
			return;
		}

		setCreateStatus("loading");
		setCreateError(null);

		try {
			const created = await createAppointmentByProfessional({
				companyId,
				professionalId,
				clientId: selectedClient.id,
				serviceId: selectedServiceId,
				date: new Date(selectedDate).toISOString(),
				startTime: selectedSlot.startTime,
				endTime: selectedSlot.endTime,
			});

			setCreatedAppointment(created);
			setCreateStatus("success");
		} catch (error) {
			const result = handleApiError(error);
			if (!result) return;
			if (result.type === "conflict") {
				setSlotsError("Horário já ocupado. Escolha outro horário.");
				setSelectedSlot(null);
				if (selectedDate && selectedServiceId) {
					const refreshed = await listSlotsForProfessionalBooking(
						professionalId,
						selectedServiceId,
						selectedDate,
					);
					setSlots(refreshed);
				}
			}
			setCreateStatus("error");
			setCreateError(result.message);
		}
	};

	const handleCreateAnother = () => {
		setStep(1);
		setSelectedClient(null);
		setSearchQuery("");
		setSearchResults([]);
		setSearchError(null);
		setSearchEmpty(false);
		setSelectedServiceId("");
		setSelectedDate("");
		setSelectedSlot(null);
		setSlots([]);
		setCreateStatus("idle");
		setCreateError(null);
		setCreatedAppointment(null);
	};

	return (
		<section className="space-y-5">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-slate-950">
					Novo agendamento para cliente
				</h1>
				<Link
					className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
					to="/professional/dashboard"
				>
					Ver agenda
				</Link>
			</div>

			<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
				<StepIndicator currentStep={step} totalSteps={4} />

				{step === 1 && (
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-slate-950">
							Etapa 1: Cliente
						</h2>

						{selectedClient ? (
							<div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
								<p className="font-semibold text-slate-950">
									{sanitizeUserInput(selectedClient.name)}
								</p>
								<p className="text-sm text-slate-700">{selectedClient.email}</p>
								<p className="text-sm text-slate-700">
									{selectedClient.phone ?? "Sem telefone"}
								</p>
								<button
									className="mt-3 rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
									onClick={handleChangeClient}
									type="button"
								>
									Trocar cliente
								</button>
							</div>
						) : (
							<>
								<FormField
									label="Buscar cliente por email ou telefone"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Digite email ou telefone"
									value={searchQuery}
								/>

								{searchLoading && (
									<p className="text-sm text-slate-500">Buscando clientes...</p>
								)}

								{searchError && (
									<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
										<p>{searchError}</p>
									</div>
								)}

								{!searchLoading && searchResults.length > 0 && (
									<ul className="space-y-2 rounded-md border border-slate-200 p-2">
										{searchResults.map((client) => (
											<li key={client.id}>
												<button
													className="w-full rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
													onClick={() => handleSelectClient(client)}
													type="button"
												>
													<p className="font-semibold text-slate-950">
														{sanitizeUserInput(client.name)}
													</p>
													<p className="text-sm text-slate-700">
														{client.email}
													</p>
													<p className="text-sm text-slate-700">
														{client.phone ?? "Sem telefone"}
													</p>
												</button>
											</li>
										))}
									</ul>
								)}

								{searchEmpty && (
									<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
										<p>Cliente não encontrado.</p>
										<button
											className="mt-2 rounded-md border border-amber-300 px-3 py-1 text-xs font-semibold"
											onClick={() => {
												setQuickClientValue(
													"email",
													isValidEmail(searchQuery.trim())
														? searchQuery.trim()
														: "",
												);
												setIsCreateClientOpen(true);
											}}
											type="button"
										>
											Cadastrar novo cliente
										</button>
									</div>
								)}
							</>
						)}

						<div className="flex justify-end">
							<button
								className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
								disabled={!canGoStep2}
								onClick={() => setStep(2)}
								type="button"
							>
								Próximo
							</button>
						</div>
					</div>
				)}

				{step === 2 && (
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-slate-950">
							Etapa 2: Serviço
						</h2>

						{servicesLoading && (
							<p className="text-sm text-slate-500">Carregando serviços...</p>
						)}
						{servicesError && (
							<p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
								{servicesError}
							</p>
						)}
						{!servicesLoading &&
							serviceOptions.length === 0 &&
							!servicesError && (
								<p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
									Nenhum serviço disponível para este profissional.
								</p>
							)}

						<div className="grid gap-2">
							{serviceOptions.map((item) => (
								<button
									className={`rounded-md border p-3 text-left ${
										selectedServiceId === item.service.id
											? "border-sky-400 bg-sky-50"
											: "border-slate-200 hover:bg-slate-50"
									}`}
									key={item.service.id}
									onClick={() => handleServiceChange(item.service.id)}
									type="button"
								>
									<p className="font-semibold text-slate-950">
										{sanitizeUserInput(item.service.name)}
									</p>
									<p className="text-sm text-slate-700">
										Duração: {item.service.duration} min
									</p>
									{item.service.description && (
										<p className="text-sm text-slate-600">
											{sanitizeUserInput(item.service.description)}
										</p>
									)}
								</button>
							))}
						</div>

						<div className="flex justify-between">
							<button
								className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
								onClick={() => setStep(1)}
								type="button"
							>
								Voltar
							</button>
							<button
								className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
								disabled={!canGoStep3}
								onClick={() => setStep(3)}
								type="button"
							>
								Próximo
							</button>
						</div>
					</div>
				)}

				{step === 3 && (
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-slate-950">
							Etapa 3: Data e horário
						</h2>

						<div>
							<label
								className="mb-1 block text-sm font-semibold text-slate-700"
								htmlFor="date"
							>
								Data
							</label>
							<input
								className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
								min={new Date().toISOString().split("T")[0]}
								id="date"
								onChange={(e) => handleDateChange(e.target.value)}
								type="date"
								value={selectedDate}
							/>
						</div>

						{slotsLoading && (
							<p className="text-sm text-slate-500">Carregando horários...</p>
						)}
						{slotsError && (
							<p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
								{slotsError}
							</p>
						)}

						{!slotsLoading &&
							selectedDate &&
							slots.length === 0 &&
							!slotsError && (
								<p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
									Não há horários disponíveis nesta data.
								</p>
							)}

						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{slots.map((slot) => {
								const selected =
									selectedSlot?.startTime === slot.startTime &&
									selectedSlot?.endTime === slot.endTime;

								return (
									<button
										className={`rounded-md border px-3 py-2 text-sm font-semibold ${
											selected
												? "border-sky-500 bg-sky-50 text-sky-700"
												: "border-slate-300 text-slate-700 hover:bg-slate-50"
										}`}
										key={`${slot.startTime}-${slot.endTime}`}
										onClick={() => setSelectedSlot(slot)}
										type="button"
									>
										{slot.startTime} - {slot.endTime}
									</button>
								);
							})}
						</div>

						<div className="flex justify-between">
							<button
								className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
								onClick={() => setStep(2)}
								type="button"
							>
								Voltar
							</button>
							<button
								className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
								disabled={!canGoStep4}
								onClick={() => setStep(4)}
								type="button"
							>
								Próximo
							</button>
						</div>
					</div>
				)}

				{step === 4 && (
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-slate-950">
							Etapa 4: Revisão e confirmação
						</h2>

						<div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
							<p>
								<span className="font-semibold">Cliente:</span>{" "}
								{sanitizeUserInput(selectedClient?.name ?? "")} (
								{selectedClient?.email})
							</p>
							<p>
								<span className="font-semibold">Profissional:</span>{" "}
								{sanitizeUserInput(user?.name ?? "")}
							</p>
							<p>
								<span className="font-semibold">Serviço:</span>{" "}
								{sanitizeUserInput(selectedService?.service.name ?? "")}
							</p>
							<p>
								<span className="font-semibold">Data e horário:</span>{" "}
								{selectedDate} • {selectedSlot?.startTime} -{" "}
								{selectedSlot?.endTime}
							</p>
							<p>
								<span className="font-semibold">Preço estimado:</span>{" "}
								{selectedService ? formatCurrency(selectedService.price) : "-"}
							</p>
						</div>

						{createError && (
							<p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
								{createError}
							</p>
						)}

						{createStatus === "success" && (
							<div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
								<p className="font-bold">
									Agendamento criado. Aguardando confirmação do cliente.
								</p>
								<p className="mt-1 text-sm">
									Status:{" "}
									{getAppointmentStatusLabelSafe(createdAppointment?.status)} •
									pendente de{" "}
									{toFriendlyPendingOwner(
										createdAppointment?.pendingApprovalFrom,
									)}
								</p>
								<div className="mt-3 flex gap-2">
									<button
										className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800"
										onClick={() => navigate("/professional/dashboard")}
										type="button"
									>
										Ver agenda
									</button>
									<button
										className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-white"
										onClick={handleCreateAnother}
										type="button"
									>
										Criar outro
									</button>
								</div>
							</div>
						)}

						<div className="flex justify-between">
							<button
								className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
								onClick={() => setStep(3)}
								type="button"
							>
								Voltar
							</button>
							<button
								className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
								disabled={
									!canSubmit ||
									createStatus === "loading" ||
									createStatus === "success"
								}
								onClick={() => void handleCreateAppointment()}
								type="button"
							>
								{createStatus === "loading"
									? "Criando..."
									: "Criar agendamento"}
							</button>
						</div>
					</div>
				)}
			</div>

			{isCreateClientOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
					<div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
						<h3 className="text-lg font-bold text-slate-950">
							Cadastro rápido de cliente
						</h3>

						<form
							className="mt-4 space-y-3"
							onSubmit={handleSubmitQuickClient(
								(data) => void handleCreateClient(data),
							)}
						>
							<FormField
								label="Nome"
								placeholder="Nome"
								{...registerQuickClient("name")}
								error={quickClientErrors.name}
							/>
							<FormField
								label="Email"
								placeholder="Email"
								type="email"
								{...registerQuickClient("email")}
								error={quickClientErrors.email}
							/>
							<FormField
								label="Telefone (opcional)"
								placeholder="Telefone (opcional)"
								{...registerQuickClient("phone")}
								error={quickClientErrors.phone}
								mask="00 00000-0000"
							/>
							<FormField
								label="Senha provisória"
								placeholder="Defina uma senha provisória"
								type="password"
								{...registerQuickClient("temporaryPassword")}
								error={quickClientErrors.temporaryPassword}
							/>

							{createClientError && (
								<p className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
									{createClientError}
								</p>
							)}

							<div className="mt-4 flex justify-end gap-2">
								<button
									className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
									onClick={() => {
										setIsCreateClientOpen(false);
										setCreateClientError(null);
										resetQuickClient();
									}}
									type="button"
								>
									Fechar
								</button>
								<button
									className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
									disabled={createClientLoading}
									type="submit"
								>
									{createClientLoading ? "Salvando..." : "Cadastrar cliente"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</section>
	);
}
