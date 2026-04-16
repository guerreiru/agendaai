import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Clock3, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import { toApiError } from "../../services/api";
import {
	createService,
	deleteService,
	listCompanyServices,
	updateService,
} from "../../services/api/services";
import { queryKeys } from "../../services/queryKeys";
import type { Service } from "../../types/service";

const serviceSchema = z.object({
	name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
	duration: z.number().int().positive("Duração deve ser maior que zero"),
	description: z
		.string()
		.trim()
		.max(300, "Descrição deve ter no máximo 300 caracteres")
		.optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;

function getCompanyIdFromUser(
	user: { companyId?: string | null; ownedCompany?: { id: string }[] } | null,
): string | null {
	return user?.companyId ?? user?.ownedCompany?.[0]?.id ?? null;
}

export function OwnerServicesPage() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const companyId = useMemo(() => getCompanyIdFromUser(user), [user]);

	const [services, setServices] = useState<Service[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isMutating, setIsMutating] = useState(false);
	const [pageError, setPageError] = useState<string | null>(null);
	const [editingService, setEditingService] = useState<Service | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ServiceForm>({
		resolver: zodResolver(serviceSchema),
		defaultValues: {
			name: "",
			duration: 30,
			description: "",
		},
	});

	const loadServices = useCallback(async () => {
		if (!companyId) {
			setServices([]);
			setPageError("Usuário sem empresa vinculada.");
			return;
		}

		setIsLoading(true);
		setPageError(null);

		try {
			const response = await listCompanyServices(companyId);
			setServices(response);
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsLoading(false);
		}
	}, [companyId]);

	useEffect(() => {
		void loadServices();
	}, [loadServices]);

	async function onSubmit(values: ServiceForm) {
		if (!companyId) {
			setPageError("Usuário sem empresa vinculada.");
			return;
		}

		setIsMutating(true);
		setPageError(null);

		const payload = {
			companyId,
			name: values.name,
			duration: values.duration,
			description: values.description?.trim()
				? values.description.trim()
				: null,
		};

		try {
			if (editingService) {
				await updateService(editingService.id, payload);
			} else {
				await createService(payload);
			}

			setEditingService(null);
			setIsFormOpen(false);
			reset({ name: "", duration: 30, description: "" });
			await loadServices();
			if (companyId) {
				await queryClient.invalidateQueries({
					queryKey: queryKeys.ownerDashboard(companyId),
				});
			}
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsMutating(false);
		}
	}

	function startEdit(service: Service) {
		setEditingService(service);
		setIsFormOpen(true);
		reset({
			name: service.name,
			duration: service.duration,
			description: service.description ?? "",
		});
	}

	function cancelEdit() {
		setEditingService(null);
		setIsFormOpen(false);
		reset({ name: "", duration: 30, description: "" });
	}

	function startCreate() {
		setEditingService(null);
		setIsFormOpen(true);
		reset({ name: "", duration: 30, description: "" });
	}

	const filteredServices = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();

		if (!query) {
			return services;
		}

		return services.filter((service) => {
			const haystack =
				`${service.name} ${service.description ?? ""}`.toLowerCase();
			return haystack.includes(query);
		});
	}, [searchQuery, services]);

	async function handleDelete(service: Service) {
		const confirmed = window.confirm(
			`Deseja excluir o serviço "${service.name}"?`,
		);

		if (!confirmed) {
			return;
		}

		setIsMutating(true);
		setPageError(null);

		try {
			await deleteService(service.id);
			await loadServices();
			if (companyId) {
				await queryClient.invalidateQueries({
					queryKey: queryKeys.ownerDashboard(companyId),
				});
			}
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsMutating(false);
		}
	}

	return (
		<section className="space-y-5">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-4xl font-bold tracking-tight text-slate-950">
						Serviços
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Gerencie os serviços oferecidos
					</p>
				</div>

				<Button disabled={isMutating} onClick={startCreate} type="button">
					<Plus className="size-4" />
					Novo Serviço
				</Button>
			</header>

			<div className="max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5">
				<label className="sr-only" htmlFor="service-search">
					Buscar serviços
				</label>
				<div className="flex items-center gap-2 text-slate-400">
					<Search className="size-4" />
					<input
						className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
						id="service-search"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Buscar serviços..."
						type="text"
						value={searchQuery}
					/>
				</div>
			</div>

			{isFormOpen ? (
				<form
					className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
					onSubmit={handleSubmit(onSubmit)}
				>
					<h2 className="text-lg font-semibold text-slate-800">
						{editingService ? "Editar serviço" : "Novo serviço"}
					</h2>

					<FormField
						label="Nome"
						id="name"
						type="text"
						{...register("name")}
						error={errors.name}
					/>

					<FormField
						label="Duração (minutos)"
						id="duration"
						type="number"
						min={1}
						{...register("duration", { valueAsNumber: true })}
						error={errors.duration}
					/>

					<FormField
						label="Descrição"
						id="description"
						type="text"
						{...register("description")}
						error={errors.description}
					/>

					<div className="flex items-center gap-3">
						<Button disabled={isMutating} type="submit">
							{editingService ? "Salvar alterações" : "Criar serviço"}
						</Button>

						<Button
							className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
							disabled={isMutating}
							onClick={cancelEdit}
							type="button"
						>
							Cancelar
						</Button>
					</div>
				</form>
			) : null}

			{pageError ? (
				<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
					{pageError}
				</p>
			) : null}

			{isLoading ? (
				<p className="text-slate-600">Carregando serviços...</p>
			) : null}

			{!isLoading && filteredServices.length === 0 ? (
				<p className="text-slate-600">Nenhum serviço encontrado.</p>
			) : null}

			{!isLoading && filteredServices.length > 0 ? (
				<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filteredServices.map((service) => {
						return (
							<li
								className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
								key={service.id}
							>
								<div className="mb-4">
									<h3 className="text-2xl font-bold text-slate-950">
										{service.name}
									</h3>
									<p className="mt-2 min-h-10 text-sm text-slate-500">
										{service.description || "Sem descrição"}
									</p>
								</div>

								<div className="mb-4 flex items-center justify-between">
									<p className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
										<Clock3 className="size-3.5" />
										{service.duration} min
									</p>
								</div>

								<div className="flex items-center gap-2 border-t border-slate-100 pt-3">
									<Button
										variant="secondary"
										disabled={isMutating}
										onClick={() => startEdit(service)}
										type="button"
									>
										<Pencil className="size-3.5" />
										Editar
									</Button>
									<Button
										variant="destructive"
										disabled={isMutating}
										onClick={() => void handleDelete(service)}
										type="button"
									>
										<Trash2 className="size-3.5" />
										Excluir
									</Button>
								</div>
							</li>
						);
					})}
				</ul>
			) : null}
		</section>
	);
}
