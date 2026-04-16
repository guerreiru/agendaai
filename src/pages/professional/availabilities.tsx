import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { FormField } from "../../components/ui/formField";
import { useApiError } from "../../hooks/useApiError";
import { useAuth } from "../../hooks/useAuth";
import {
  createAvailability,
  createAvailabilityException,
  createBatchAvailabilities,
  deleteAvailability,
  deleteAvailabilityException,
  listProfessionalAvailabilities,
  listProfessionalAvailabilityExceptions,
  updateAvailability,
} from "../../services/api/availabilities";
import { queryKeys } from "../../services/queryKeys";
import type {
  Availability,
  AvailabilityException,
} from "../../types/availability";
import { getUserCompanyId } from "../../utils/company";
import { weekdays } from "../../utils/constants";

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

export function ProfessionalAvailabilitiesPage() {
  const { user } = useAuth();
  const handleApiError = useApiError();
  const queryClient = useQueryClient();

  const professionalId = user?.id ?? "";
  const companyId = getUserCompanyId(user);

  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [editingAvailability, setEditingAvailability] =
    useState<Availability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [batchWeekdays, setBatchWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [batchStartTime, setBatchStartTime] = useState("09:00");
  const [batchEndTime, setBatchEndTime] = useState("18:00");
  const [batchIsActive, setBatchIsActive] = useState(true);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionStartTime, setExceptionStartTime] = useState("09:00");
  const [exceptionEndTime, setExceptionEndTime] = useState("10:00");
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionAllDay, setExceptionAllDay] = useState(true);

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

  const loadAvailabilities = useCallback(async () => {
    if (!professionalId) {
      setPageError("Profissional não identificado.");
      return;
    }

    setIsLoading(true);
    setPageError(null);

    try {
      const response = await listProfessionalAvailabilities(professionalId);
      setAvailabilities(response);
    } catch (error) {
      const result = handleApiError(error);
      if (!result) return;
      setPageError(result.message);
      setAvailabilities([]);
    } finally {
      setIsLoading(false);
    }
  }, [professionalId, handleApiError]);

  const loadAvailabilityExceptions = useCallback(async () => {
    if (!professionalId) {
      setExceptions([]);
      return;
    }

    try {
      const response =
        await listProfessionalAvailabilityExceptions(professionalId);
      setExceptions(response);
    } catch (error) {
      const result = handleApiError(error);
      if (!result) return;
      setPageError(result.message);
      setExceptions([]);
    }
  }, [professionalId, handleApiError]);

  useEffect(() => {
    void loadAvailabilities();
  }, [loadAvailabilities]);

  useEffect(() => {
    void loadAvailabilityExceptions();
  }, [loadAvailabilityExceptions]);

  async function onSubmit(values: AvailabilityForm) {
    if (!professionalId) {
      setPageError("Profissional não identificado.");
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
          professionalId,
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
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(companyId),
        });
      }
    } catch (error) {
      const result = handleApiError(error);
      if (!result) return;
      if (result.type === "conflict") {
        setPageError(
          "Conflito de horário: o período se sobrepõe a outro existente.",
        );
      } else {
        setPageError(result.message);
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
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(companyId),
        });
      }
    } catch (error) {
      const result = handleApiError(error);
      if (!result) return;
      setPageError(result.message);
    } finally {
      setIsSaving(false);
    }
  }

  function toggleBatchWeekday(weekday: number) {
    setBatchWeekdays((current) => {
      if (current.includes(weekday)) {
        return current.filter((day) => day !== weekday);
      }

      return [...current, weekday].sort((a, b) => a - b);
    });
  }

  function setBusinessDaysPreset() {
    setBatchWeekdays([1, 2, 3, 4, 5]);
  }

  function clearBatchWeekdays() {
    setBatchWeekdays([]);
  }

  async function handleCreateBatchAvailabilities() {
    if (!professionalId) {
      setPageError("Profissional não identificado.");
      return;
    }

    if (batchWeekdays.length === 0) {
      setPageError("Selecione ao menos um dia da semana para criar em lote.");
      return;
    }

    if (batchStartTime >= batchEndTime) {
      setPageError("Hora inicial deve ser menor que hora final no lote.");
      return;
    }

    setIsSaving(true);
    setPageError(null);

    try {
      await createBatchAvailabilities({
        professionalId,
        slots: batchWeekdays.map((weekday) => ({
          weekday,
          startTime: batchStartTime,
          endTime: batchEndTime,
          isActive: batchIsActive,
        })),
      });

      await loadAvailabilities();
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(companyId),
        });
      }
    } catch (error) {
      const result = handleApiError(error);
      if (!result) return;

      if (result.type === "conflict") {
        setPageError(
          "Conflito de horários no lote: existe sobreposição com disponibilidades já cadastradas.",
        );
        return;
      }

      setPageError(result.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateException() {
    if (!professionalId) {
      setPageError("Profissional não identificado.");
      return;
    }

    if (!exceptionDate) {
      setPageError("Selecione a data da exceção.");
      return;
    }

    if (!exceptionAllDay && exceptionStartTime >= exceptionEndTime) {
      setPageError("Hora inicial da exceção deve ser menor que hora final.");
      return;
    }

    setIsSaving(true);
    setPageError(null);

    try {
      await createAvailabilityException({
        professionalId,
        type: exceptionAllDay ? "BLOCK" : "BREAK",
        startDate: exceptionAllDay
          ? `${exceptionDate}T00:00:00`
          : `${exceptionDate}T${exceptionStartTime}:00`,
        endDate: exceptionAllDay
          ? `${exceptionDate}T23:59:59`
          : `${exceptionDate}T${exceptionEndTime}:00`,
        title: exceptionReason.trim() || "Indisponibilidade",
        description: exceptionReason.trim() || undefined,
      });

      await loadAvailabilityExceptions();

      setExceptionDate("");
      setExceptionReason("");
      setExceptionAllDay(true);
      setExceptionStartTime("09:00");
      setExceptionEndTime("10:00");
    } catch (error) {
      const result = handleApiError(error);
      if (!result) return;
      setPageError(result.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteException(exceptionId: string) {
    const confirmed = window.confirm("Deseja excluir esta exceção de agenda?");
    if (!confirmed) {
      return;
    }

    if (!professionalId) {
      setPageError("Profissional não identificado.");
      return;
    }

    setIsSaving(true);
    setPageError(null);

    try {
      await deleteAvailabilityException(professionalId, exceptionId);
      await loadAvailabilityExceptions();
    } catch (error) {
      const result = handleApiError(error);
      if (!result) return;
      setPageError(result.message);
    } finally {
      setIsSaving(false);
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

  const groupedExceptionsByDate = useMemo(() => {
    const grouped = new Map<string, AvailabilityException[]>();

    for (const exception of exceptions) {
      const key = exception.date;
      const current = grouped.get(key) ?? [];
      current.push(exception);
      grouped.set(key, current);
    }

    return Array.from(grouped.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [exceptions]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Minha disponibilidade
        </h1>
        <p className="text-sm text-slate-600">
          Defina seus períodos semanais de atendimento.
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
              <FormField
                label="Início"
                id="startTime"
                type="time"
                {...register("startTime")}
              />

              <FormField
                label="Fim"
                id="endTime"
                type="time"
                {...register("endTime")}
              />
            </div>

            {errors.endTime ? (
              <p className="text-sm text-red-600">{errors.endTime.message}</p>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" {...register("isActive")} />
              Período ativo
            </label>

            <div className="flex items-center gap-3">
              <Button disabled={isSaving} type="submit">
                {editingAvailability ? "Salvar" : "Adicionar"}
              </Button>

              {editingAvailability ? (
                <Button
                  variant="destructive"
                  disabled={isSaving}
                  onClick={cancelEdit}
                  type="button"
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-base font-semibold text-slate-800">
              Criação em lote
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Aplique o mesmo horário para múltiplos dias da semana.
            </p>

            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {weekdays.map((weekday) => {
                  const isSelected = batchWeekdays.includes(weekday.value);

                  return (
                    <button
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                      key={`batch-day-${weekday.value}`}
                      onClick={() => toggleBatchWeekday(weekday.value)}
                      type="button"
                    >
                      {weekday.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={setBusinessDaysPreset}
                  type="button"
                >
                  Segunda a sexta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearBatchWeekdays}
                  type="button"
                >
                  Limpar dias
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Início (lote)"
                  id="batchStartTime"
                  onChange={(event) => setBatchStartTime(event.target.value)}
                  type="time"
                  value={batchStartTime}
                />

                <FormField
                  label="Fim (lote)"
                  id="batchEndTime"
                  onChange={(event) => setBatchEndTime(event.target.value)}
                  type="time"
                  value={batchEndTime}
                />
              </div>

              <FormField
                label="Períodos do lote ativos"
                className="flex items-center gap-2 text-sm text-slate-800"
                id="batchIsActive"
                onChange={(event) => setBatchIsActive(event.target.checked)}
                type="checkbox"
                checked={batchIsActive}
              />

              <Button
                disabled={isSaving || batchWeekdays.length === 0}
                onClick={() => void handleCreateBatchAvailabilities()}
                type="button"
              >
                {isSaving
                  ? "Criando lote..."
                  : "Criar disponibilidades em lote"}
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Grade semanal
          </h2>
          {isLoading ? <p className="text-slate-600">Carregando...</p> : null}

          {!isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
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
                            <Button
                              variant="secondary"
                              onClick={() => startEdit(item)}
                              type="button"
                            >
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => void handleDelete(item)}
                              type="button"
                            >
                              Excluir
                            </Button>
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
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-800">
          Exceções de agenda
        </h2>
        <p className="text-sm text-slate-600">
          Cadastre bloqueios e pausas pontuais por data.
        </p>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            label="Data"
            id="exceptionDate"
            type="date"
            value={exceptionDate}
            onChange={(event) => setExceptionDate(event.target.value)}
          />

          {!exceptionAllDay ? (
            <>
              <FormField
                label="Início"
                id="exceptionStartTime"
                type="time"
                value={exceptionStartTime}
                onChange={(event) => setExceptionStartTime(event.target.value)}
              />
              <FormField
                label="Fim"
                id="exceptionEndTime"
                type="time"
                value={exceptionEndTime}
                onChange={(event) => setExceptionEndTime(event.target.value)}
              />
            </>
          ) : null}

          <FormField
            label="Motivo (opcional)"
            id="exceptionReason"
            type="text"
            value={exceptionReason}
            onChange={(event) => setExceptionReason(event.target.value)}
            placeholder="Ex: Pausa, feriado, compromisso"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={exceptionAllDay}
            onChange={(event) => setExceptionAllDay(event.target.checked)}
          />
          Bloquear dia inteiro
        </label>

        <Button
          type="button"
          disabled={isSaving}
          onClick={() => void handleCreateException()}
        >
          {isSaving ? "Salvando..." : "Adicionar exceção"}
        </Button>

        {groupedExceptionsByDate.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma exceção cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {groupedExceptionsByDate.map(([date, dateExceptions]) => (
              <div
                key={date}
                className="rounded-lg border border-slate-200 p-3"
              >
                <h3 className="text-sm font-semibold text-slate-800">{date}</h3>
                <div className="mt-2 space-y-2">
                  {dateExceptions.map((exception) => (
                    <div
                      key={exception.id}
                      className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {exception.startDate && exception.endDate
                            ? `${exception.startTime} - ${exception.endTime}`
                            : "Dia inteiro"}
                        </p>
                        <p className="text-xs text-slate-600">
                          {exception.reason || "Sem motivo informado"}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        type="button"
                        onClick={() => void handleDeleteException(exception.id)}
                        disabled={isSaving}
                      >
                        Excluir
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
