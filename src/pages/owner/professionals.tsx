import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import { toApiError } from "../../services/api";
import {
	createProfessional,
	createProfessionalService,
	deleteProfessional,
	deleteProfessionalService,
	getProfessionalServiceById,
	listCompanyCatalogServices,
	listCompanyProfessionalServices,
	listCompanyProfessionals,
	updateProfessional,
	updateProfessionalService,
} from "../../services/api/professionals";
import type {
	ProfessionalServiceLink,
	ProfessionalUser,
} from "../../types/professional";
import type { Service } from "../../types/service";

const professionalSchema = z.object({
	name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
	displayName: z
		.string()
		.trim()
		.min(2, "Nome público deve ter ao menos 2 caracteres"),
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
			{
				message: "Telefone deve estar em formato, ex: 88999999999",
			},
		),
	password: z
		.string()
		.optional()
		.refine((value) => !value || value.length >= 6, {
			message: "Senha deve ter ao menos 6 caracteres",
		}),
});

const professionalServiceSchema = z.object({
	professionalId: z.string().min(1, "Selecione um profissional"),
	serviceId: z.string().min(1, "Selecione um serviço"),
	price: z.number().positive("Preço deve ser maior que zero"),
	isActive: z.boolean(),
});

type ProfessionalForm = z.infer<typeof professionalSchema>;
type ProfessionalServiceForm = z.infer<typeof professionalServiceSchema>;

function getCompanyIdFromUser(
	user: { companyId?: string | null; ownedCompany?: { id: string }[] } | null,
): string | null {
	return user?.companyId ?? user?.ownedCompany?.[0]?.id ?? null;
}

