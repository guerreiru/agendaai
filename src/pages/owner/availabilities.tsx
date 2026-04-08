import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { toApiError } from "../../services/api";
import {
	createAvailability,
	deleteAvailability,
	getAvailableSlots,
	listProfessionalAvailabilities,
	updateAvailability,
} from "../../services/api/availabilities";
import {
	listCompanyCatalogServices,
	listCompanyProfessionals,
} from "../../services/api/professionals";
import type { Availability, Slot } from "../../types/availability";
import type { ProfessionalUser } from "../../types/professional";
import type { Service } from "../../types/service";
import { sanitizeUserInput } from "../../utils/sanitize";

const weekdays = [
	{ value: 1, label: "Segunda" },
	{ value: 2, label: "Terca" },
	{ value: 3, label: "Quarta" },
	{ value: 4, label: "Quinta" },
	{ value: 5, label: "Sexta" },
	{ value: 6, label: "Sabado" },
	{ value: 0, label: "Domingo" },
] as const;

const availabilitySchema = z
	.object({
		weekday: z.number().int().min(0).max(6),
		startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida"),
		endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida"),
		isActive: z.boolean(),
	})
	.refine((values) => values.startTime < values.endTime, {
		message: "Hora inicial deve ser menor que hora final",
		path: ["endTime"],
	});

type AvailabilityForm = z.infer<typeof availabilitySchema>;

function getCompanyIdFromUser(
	user: { companyId?: string | null; ownedCompany?: { id: string }[] } | null,
): string | null {
	return user?.companyId ?? user?.ownedCompany?.[0]?.id ?? null;
}

