/**
 * Formata data em ISO para "seg, 6 de abr de 2026"
 * Usado em listagens rápidas e resumos
 */
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("pt-BR", {
		timeZone: "UTC",
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
	return new Date(iso).toLocaleDateString("pt-BR", {
		timeZone: "UTC",
		weekday: "short",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

/**
 * Formata data em ISO para "segunda-feira, 6 de abril de 2026"
 * Usado em confirmações e seleções
 */
export function formatDateLong(iso: string): string {
	return new Date(iso).toLocaleDateString("pt-BR", {
		timeZone: "UTC",
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
	return new Date(iso).toLocaleDateString("pt-BR", {
		timeZone: "UTC",
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
	return new Date(iso).toLocaleDateString("pt-BR", {
		timeZone: "UTC",
	});
}
