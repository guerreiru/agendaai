/**
 * Strips non-digit characters from a phone string.
 * Returns null if empty after stripping.
 */
export function normalizePhone(
  phone: string | undefined | null,
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits || null;
}
