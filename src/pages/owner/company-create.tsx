import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import {
  createCompany,
  checkCompanySlugAvailability,
  type CreateCompanyPayload,
} from "../../services/api/companies";
import { toApiError } from "../../services/api";
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
    .min(2, "Slug deve ter ao menos 2 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens",
    ),
  timezone: z.string().min(1, "Timezone é obrigatório"),
  ownerId: z.string().uuid("ID do dono inválido"),
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
  const { user, isLoading: authLoading, getCurrentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
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
      const slugValue = generateSlug(nameValue);
      setValue("slug", slugValue);
      setSlugAvailable(null); // Reset availability check when auto-generating
    }
  }, [nameValue, setValue]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slugValue || slugValue.length < 2) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    const timeout = setTimeout(async () => {
      try {
        const available = await checkCompanySlugAvailability(slugValue);
        setSlugAvailable(available);
      } catch {
        // Network error or other issue - assume unavailable
        setSlugAvailable(false);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeout);
  }, [slugValue]);

  async function onSubmit(values: CompanyForm) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateCompanyPayload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        timezone: values.timezone,
        ownerId: values.ownerId,
      };

      await createCompany(payload);

      // Refresh user context with updated company data
      await getCurrentUser();

      // Success: redirect to owner dashboard
      navigate("/owner/dashboard", { replace: true });
    } catch (error) {
      const parsedError = toApiError(error);
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
          {slugValue && slugValue.length >= 2 && (
            <div className="flex items-center gap-1">
              {isCheckingSlug ? (
                <span className="text-xs text-slate-500">Verificando...</span>
              ) : slugAvailable ? (
                <span className="text-xs text-green-600 font-semibold">
                  ✓ Disponível
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

        {/* ownerId is auto-filled for COMPANY_OWNER and hidden */}
        <input type="hidden" {...register("ownerId")} />

        <div className="flex gap-3 pt-4">
          <button
            className="rounded-lg bg-sky-700 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            disabled={isSubmitting || !slugAvailable || isCheckingSlug}
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