export function OwnerAvailabilitiesPage() {
	const { user } = useAuth();
	const companyId = useMemo(() => getCompanyIdFromUser(user), [user]);

	const [professionals, setProfessionals] = useState<ProfessionalUser[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [availabilities, setAvailabilities] = useState<Availability[]>([]);
	const [slots, setSlots] = useState<Slot[]>([]);
	const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
	const [selectedServiceId, setSelectedServiceId] = useState("");
	const [previewDate, setPreviewDate] = useState("");
	const [editingAvailability, setEditingAvailability] =
		useState<Availability | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoadingSlots, setIsLoadingSlots] = useState(false);
	const [pageError, setPageError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<AvailabilityForm>({
		resolver: zodResolver(availabilitySchema),
		defaultValues: {
			weekday: 1,
			startTime: "09:00",
			endTime: "18:00",
			isActive: true,
		},
	});

	const loadOwnerData = useCallback(async () => {
		if (!companyId) {
			setPageError("Usuário sem empresa vinculada.");
			return;
		}

		setIsLoading(true);
		setPageError(null);

		try {
			const [professionalsResponse, servicesResponse] = await Promise.all([
				listCompanyProfessionals(companyId),
				listCompanyCatalogServices(companyId),
			]);

			setProfessionals(professionalsResponse);
			setServices(servicesResponse);

			const defaultProfessional = professionalsResponse[0]?.id ?? "";
			setSelectedProfessionalId((current) => current || defaultProfessional);
			setSelectedServiceId(
				(current) => current || servicesResponse[0]?.id || "",
			);
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsLoading(false);
		}
	}, [companyId]);

	const loadAvailabilities = useCallback(async () => {
		if (!selectedProfessionalId) {
			setAvailabilities([]);
			return;
		}

		setIsLoading(true);
		setPageError(null);

		try {
			const response = await listProfessionalAvailabilities(
				selectedProfessionalId,
			);
			setAvailabilities(response);
		} catch (error) {
			setPageError(toApiError(error).message);
			setAvailabilities([]);
		} finally {
			setIsLoading(false);
		}
	}, [selectedProfessionalId]);

	useEffect(() => {
		void loadOwnerData();
	}, [loadOwnerData]);

	useEffect(() => {
		void loadAvailabilities();
	}, [loadAvailabilities]);

	async function onSubmit(values: AvailabilityForm) {
		if (!selectedProfessionalId) {
			setPageError("Selecione um profissional para gerenciar.");
			return;
		}

		setIsSaving(true);
		setPageError(null);

		try {
			if (editingAvailability) {
				await updateAvailability(editingAvailability.id, {
					weekday: values.weekday,
					startTime: values.startTime,
					endTime: values.endTime,
					isActive: values.isActive,
				});
			} else {
				await createAvailability({
					professionalId: selectedProfessionalId,
					weekday: values.weekday,
					startTime: values.startTime,
					endTime: values.endTime,
					isActive: values.isActive,
				});
			}

			setEditingAvailability(null);
			reset({
				weekday: 1,
				startTime: "09:00",
				endTime: "18:00",
				isActive: true,
			});
			await loadAvailabilities();
		} catch (error) {
			const parsedError = toApiError(error);
			if (parsedError.statusCode === 409) {
				setPageError(
					"Conflito de horário: o período se sobrepõe a outro existente.",
				);
			} else {
				setPageError(parsedError.message);
			}
		} finally {
			setIsSaving(false);
		}
	}

	function startEdit(item: Availability) {
		setEditingAvailability(item);
		reset({
			weekday: item.weekday,
			startTime: item.startTime,
			endTime: item.endTime,
			isActive: item.isActive,
		});
	}

	function cancelEdit() {
		setEditingAvailability(null);
		reset({ weekday: 1, startTime: "09:00", endTime: "18:00", isActive: true });
	}

	async function handleDelete(item: Availability) {
		const confirmed = window.confirm("Deseja excluir este período?");
		if (!confirmed) {
			return;
		}

		setIsSaving(true);
		setPageError(null);

		try {
			await deleteAvailability(item.id);
			await loadAvailabilities();
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsSaving(false);
		}
	}

	async function handleLoadSlots() {
		if (!selectedProfessionalId || !selectedServiceId || !previewDate) {
			setPageError(
				"Selecione profissional, serviço e data para consultar slots.",
			);
			return;
		}

		setIsLoadingSlots(true);
		setPageError(null);

		try {
			const response = await getAvailableSlots({
				professionalId: selectedProfessionalId,
				serviceId: selectedServiceId,
				date: previewDate,
			});
			setSlots(response);
		} catch (error) {
			setSlots([]);
			setPageError(toApiError(error).message);
		} finally {
			setIsLoadingSlots(false);
		}
	}

	const groupedByWeekday = useMemo(() => {
		const groups = new Map<number, Availability[]>();

		for (const { value } of weekdays) {
			groups.set(value, []);
		}

		availabilities.forEach((item) => {
			const list = groups.get(item.weekday) ?? [];
			list.push(item);
			groups.set(item.weekday, list);
		});

		groups.forEach((items, day) => {
			groups.set(
				day,
				[...items].sort((a, b) => a.startTime.localeCompare(b.startTime)),
			);
		});

		return groups;
	}, [availabilities]);

	return (
		<section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">
					Disponibilidade dos profissionais
				</h1>
				<p className="text-sm text-slate-600">
					Defina períodos semanais por profissional e visualize os slots
					disponíveis por data.
				</p>
			</header>

			{pageError ? (
				<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
					{pageError}
				</p>
			) : null}

			<section className="grid gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-3">
				<div>
					<label
						className="mb-2 block text-sm font-medium text-gray-900"
						htmlFor="professionalSelect"
					>
						Profissional
					</label>
					<select
						className="w-full rounded-lg border border-gray-300 px-3 py-2"
						id="professionalSelect"
						onChange={(event) => {
							setSelectedProfessionalId(event.target.value);
							setSlots([]);
						}}
						value={selectedProfessionalId}
					>
						<option value="">Selecione</option>
						{professionals.map((professional) => (
							<option key={professional.id} value={professional.id}>
								{sanitizeUserInput(professional.displayName)}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						className="mb-2 block text-sm font-medium text-gray-900"
						htmlFor="serviceSelect"
					>
						Serviço para pré-visualização de slots
					</label>
					<select
						className="w-full rounded-lg border border-gray-300 px-3 py-2"
						id="serviceSelect"
						onChange={(event) => setSelectedServiceId(event.target.value)}
						value={selectedServiceId}
					>
						<option value="">Selecione</option>
						{services.map((service) => (
							<option key={service.id} value={service.id}>
								{sanitizeUserInput(service.name)}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						className="mb-2 block text-sm font-medium text-gray-900"
						htmlFor="previewDate"
					>
						Data da pré-visualização
					</label>
					<input
						className="w-full rounded-lg border border-gray-300 px-3 py-2"
						id="previewDate"
						onChange={(event) => setPreviewDate(event.target.value)}
						type="date"
						value={previewDate}
					/>
				</div>
			</section>

			<div className="grid gap-6 lg:grid-cols-2">
				<section className="space-y-4 rounded-lg border border-slate-200 p-4">
					<h2 className="text-lg font-semibold text-slate-800">
						{editingAvailability ? "Editar período" : "Adicionar período"}
					</h2>

					<form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
						<div>
							<label
								className="mb-2 block text-sm font-medium text-gray-900"
								htmlFor="weekday"
							>
								Dia da semana
							</label>
							<select
								className="w-full rounded-lg border border-gray-300 px-3 py-2"
								id="weekday"
								{...register("weekday", { valueAsNumber: true })}
							>
								{weekdays.map((weekday) => (
									<option key={weekday.value} value={weekday.value}>
										{weekday.label}
									</option>
								))}
							</select>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label
									className="mb-2 block text-sm font-medium text-gray-900"
									htmlFor="startTime"
								>
									Inicio
								</label>
								<input
									className="w-full rounded-lg border border-gray-300 px-3 py-2"
									id="startTime"
									type="time"
									{...register("startTime")}
								/>
							</div>

							<div>
								<label
									className="mb-2 block text-sm font-medium text-gray-900"
									htmlFor="endTime"
								>
									Fim
								</label>
								<input
									className="w-full rounded-lg border border-gray-300 px-3 py-2"
									id="endTime"
									type="time"
									{...register("endTime")}
								/>
							</div>
						</div>

						{errors.endTime ? (
							<p className="text-sm text-red-600">{errors.endTime.message}</p>
						) : null}

						<label className="flex items-center gap-2 text-sm text-slate-800">
							<input type="checkbox" {...register("isActive")} />
							Período ativo
						</label>

						<div className="flex items-center gap-3">
							<button
								className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
								disabled={isSaving || !selectedProfessionalId}
								type="submit"
							>
								{editingAvailability ? "Salvar" : "Adicionar"}
							</button>

							{editingAvailability ? (
								<button
									className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
									disabled={isSaving}
									onClick={cancelEdit}
									type="button"
								>
									Cancelar
								</button>
							) : null}
						</div>
					</form>
				</section>

				<section className="space-y-4 rounded-lg border border-slate-200 p-4">
					<h2 className="text-lg font-semibold text-slate-800">
						Prévia de slots
					</h2>
					<button
						className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
						disabled={
							isLoadingSlots ||
							!selectedProfessionalId ||
							!selectedServiceId ||
							!previewDate
						}
						onClick={() => void handleLoadSlots()}
						type="button"
					>
						{isLoadingSlots ? "Consultando..." : "Consultar slots disponíveis"}
					</button>

					{slots.length === 0 ? (
						<p className="text-sm text-slate-600">
							Nenhum slot carregado. Selecione os filtros e clique em consultar.
						</p>
					) : (
						<ul className="grid grid-cols-2 gap-2">
							{slots.map((slot) => (
								<li
									className="rounded-md border border-slate-200 px-3 py-2 text-sm"
									key={`${slot.startTime}-${slot.endTime}`}
								>
									<p>
										{slot.startTime} - {slot.endTime}
									</p>
									<p className="text-xs text-slate-500">
										{slot.isAvailable === false ? "Indisponível" : "Disponível"}
									</p>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>

			<section className="space-y-3">
				<h2 className="text-lg font-semibold text-slate-800">Grade semanal</h2>
				{isLoading ? <p className="text-slate-600">Carregando...</p> : null}

				{!isLoading ? (
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
						{weekdays.map((weekday) => {
							const dayItems = groupedByWeekday.get(weekday.value) ?? [];

							return (
								<article
									className="space-y-2 rounded-lg border border-slate-200 p-3"
									key={weekday.value}
								>
									<h3 className="font-semibold text-slate-800">
										{weekday.label}
									</h3>

									{dayItems.length === 0 ? (
										<p className="text-sm text-slate-500">Sem períodos.</p>
									) : (
										dayItems.map((item) => (
											<div
												className="rounded-md border border-slate-200 bg-slate-50 p-2"
												key={item.id}
											>
												<p className="text-sm font-medium text-slate-800">
													{item.startTime} - {item.endTime}
												</p>
												<p className="text-xs text-slate-600">
													{item.isActive ? "Ativo" : "Inativo"}
												</p>
												<div className="mt-2 flex gap-2">
													<button
														className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
														onClick={() => startEdit(item)}
														type="button"
													>
														Editar
													</button>
													<button
														className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
														onClick={() => void handleDelete(item)}
														type="button"
													>
														Excluir
													</button>
												</div>
											</div>
										))
									)}
								</article>
							);
						})}
					</div>
				) : null}
			</section>
		</section>
	);
}
