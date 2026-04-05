import DOMPurify from "dompurify";

/**
 * Sanitize user-provided strings to prevent XSS attacks
 * Used when rendering data from API that users can modify
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content
  });
}

/**
 * Sanitize text input safely (minimal sanitization)
 * Plain text only, no HTML
 */
export function sanitizeText(text: unknown): string {
  if (typeof text !== "string") {
    return "";
  }

  return text
    .replace(/[<>]/g, "") // Remove angle brackets
    .trim();
}

/**
 * Sanitize company/service names and similar fields
 * Prevents stored XSS from user input
 */
export function sanitizeUserInput(input: unknown): string {
  const sanitized = sanitizeText(input);
  return sanitizeHTML(sanitized);
}
