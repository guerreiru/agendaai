/**
 * Generate a URL-friendly slug from a string
 * Handles accented characters by normalizing them
 * Example: "Jimmy Salão" -> "jimmy-salao"
 */
export function generateSlug(text: string): string {
  return (
    text
      // Convert to lowercase
      .toLowerCase()
      // Trim whitespace
      .trim()
      // Normalize unicode: decompose accented characters
      .normalize("NFD")
      // Remove diacritical marks (accents)
      .replace(/[\u0300-\u036f]/g, "")
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove any remaining special characters (keep only alphanumeric and hyphens)
      .replace(/[^a-z0-9-]/g, "")
      // Replace multiple hyphens with single hyphen
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
}
