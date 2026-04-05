import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import {
  getCompanyById,
  updateCompany,
  checkCompanySlugAvailability,
  type UpdateCompanyPayload,
} from "../../services/api/companies";
import { toApiError } from "../../services/api";
import { getUserCompanyId } from "../../utils/company";
import { generateSlug } from "../../utils/slug";

const companyEditSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug deve ter ao menos 2 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens",
    ),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^\+[1-9]\d{7,14}$/.test(v),
      "Telefone deve estar no formato E.164, ex: +5511999999999",
    ),
  timezone: z.string().min(1, "Timezone é obrigatório"),
});

type CompanyEditForm = z.infer<typeof companyEditSchema>;

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

export function CompanyEditPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, getCurrentUser } = useAuth();
  const companyId = useMemo(() => getUserCompanyId(user), [user]);

  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
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
    defaultValues: { name: "", slug: "", phone: "", timezone: "" },
  });

  // Load current company data
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
        });
        setOriginalSlug(company.slug);
      } catch {
        setLoadError("Não foi possível carregar os dados da empresa.");
      } finally {
        setIsLoadingCompany(false);
      }
    };

    void load();
  }, [authLoading, companyId, reset]);

  // Auto-generate slug from name only if slug still matches the auto-generated version of the original name
  const nameValue = watch("name");
  const slugValue = watch("slug");

  useEffect(() => {
    if (!nameValue) return;
    const generated = generateSlug(nameValue);
    // Only auto-update if the current slug is either the original or was previously auto-generated
    if (slugValue === originalSlug || slugValue === generateSlug(nameValue)) {
      setValue("slug", generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameValue]);

  // Slug availability check — skip if unchanged from original
  useEffect(() => {
    if (!slugValue || slugValue.length < 2) {
      setSlugAvailable(null);
      return;
    }

    if (slugValue === originalSlug) {
      setSlugAvailable(true);
      return;
    }

    setIsCheckingSlug(true);
    const timeout = setTimeout(async () => {
      try {
        const available = await checkCompanySlugAvailability(slugValue);
        setSlugAvailable(available);
      } catch {
        setSlugAvailable(false);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [slugValue, originalSlug]);

  async function onSubmit(values: CompanyEditForm) {
    if (!companyId) return;
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      const payload: UpdateCompanyPayload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        phone: values.phone?.trim() || null,
        timezone: values.timezone,
      };

      await updateCompany(companyId, payload);
      await getCurrentUser();
      setOriginalSlug(values.slug.trim());
      setSubmitSuccess(true);
    } catch (error) {
      const parsed = toApiError(error);
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
            className="mt-3 block w-full rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-100"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const slugUnchanged = slugValue === originalSlug;
  const canSubmit =
    !isSubmitting &&
    !isCheckingSlug &&
    (slugUnchanged || slugAvailable === true);

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
            {slugValue && slugValue.length >= 2 && (
              <span
                className={`text-xs font-semibold ${
                  isCheckingSlug
                    ? "text-slate-500"
                    : slugUnchanged || slugAvailable
                      ? "text-green-600"
                      : "text-red-600"
                }`}
              >
                {isCheckingSlug
                  ? "Verificando..."
                  : slugUnchanged
                    ? "✓ Slug atual"
                    : slugAvailable
                      ? "✓ Disponível"
                      : "✗ Indisponível"}
              </span>
            )}
          </div>
        </div>

        <FormField
          label="Telefone (opcional)"
          id="phone"
          type="tel"
          placeholder="+5511999999999"
          {...register("phone")}
          error={errors.phone}
        />

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
          {errors.timezone && (
            <p className="mt-1 text-sm text-red-600">
              {errors.timezone.message}
            </p>
          )}
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
