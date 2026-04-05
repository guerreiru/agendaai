export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
