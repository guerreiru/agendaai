import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import {
  createService,
  deleteService,
  listCompanyServices,
  updateService,
} from "../../services/api/services";
import { toApiError } from "../../services/api";
import type { Service } from "../../types/service";

const serviceSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  duration: z.number().int().positive("Duracao deve ser maior que zero"),
  description: z
    .string()
    .trim()
    .max(300, "Descricao deve ter no maximo 300 caracteres")
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
  const companyId = useMemo(() => getCompanyIdFromUser(user), [user]);

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

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
      setPageError("Usuario sem empresa vinculada.");
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
      setPageError("Usuario sem empresa vinculada.");
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
      reset({ name: "", duration: 30, description: "" });
      await loadServices();
    } catch (error) {
      setPageError(toApiError(error).message);
    } finally {
      setIsMutating(false);
    }
  }

  function startEdit(service: Service) {
    setEditingService(service);
    reset({
      name: service.name,
      duration: service.duration,
      description: service.description ?? "",
    });
  }

  function cancelEdit() {
    setEditingService(null);
    reset({ name: "", duration: 30, description: "" });
  }

  async function handleDelete(service: Service) {
    const confirmed = window.confirm(
      `Deseja excluir o servico "${service.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setPageError(null);

    try {
      await deleteService(service.id);
      await loadServices();
    } catch (error) {
      setPageError(toApiError(error).message);
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Gerenciar servicos da empresa
        </h1>
        <p className="text-sm text-slate-600">
          Visualize, crie, edite e exclua os servicos da sua empresa.
        </p>
      </header>

      <form
        className="space-y-4 rounded-lg border border-slate-200 p-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className="text-lg font-semibold text-slate-800">
          {editingService ? "Editar servico" : "Novo servico"}
        </h2>

        <FormField
          label="Nome"
          id="name"
          type="text"
          {...register("name")}
          error={errors.name}
        />

        <FormField
          label="Duracao (minutos)"
          id="duration"
          type="number"
          min={1}
          {...register("duration", { valueAsNumber: true })}
          error={errors.duration}
        />

        <FormField
          label="Descricao"
          id="description"
          type="text"
          {...register("description")}
          error={errors.description}
        />

        <div className="flex items-center gap-3">
          <button
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isMutating}
            type="submit"
          >
            {editingService ? "Salvar alteracoes" : "Criar servico"}
          </button>

          {editingService ? (
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              disabled={isMutating}
              onClick={cancelEdit}
              type="button"
            >
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      {pageError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {pageError}
        </p>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Servicos cadastrados
        </h2>

        {isLoading ? (
          <p className="text-slate-600">Carregando servicos...</p>
        ) : null}

        {!isLoading && services.length === 0 ? (
          <p className="text-slate-600">
            Nenhum servico cadastrado ate o momento.
          </p>
        ) : null}

        {!isLoading && services.length > 0 ? (
          <ul className="space-y-3">
            {services.map((service) => (
              <li
                className="rounded-lg border border-slate-200 p-4"
                key={service.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate-700">
                      Duracao: {service.duration} min
                    </p>
                    <p className="text-sm text-slate-600">
                      {service.description || "Sem descricao"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      disabled={isMutating}
                      onClick={() => startEdit(service)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isMutating}
                      onClick={() => void handleDelete(service)}
                      type="button"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
