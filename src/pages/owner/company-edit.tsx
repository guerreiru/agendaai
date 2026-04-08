import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { Select } from "../../components/ui/select";
import { useAuth } from "../../hooks/useAuth";
import { toApiError } from "../../services/api";
import {
	type CompanySlugStatus,
	checkCompanySlugStatus,
	getCompanyById,
	type UpdateCompanyPayload,
	updateCompany,
} from "../../services/api/companies";
import { getUserCompanyId } from "../../utils/company";
import { COMMON_TIMEZONES } from "../../utils/constants";
import { generateSlug } from "../../utils/slug";

const companyEditSchema = z.object({
	name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
	slug: z
		.string()
		.trim()
		.min(3, "Slug deve ter ao menos 3 caracteres")
		.regex(
			/^[a-z0-9-]+$/,
			"Slug deve conter apenas letras minúsculas, números e hífens",
		),
	phone: z
		.string()
		.trim()
		.optional()
		.refine((v) => {
			if (!v) return true;
			const digits = v.replace(/\D/g, "");
			return digits.length >= 10 && digits.length <= 11;
		}, "Telefone deve estar no formato, ex: 88999999999"),
	timezone: z.string().min(1, "Timezone é obrigatório"),
	autoConfirm: z.boolean(),
});

type CompanyEditForm = z.infer<typeof companyEditSchema>;

