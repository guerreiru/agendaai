import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import { toApiError } from "../../services/api";
import {
	type CompanySlugStatus,
	type CreateCompanyPayload,
	checkCompanySlugStatus,
	createCompany,
} from "../../services/api/companies";
import { generateSlug } from "../../utils/slug";

const companySchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Nome da empresa é obrigatório")
		.min(2, "Nome deve ter ao menos 2 caracteres"),
	slug: z
		.string()
		.trim()
		.min(1, "Slug é obrigatório")
		.min(3, "Slug deve ter ao menos 3 caracteres")
		.regex(
			/^[a-z0-9-]+$/,
			"Slug deve conter apenas letras minúsculas, números e hífens",
		),
	timezone: z.string().min(1, "Timezone é obrigatório"),
	ownerId: z.string().uuid("ID do dono inválido"),
	autoConfirm: z.boolean(),
});

type CompanyForm = z.infer<typeof companySchema>;

function getBrowserTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		return "America/Sao_Paulo"; // fallback
	}
}

const COMMON_TIMEZONES = [
	"America/Sao_Paulo",
	"America/Manaus",
	"America/Recife",
	"America/Fortaleza",
	"America/Cuiaba",
	"America/Araguaina",
	"America/Buenos_Aires",
	"America/Bogota",
	"America/Caracas",
	"America/Guayaquil",
	"America/Lima",
	"UTC",
];

export function CompanyCreatePage() {
	const navigate = useNavigate();
	const {
		user,
		accessToken,
		isLoading: authLoading,
		getCurrentUser,
	} = useAuth();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [slugStatus, setSlugStatus] = useState<CompanySlugStatus>("idle");
	const [isCheckingSlug, setIsCheckingSlug] = useState(false);

	const browserTimezone = useMemo(() => getBrowserTimezone(), []);

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
	} = useForm<CompanyForm>({
		resolver: zodResolver(companySchema),
		defaultValues: {
			name: "",
			slug: "",
			timezone: browserTimezone,
			ownerId: "",
			autoConfirm: false,
		},
	});

	// Auto-fill ownerId for COMPANY_OWNER and timezone on mount
	useEffect(() => {
		if (!authLoading && user) {
			if (user.role === "COMPANY_OWNER") {
				setValue("ownerId", user.id);
			}
			setValue("timezone", browserTimezone);
		}
	}, [authLoading, user, browserTimezone, setValue]);

	// Convert name to slug automatically
	const nameValue = watch("name");
	const slugValue = watch("slug");

	useEffect(() => {
		if (nameValue) {
			const generatedSlug = generateSlug(nameValue);
			setValue("slug", generatedSlug);
			setSlugStatus("idle");
		}
	}, [nameValue, setValue]);

	// Check slug availability with debounce
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
	}, [slugValue]);

	async function onSubmit(values: CompanyForm) {
		setSubmitError(null);
		setSubmitSuccess(false);
		setIsSubmitting(true);

		try {
			const payload: CreateCompanyPayload = {
				name: values.name.trim(),
				slug: values.slug.trim().toLowerCase(),
				timezone: values.timezone,
				ownerId: values.ownerId,
				autoConfirm: values.autoConfirm,
			};

			await createCompany(payload);
			setSubmitSuccess(true);

			// Refresh user context with updated company data
			await getCurrentUser(accessToken ?? undefined);

			// Success: give quick visual feedback before redirect
			setTimeout(() => {
				navigate("/owner/dashboard", { replace: true });
			}, 900);
		} catch (error) {
			const parsedError = toApiError(error);

			if (parsedError.statusCode === 409) {
				setSubmitError("Este slug já está em uso. Escolha outro slug.");
				return;
			}

			setSubmitError(parsedError.message);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (authLoading) {
		return (
			<div className="grid min-h-[40vh] place-items-center text-slate-600">
				Carregando...
			</div>
		);
	}

	// Only COMPANY_OWNER can access
	if (!user || user.role !== "COMPANY_OWNER") {
		return (
			<div className="grid min-h-[40vh] place-items-center text-slate-600">
				<div className="text-center">
					<p className="text-red-600 font-semibold">Acesso negado</p>
					<p className="text-sm mt-2">
						Apenas donos de empresa podem criar uma empresa.
					</p>
				</div>
			</div>
		);
	}

	return (
		<section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Cadastrar Empresa</h1>
				<p className="text-sm text-slate-600 mt-1">
					Preencha os dados para criar sua empresa.
				</p>
			</header>

			{submitError ? (
				<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
					{submitError}
				</div>
			) : null}

			{submitSuccess ? (
				<div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
					Empresa criada com sucesso. Redirecionando...
				</div>
			) : null}

			<form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
				<FormField
					label="Nome da Empresa"
					id="name"
					type="text"
					placeholder="Ex: Barbearia Centro"
					{...register("name")}
					error={errors.name}
				/>

				<FormField
					label="Slug (URL amigável)"
					id="slug"
					type="text"
					placeholder="Ex: barbearia-centro"
					{...register("slug")}
					error={errors.slug}
				/>
				<div className="flex items-center gap-2 -mt-2">
					<p className="text-xs text-slate-500 flex-1">
						Editável manualmente. Gerado automaticamente do nome.
					</p>
					{slugValue.trim().length > 0 && (
						<div className="flex items-center gap-1">
							{slugStatus === "checking" || isCheckingSlug ? (
								<span className="text-xs text-slate-500">Verificando...</span>
							) : slugStatus === "available" ? (
								<span className="text-xs text-green-600 font-semibold">
									✓ Disponível
								</span>
							) : slugStatus === "invalid" ? (
								<span className="text-xs text-amber-600 font-semibold">
									! Slug inválido
								</span>
							) : slugStatus === "error" ? (
								<span className="text-xs text-slate-500 font-semibold">
									! Erro de rede
								</span>
							) : (
								<span className="text-xs text-red-600 font-semibold">
									✗ Indisponível
								</span>
							)}
						</div>
					)}
				</div>

				<div>
					<label
						className="mb-2 block text-sm font-medium text-gray-900"
						htmlFor="timezone"
					>
						Timezone
					</label>
					<select
						className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
						id="timezone"
						{...register("timezone")}
					>
						{COMMON_TIMEZONES.map((tz) => (
							<option key={tz} value={tz}>
								{tz}
							</option>
						))}
					</select>
					{errors.timezone ? (
						<p className="mt-1 text-sm text-red-600">
							{errors.timezone.message}
						</p>
					) : null}
					<p className="mt-1 text-xs text-slate-500">
						Timezone detectado do seu navegador: {browserTimezone}
					</p>
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

				{/* ownerId is auto-filled for COMPANY_OWNER and hidden */}
				<input type="hidden" {...register("ownerId")} />

				<div className="flex gap-3 pt-4">
					<button
						className="rounded-lg bg-sky-700 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
						disabled={
							isSubmitting || isCheckingSlug || slugStatus !== "available"
						}
						type="submit"
					>
						{isSubmitting ? "Criando..." : "Criar Empresa"}
					</button>

					<button
						className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
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
