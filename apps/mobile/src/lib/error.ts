import axios from "axios";
import i18n from "./i18n";

/**
 * API error response shape: `{ error: string, details?: unknown }`.
 */
interface ApiErrorBody {
  error?: string;
  message?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
}

/**
 * Extract a human-readable error message from an unknown thrown value.
 *
 * Handles:
 * - Axios network errors (no response received)
 * - API error responses (`{ error: "..." }`)
 * - API validation errors (`{ details: { fieldErrors } }`)
 * - Plain Error instances
 * - Falls back to the provided default message
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    // Network error — device offline, wrong URL, server unreachable
    if (!error.response && error.message === "Network Error") {
      return i18n.t("auth.errors.networkError");
    }

    const body = error.response?.data as ApiErrorBody | undefined;
    if (body) {
      // Validation error with field details — build a readable message
      if (body.details?.fieldErrors) {
        const fields = body.details.fieldErrors;
        const messages = Object.entries(fields)
          .filter(([, msgs]) => msgs.length > 0)
          .map(([field, msgs]) => `${field}: ${msgs[0]}`);
        if (messages.length > 0) return messages.join("\n");
      }

      // Simple error message from API
      if (body.error) return body.error;
      if (body.message) return body.message;
    }
  }

  if (error instanceof Error && error.message !== `Request failed with status code ${(error as { status?: number }).status}`) {
    return error.message;
  }

  return fallback;
}
