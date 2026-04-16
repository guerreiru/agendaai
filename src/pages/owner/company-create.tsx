import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarCheck2, Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { FormField } from "../../components/ui/formField";
import { PageLoader } from "../../components/ui/PageLoader";
import { Select } from "../../components/ui/select";
import { useAuth } from "../../hooks/useAuth";
import { toApiError } from "../../services/api";
import {
  type CompanySlugStatus,
  type CreateCompanyPayload,
  checkCompanySlugStatus,
  createCompany,
} from "../../services/api/companies";
import { COMMON_TIMEZONES } from "../../utils/constants";
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
    return <PageLoader />;
  }

  // Only COMPANY_OWNER can access
  if (!user || user.role !== "COMPANY_OWNER") {
    return (
      <div className="grid min-h-[40vh] place-items-center text-slate-600">
        <div className="text-center">
          <p className="font-semibold text-red-600">Acesso negado</p>
          <p className="mt-2 text-sm">
            Apenas donos de empresa podem criar uma empresa.
          </p>
        </div>
      </div>
    );
  }

  const normalizedSlug = slugValue.trim().toLowerCase();
  const showSlugFeedback = normalizedSlug.length > 0;
  const slugFeedbackClass =
    isCheckingSlug || slugStatus === "checking"
      ? "border-slate-200 bg-slate-50 text-slate-600"
      : slugStatus === "available"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : slugStatus === "invalid"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-red-200 bg-red-50 text-red-700";
  const slugFeedbackText =
    isCheckingSlug || slugStatus === "checking"
      ? "Verificando disponibilidade da URL..."
      : slugStatus === "available"
        ? `Sua URL: plannie.app/${normalizedSlug}`
        : slugStatus === "invalid"
          ? "URL inválida. Use ao menos 3 caracteres (a-z, 0-9 e hífen)."
          : slugStatus === "error"
            ? "Não foi possível validar a URL agora."
            : "Esta URL já está em uso. Escolha outra.";
  const canSubmit =
    !isSubmitting && !isCheckingSlug && slugStatus === "available";

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Cadastrar Empresa
        </h1>
        <p className="text-sm text-slate-500">
          Preencha os dados para criar sua empresa
        </p>
      </header>

      {submitError && <AlertBanner message={submitError} />}

      {submitSuccess && (
        <AlertBanner
          variant="success"
          message="Empresa criada com sucesso. Redirecionando..."
        />
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
                <input
                  className="w-full px-3 py-2.5 text-sm text-slate-700 outline-none"
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
            <p className="mt-1 text-xs text-slate-500">
              Timezone detectado do seu navegador: {browserTimezone}
            </p>
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

        <input type="hidden" {...register("ownerId")} />

        <div className="flex gap-3 pt-2">
          <button
            className="rounded-lg bg-slate-950 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canSubmit}
            type="submit"
          >
            {isSubmitting ? "Criando..." : "Salvar alterações"}
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