export function CompanyEditPage() {
	const navigate = useNavigate();
	const {
		user,
		accessToken,
		isLoading: authLoading,
		getCurrentUser,
	} = useAuth();
	const companyId = useMemo(() => getUserCompanyId(user), [user]);

	const [isLoadingCompany, setIsLoadingCompany] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [originalSlug, setOriginalSlug] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const [slugStatus, setSlugStatus] = useState<CompanySlugStatus>("idle");
	const [isCheckingSlug, setIsCheckingSlug] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
		reset,
	} = useForm<CompanyEditForm>({
		resolver: zodResolver(companyEditSchema),
		defaultValues: {
			name: "",
			slug: "",
			phone: "",
			timezone: "",
			autoConfirm: false,
		},
	});

	useEffect(() => {
		if (authLoading || !companyId) return;

		const load = async () => {
			setIsLoadingCompany(true);
			setLoadError(null);
			try {
				const company = await getCompanyById(companyId);
				reset({
					name: company.name,
					slug: company.slug,
					phone: company.phone ?? "",
					timezone: company.timezone,
					autoConfirm: company.autoConfirm,
				});
				setOriginalSlug(company.slug.toLowerCase());
			} catch {
				setLoadError("Não foi possível carregar os dados da empresa.");
			} finally {
				setIsLoadingCompany(false);
			}
		};

		void load();
	}, [authLoading, companyId, reset]);

	const nameValue = watch("name");
	const slugValue = watch("slug");

	useEffect(() => {
		if (!nameValue) return;
		const generated = generateSlug(nameValue);

		if (slugValue === originalSlug || slugValue === generateSlug(nameValue)) {
			setValue("slug", generated);
		}
	}, [nameValue, slugValue, originalSlug, setValue]);

	useEffect(() => {
		const normalizedSlug = slugValue.trim().toLowerCase();

		if (!normalizedSlug) {
			setSlugStatus("idle");
			setIsCheckingSlug(false);
			return;
		}

		if (normalizedSlug.length < 3) {
			setSlugStatus("invalid");
			setIsCheckingSlug(false);
			return;
		}

		if (normalizedSlug === originalSlug) {
			setSlugStatus("available");
			setIsCheckingSlug(false);
			return;
		}

		setSlugStatus("checking");
		setIsCheckingSlug(true);
		const timeout = setTimeout(async () => {
			try {
				const result = await checkCompanySlugStatus(normalizedSlug);
				setSlugStatus(result.status);
			} catch {
				setSlugStatus("error");
			} finally {
				setIsCheckingSlug(false);
			}
		}, 400);

		return () => clearTimeout(timeout);
	}, [slugValue, originalSlug]);

	async function onSubmit(values: CompanyEditForm) {
		if (!companyId) return;
		setSubmitError(null);
		setSubmitSuccess(false);
		setIsSubmitting(true);

		try {
			const normalizedPhone = values.phone?.replace(/\D/g, "") || null;

			const payload: UpdateCompanyPayload = {
				name: values.name.trim(),
				slug: values.slug.trim().toLowerCase(),
				phone: normalizedPhone,
				timezone: values.timezone,
				autoConfirm: values.autoConfirm,
			};

			await updateCompany(companyId, payload);
			await getCurrentUser(accessToken ?? undefined);
			setOriginalSlug(values.slug.trim().toLowerCase());
			setSubmitSuccess(true);
		} catch (error) {
			const parsed = toApiError(error);

			if (parsed.statusCode === 409) {
				setSubmitError("Este slug já está em uso. Escolha outro slug.");
				return;
			}

			setSubmitError(parsed.message);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (authLoading || isLoadingCompany) {
		return (
			<div className="grid min-h-[40vh] place-items-center text-slate-600">
				Carregando...
			</div>
		);
	}

	if (!companyId) {
		return (
			<div className="grid min-h-[40vh] place-items-center text-slate-600">
				<div className="text-center">
					<p className="font-semibold text-red-600">
						Nenhuma empresa encontrada
					</p>
					<p className="mt-2 text-sm">
						Você ainda não possui uma empresa vinculada.
					</p>
				</div>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className="grid min-h-[40vh] place-items-center">
				<div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-center text-sm text-red-700">
					{loadError}
					<button
						type="button"
						className="mt-3 block w-full rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-100"
						onClick={() => window.location.reload()}
					>
						Tentar novamente
					</button>
				</div>
			</div>
		);
	}

	const slugUnchanged = slugValue.trim().toLowerCase() === originalSlug;
	const canSubmit =
		!isSubmitting &&
		!isCheckingSlug &&
		(slugUnchanged || slugStatus === "available");

	return (
		<section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Editar Empresa</h1>
				<p className="mt-1 text-sm text-slate-600">
					Atualize os dados da sua empresa.
				</p>
			</header>

			{submitError && (
				<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
					{submitError}
				</div>
			)}

			{submitSuccess && (
				<div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
					Empresa atualizada com sucesso.
				</div>
			)}

			<form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
				<FormField
					label="Nome da Empresa"
					id="name"
					type="text"
					placeholder="Ex: Barbearia Centro"
					{...register("name")}
					error={errors.name}
				/>

				<div>
					<FormField
						label="Slug (URL amigável)"
						id="slug"
						type="text"
						placeholder="Ex: barbearia-centro"
						{...register("slug")}
						error={errors.slug}
					/>
					<div className="mt-1 flex items-center gap-2">
						<p className="flex-1 text-xs text-slate-500">
							Usado na URL pública:{" "}
							<span className="font-mono">/booking/{slugValue || "..."}</span>
						</p>
						{slugValue.trim().length > 0 && (
							<span
								className={`text-xs font-semibold ${
									isCheckingSlug || slugStatus === "checking"
										? "text-slate-500"
										: slugUnchanged || slugStatus === "available"
											? "text-green-600"
											: slugStatus === "invalid"
												? "text-amber-600"
												: "text-red-600"
								}`}
							>
								{isCheckingSlug || slugStatus === "checking"
									? "Verificando..."
									: slugUnchanged
										? "✓ Slug atual"
										: slugStatus === "available"
											? "✓ Disponível"
											: slugStatus === "invalid"
												? "! Slug inválido"
												: slugStatus === "error"
													? "! Erro de rede"
													: "✗ Indisponível"}
							</span>
						)}
					</div>
				</div>

				<FormField
					label="Telefone (opcional)"
					id="phone"
					type="tel"
					placeholder="88999999999"
					{...register("phone")}
					error={errors.phone}
					mask="00 00000-0000"
				/>

				<div>
					<label
						className="mb-2 block text-sm font-medium text-gray-900"
						htmlFor="timezone"
					>
						Timezone
					</label>
					<Select
						id="timezone"
						{...register("timezone")}
						error={errors.timezone}
						options={COMMON_TIMEZONES}
					/>
				</div>

				<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
					<label
						className="flex cursor-pointer items-start gap-3"
						htmlFor="autoConfirm"
					>
						<input
							className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
							id="autoConfirm"
							type="checkbox"
							{...register("autoConfirm")}
						/>
						<span>
							<span className="block text-sm font-medium text-gray-900">
								Confirmar agendamentos automaticamente
							</span>
							<span className="mt-1 block text-xs text-slate-600">
								Quando ativo, agendamentos criados por clientes serão
								confirmados automaticamente.
							</span>
						</span>
					</label>
				</div>

				<div className="flex gap-3 pt-4">
					<button
						className="rounded-lg bg-sky-700 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
						disabled={!canSubmit}
						type="submit"
					>
						{isSubmitting ? "Salvando..." : "Salvar alterações"}
					</button>

					<button
						className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
						disabled={isSubmitting}
						onClick={() => navigate("/owner/dashboard")}
						type="button"
					>
						Cancelar
					</button>
				</div>
			</form>
		</section>
	);
}
