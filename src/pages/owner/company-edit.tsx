import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarCheck2, Globe } from "lucide-react";
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
				console.log(company);
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
	const normalizedSlug = slugValue.trim().toLowerCase();
	const showSlugFeedback = normalizedSlug.length > 0;
	const slugFeedbackClass =
		isCheckingSlug || slugStatus === "checking"
			? "border-slate-200 bg-slate-50 text-slate-600"
			: slugUnchanged || slugStatus === "available"
				? "border-emerald-200 bg-emerald-50 text-emerald-700"
				: slugStatus === "invalid"
					? "border-amber-200 bg-amber-50 text-amber-700"
					: "border-red-200 bg-red-50 text-red-700";
	const slugFeedbackText =
		isCheckingSlug || slugStatus === "checking"
			? "Verificando disponibilidade da URL..."
			: slugUnchanged
				? `Sua URL: plannie.app/${normalizedSlug}`
				: slugStatus === "available"
					? `Sua URL: plannie.app/${normalizedSlug}`
					: slugStatus === "invalid"
						? "URL inválida. Use ao menos 3 caracteres (a-z, 0-9 e hífen)."
						: slugStatus === "error"
							? "Não foi possível validar a URL agora."
							: "Esta URL já está em uso. Escolha outra.";

	return (
		<section className="space-y-5">
			<header className="space-y-1">
				<h1 className="text-3xl font-bold tracking-tight text-slate-950">
					Configurações da Empresa
				</h1>
				<p className="text-sm text-slate-500">
					Gerencie as informações e configurações da sua empresa
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
				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="mb-4 flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
							<Building2 className="size-4" />
						</div>
						<h2 className="text-lg font-semibold text-slate-950">
							Informações da Empresa
						</h2>
					</div>

					<div className="space-y-4">
						<FormField
							label="Nome da Empresa"
							id="name"
							type="text"
							placeholder="Ex: Barbearia Centro"
							required
							{...register("name")}
							error={errors.name}
						/>

						<div className="space-y-2">
							<label
								className="block text-sm font-medium text-gray-700"
								htmlFor="slug"
							>
								URL Personalizada <span className="ml-1 text-red-500">*</span>
							</label>
							<div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-orange-600 focus-within:ring-2 focus-within:ring-orange-200">
								<span className="inline-flex items-center border-r border-gray-300 bg-slate-50 px-3 text-xs font-medium text-slate-600">
									plannie.app/
								</span>
								<FormField
									className="w-full outline-none border-none focus:ring-0 outline-offset-0 focus:ring-transparent"
									id="slug"
									placeholder="salao-beleza-premium"
									type="text"
									{...register("slug")}
								/>
							</div>
							{errors.slug && (
								<p className="text-sm text-red-600">{errors.slug.message}</p>
							)}
							{showSlugFeedback && (
								<div
									className={`rounded-md border px-3 py-2 text-xs font-medium ${slugFeedbackClass}`}
								>
									{slugFeedbackText}
								</div>
							)}
						</div>

						<FormField
							label="Telefone"
							id="phone"
							type="tel"
							placeholder="(88) 99999-9999"
							{...register("phone")}
							error={errors.phone}
							mask="00 00000-0000"
						/>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="mb-4 flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
							<Globe className="size-4" />
						</div>
						<h2 className="text-lg font-semibold text-slate-950">
							Configurações Regionais
						</h2>
					</div>

					<div>
						<label
							className="mb-2 block text-sm font-medium text-gray-700"
							htmlFor="timezone"
						>
							Fuso Horário <span className="ml-1 text-red-500">*</span>
						</label>
						<Select
							id="timezone"
							{...register("timezone")}
							error={errors.timezone}
							options={COMMON_TIMEZONES}
						/>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="mb-4 flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
							<CalendarCheck2 className="size-4" />
						</div>
						<h2 className="text-lg font-semibold text-slate-950">
							Configurações de Agendamento
						</h2>
					</div>

					<label
						className="flex cursor-pointer items-start gap-3"
						htmlFor="autoConfirm"
					>
						<input
							className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
							id="autoConfirm"
							type="checkbox"
							{...register("autoConfirm")}
						/>
						<span>
							<span className="block text-sm font-medium text-gray-900">
								Confirmação Automática de Agendamentos
							</span>
							<span className="mt-1 block text-xs text-slate-500">
								Os agendamentos serão confirmados automaticamente sem
								necessidade de aprovação manual
							</span>
						</span>
					</label>
				</div>

				<div className="flex gap-3 pt-2">
					<button
						className="rounded-lg bg-slate-950 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
