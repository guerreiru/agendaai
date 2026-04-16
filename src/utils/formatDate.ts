function formatPtBrDate(
  iso: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    ...options,
  });
}

/**
 * Constrói um Date local a partir de data ISO (yyyy-mm-dd) e horário HH:mm.
 */
export function appointmentDateTime(date: string, time: string): Date {
  return new Date(`${date.slice(0, 10)}T${time}:00`);
}

/**
 * Formata data em ISO para "seg, 6 de abr de 2026"
 * Usado em listagens rápidas e resumos
 */
export function formatDate(iso: string): string {
  return formatPtBrDate(iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formata data em ISO para "seg, 06/04/2026"
 * Usado em agrupamentos e chaves
 */
export function formatDateShort(iso: string): string {
  return formatPtBrDate(iso, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Formata data em ISO para "segunda-feira, 6 de abril de 2026"
 * Usado em confirmações e seleções
 */
export function formatDateLong(iso: string): string {
  return formatPtBrDate(iso, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formata data em ISO para "segunda-feira, 06 de abril de 2026"
 * Usado em agrupamentos com data completa
 */
export function formatDateGroupLabel(iso: string): string {
  return formatPtBrDate(iso, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formata data simples em ISO para "6/4/2026" ou "04/06/2026" dependendo da locale
 */
export function formatDateSimple(iso: string): string {
  return formatPtBrDate(iso);
}

/**
 * Formata data e hora para "seg, 6 de abr de 2026 • 14:00 - 15:00"
 * Usado em listagens rápidas e resumos de agendamento
 */
export function formatDateTimeRange({
  date,
  startTime,
  endTime,
}: {
  date: string;
  startTime: string;
  endTime: string;
}): string {
  const day = formatDateShort(date);
  return `${day} • ${startTime} - ${endTime}`;
}