export function OwnerProfessionalsPage() {
	const { user } = useAuth();
	const companyId = useMemo(() => getCompanyIdFromUser(user), [user]);

	const [professionals, setProfessionals] = useState<ProfessionalUser[]>([]);
	const [catalogServices, setCatalogServices] = useState<Service[]>([]);
	const [links, setLinks] = useState<ProfessionalServiceLink[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSavingProfessional, setIsSavingProfessional] = useState(false);
	const [isSavingLink, setIsSavingLink] = useState(false);
	const [pageError, setPageError] = useState<string | null>(null);
	const [editingProfessional, setEditingProfessional] =
		useState<ProfessionalUser | null>(null);
	const [editingLink, setEditingLink] =
		useState<ProfessionalServiceLink | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm<ProfessionalForm>({
		resolver: zodResolver(professionalSchema),
		defaultValues: {
			name: "",
			displayName: "",
			email: "",
			phone: "",
			password: "",
		},
	});

	const {
		register: registerLink,
		handleSubmit: handleSubmitLink,
		reset: resetLink,
		formState: { errors: linkErrors },
	} = useForm<ProfessionalServiceForm>({
		resolver: zodResolver(professionalServiceSchema),
		defaultValues: {
			professionalId: "",
			serviceId: "",
			price: 0,
			isActive: true,
		},
	});

	const loadPageData = useCallback(async () => {
		if (!companyId) {
			setPageError("Usuário sem empresa vinculada.");
			setProfessionals([]);
			setCatalogServices([]);
			setLinks([]);
			return;
		}

		setIsLoading(true);
		setPageError(null);

		try {
			const [professionalsResponse, servicesResponse, linksResponse] =
				await Promise.all([
					listCompanyProfessionals(companyId),
					listCompanyCatalogServices(companyId),
					listCompanyProfessionalServices(companyId),
				]);

			setProfessionals(professionalsResponse);
			setCatalogServices(servicesResponse);
			setLinks(linksResponse);
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsLoading(false);
		}
	}, [companyId]);

	useEffect(() => {
		void loadPageData();
	}, [loadPageData]);

	async function onProfessionalSubmit(values: ProfessionalForm) {
		if (!companyId) {
			setPageError("Usuário sem empresa vinculada.");
			return;
		}

		if (!editingProfessional && !values.password) {
			setError("password", {
				message: "Senha e obrigatoria ao criar um profissional",
			});
			return;
		}

		setIsSavingProfessional(true);
		setPageError(null);

		try {
			const normalizedPhone = values.phone?.replace(/\D/g, "") || null;

			if (editingProfessional) {
				await updateProfessional(editingProfessional.id, {
					name: values.name,
					displayName: values.displayName,
					email: values.email,
					phone: normalizedPhone,
					password: values.password?.trim() || undefined,
				});
			} else {
				await createProfessional({
					name: values.name,
					displayName: values.displayName,
					email: values.email,
					password: values.password ?? "",
					role: "PROFESSIONAL",
					companyId,
					phone: normalizedPhone ?? undefined,
				});
			}

			setEditingProfessional(null);
			reset({ name: "", displayName: "", email: "", phone: "", password: "" });
			await loadPageData();
		} catch (error) {
			const parsedError = toApiError(error);
			setPageError(parsedError.message);
		} finally {
			setIsSavingProfessional(false);
		}
	}

	function startEditProfessional(professional: ProfessionalUser) {
		setEditingProfessional(professional);
		reset({
			name: professional.name,
			displayName: professional.displayName,
			email: professional.email,
			phone: professional.phone ?? "",
			password: "",
		});
	}

	function cancelProfessionalEdit() {
		setEditingProfessional(null);
		reset({ name: "", displayName: "", email: "", phone: "", password: "" });
	}

	async function handleDeleteProfessional(professional: ProfessionalUser) {
		const confirmed = window.confirm(
			`Deseja excluir o profissional "${professional.displayName}"?`,
		);

		if (!confirmed) {
			return;
		}

		setIsSavingProfessional(true);
		setPageError(null);

		try {
			await deleteProfessional(professional.id);
			await loadPageData();
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsSavingProfessional(false);
		}
	}

	async function onLinkSubmit(values: ProfessionalServiceForm) {
		setIsSavingLink(true);
		setPageError(null);

		try {
			if (editingLink) {
				await updateProfessionalService(editingLink.id, {
					professionalId: values.professionalId,
					serviceId: values.serviceId,
					price: values.price,
					isActive: values.isActive,
				});
			} else {
				await createProfessionalService({
					professionalId: values.professionalId,
					serviceId: values.serviceId,
					price: values.price,
					isActive: values.isActive,
				});
			}

			setEditingLink(null);
			resetLink({
				professionalId: "",
				serviceId: "",
				price: 0,
				isActive: true,
			});
			await loadPageData();
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsSavingLink(false);
		}
	}

	async function startEditLink(link: ProfessionalServiceLink) {
		try {
			const latestLink = await getProfessionalServiceById(link.id);
			setEditingLink(latestLink);
			resetLink({
				professionalId: latestLink.professionalId,
				serviceId: latestLink.serviceId,
				price: latestLink.price,
				isActive: latestLink.isActive,
			});
		} catch (error) {
			setPageError(toApiError(error).message);
		}
	}

	function cancelLinkEdit() {
		setEditingLink(null);
		resetLink({ professionalId: "", serviceId: "", price: 0, isActive: true });
	}

	async function handleDeleteLink(link: ProfessionalServiceLink) {
		const confirmed = window.confirm("Deseja remover este vínculo?");

		if (!confirmed) {
			return;
		}

		setIsSavingLink(true);
		setPageError(null);

		try {
			await deleteProfessionalService(link.id);
			await loadPageData();
		} catch (error) {
			setPageError(toApiError(error).message);
		} finally {
			setIsSavingLink(false);
		}
	}

	const professionalsById = useMemo(
		() =>
			new Map(
				professionals.map((professional) => [professional.id, professional]),
			),
		[professionals],
	);

	const servicesById = useMemo(
		() => new Map(catalogServices.map((service) => [service.id, service])),
		[catalogServices],
	);

	return (
		<section className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">
					Gerenciamento de profissionais
				</h1>
				<p className="text-sm text-slate-600">
					Cadastre profissionais da sua empresa e vincule serviços com preço e
					status.
				</p>
			</header>

			{pageError ? (
				<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
					{pageError}
				</p>
			) : null}

			<div className="grid gap-6 lg:grid-cols-2">
				<section className="space-y-4 rounded-lg border border-slate-200 p-4">
					<h2 className="text-lg font-semibold text-slate-800">
						{editingProfessional ? "Editar profissional" : "Novo profissional"}
					</h2>

					<form
						className="space-y-3"
						onSubmit={handleSubmit(onProfessionalSubmit)}
					>
						<FormField
							label="Nome completo"
							id="name"
							type="text"
							{...register("name")}
							error={errors.name}
						/>

						<FormField
							label="Nome público (apelido ou nome profissional)"
							id="displayName"
							type="text"
							{...register("displayName")}
							error={errors.displayName}
						/>

						<FormField
							label="Email"
							id="email"
							type="email"
							{...register("email")}
							error={errors.email}
						/>

						<FormField
							label="Telefone"
							id="phone"
							type="tel"
							placeholder="88999999999"
							{...register("phone")}
							error={errors.phone}
							mask="00 00000-0000"
						/>

						<FormField
							label={editingProfessional ? "Nova senha (opcional)" : "Senha"}
							id="password"
							type="password"
							{...register("password")}
							error={errors.password}
						/>

						<div className="flex items-center gap-3">
							<button
								className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
								disabled={isSavingProfessional}
								type="submit"
							>
								{editingProfessional
									? "Salvar alterações"
									: "Criar profissional"}
							</button>

							{editingProfessional ? (
								<button
									className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
									disabled={isSavingProfessional}
									onClick={cancelProfessionalEdit}
									type="button"
								>
									Cancelar edição
								</button>
							) : null}
						</div>
					</form>
				</section>

				<section className="space-y-4 rounded-lg border border-slate-200 p-4">
					<h2 className="text-lg font-semibold text-slate-800">
						Profissionais da empresa
					</h2>

					{isLoading ? <p className="text-slate-600">Carregando...</p> : null}

					{!isLoading && professionals.length === 0 ? (
						<p className="text-slate-600">Nenhum profissional cadastrado.</p>
					) : null}

					{!isLoading && professionals.length > 0 ? (
						<ul className="space-y-3">
							{professionals.map((professional) => (
								<li
									className="rounded-md border border-slate-200 p-3"
									key={professional.id}
								>
									<p className="font-semibold text-slate-900">
										{professional.displayName}
									</p>
									<p className="text-sm text-slate-700">{professional.name}</p>
									<p className="text-sm text-slate-600">{professional.email}</p>
									<p className="text-sm text-slate-600">
										{professional.phone || "Sem telefone"}
									</p>

									<div className="mt-3 flex items-center gap-2">
										<button
											className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
											disabled={isSavingProfessional}
											onClick={() => startEditProfessional(professional)}
											type="button"
										>
											Editar
										</button>
										<button
											className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
											disabled={isSavingProfessional}
											onClick={() =>
												void handleDeleteProfessional(professional)
											}
											type="button"
										>
											Excluir
										</button>
									</div>
								</li>
							))}
						</ul>
					) : null}
				</section>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<section className="space-y-4 rounded-lg border border-slate-200 p-4">
					<h2 className="text-lg font-semibold text-slate-800">
						{editingLink
							? "Editar vínculo"
							: "Vincular serviço ao profissional"}
					</h2>

					<form className="space-y-3" onSubmit={handleSubmitLink(onLinkSubmit)}>
						<div>
							<label
								className="mb-2 block text-sm font-medium text-gray-900"
								htmlFor="professionalId"
							>
								Profissional
							</label>
							<select
								className={`w-full rounded-lg border px-3 py-2 ${
									linkErrors.professionalId
										? "border-red-400"
										: "border-gray-300"
								}`}
								id="professionalId"
								{...registerLink("professionalId")}
							>
								<option value="">Selecione</option>
								{professionals.map((professional) => (
									<option key={professional.id} value={professional.id}>
										{professional.displayName}
									</option>
								))}
							</select>
							{linkErrors.professionalId ? (
								<p className="mt-1 text-sm text-red-600">
									{linkErrors.professionalId.message}
								</p>
							) : null}
						</div>

						<div>
							<label
								className="mb-2 block text-sm font-medium text-gray-900"
								htmlFor="serviceId"
							>
								Serviço
							</label>
							<select
								className={`w-full rounded-lg border px-3 py-2 ${
									linkErrors.serviceId ? "border-red-400" : "border-gray-300"
								}`}
								id="serviceId"
								{...registerLink("serviceId")}
							>
								<option value="">Selecione</option>
								{catalogServices.map((service) => (
									<option key={service.id} value={service.id}>
										{service.name}
									</option>
								))}
							</select>
							{linkErrors.serviceId ? (
								<p className="mt-1 text-sm text-red-600">
									{linkErrors.serviceId.message}
								</p>
							) : null}
						</div>

						<FormField
							label="Preço"
							id="price"
							min={0.01}
							step="0.01"
							type="number"
							{...registerLink("price", { valueAsNumber: true })}
							error={linkErrors.price}
						/>

						<label className="flex items-center gap-2 text-sm text-slate-800">
							<input type="checkbox" {...registerLink("isActive")} />
							vínculo ativo para agendamento
						</label>

						<div className="flex items-center gap-3">
							<button
								className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
								disabled={isSavingLink}
								type="submit"
							>
								{editingLink ? "Salvar vínculo" : "Criar vínculo"}
							</button>

							{editingLink ? (
								<button
									className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
									disabled={isSavingLink}
									onClick={cancelLinkEdit}
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
						Vínculos profissional-serviço
					</h2>

					{isLoading ? <p className="text-slate-600">Carregando...</p> : null}

					{!isLoading && links.length === 0 ? (
						<p className="text-slate-600">Nenhum vínculo cadastrado.</p>
					) : null}

					{!isLoading && links.length > 0 ? (
						<ul className="space-y-3">
							{links.map((link) => {
								const professional = professionalsById.get(link.professionalId);
								const service = servicesById.get(link.serviceId);

								return (
									<li
										className="rounded-md border border-slate-200 p-3"
										key={link.id}
									>
										<p className="font-semibold text-slate-900">
											{professional?.displayName ??
												"Profissional não encontrado"}
										</p>
										<p className="text-sm text-slate-700">
											Serviço: {service?.name ?? "Serviço não encontrado"}
										</p>
										<p className="text-sm text-slate-700">
											Preço: R$ {link.price.toFixed(2)}
										</p>
										<p className="text-sm text-slate-600">
											Status: {link.isActive ? "Ativo" : "Inativo"}
										</p>

										<div className="mt-3 flex items-center gap-2">
											<button
												className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
												disabled={isSavingLink}
												onClick={() => void startEditLink(link)}
												type="button"
											>
												Editar
											</button>
											<button
												className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
												disabled={isSavingLink}
												onClick={() => void handleDeleteLink(link)}
												type="button"
											>
												Excluir
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					) : null}
				</section>
			</div>
		</section>
	);
}
