export type ApiErrorDetails = Record<string, string[] | undefined>;

export class ApiError extends Error {
  readonly status?: number;
  readonly details?: ApiErrorDetails;

  constructor(message: string, status?: number, details?: ApiErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ErrorResponse = {
  response?: {
    status?: number;
    statusText?: string;
    data?: {
      error?: unknown;
      message?: unknown;
      details?: unknown;
    };
  };
  message?: string;
};

export function toApiError(error: unknown): ApiError {
  const candidate = error as ErrorResponse;
  const data = candidate.response?.data;

  const serverError = typeof data?.error === "string" ? data.error : undefined;
  const serverMessage =
    typeof data?.message === "string" ? data.message : undefined;
  const details =
    data?.details && typeof data.details === "object"
      ? (data.details as ApiErrorDetails)
      : undefined;

  const message =
    serverError ??
    serverMessage ??
    candidate.response?.statusText ??
    candidate.message ??
    "An unexpected error occurred";

  return new ApiError(message, candidate.response?.status, details);
}

/**
 * Renders a failure for a person.
 *
 * The envelope's `error` is often just "Validation failed", so the field
 * `details` are appended: the user then learns which field was rejected and
 * why, instead of guessing. A detail that already names its field is not
 * prefixed twice.
 */
export function formatApiError(error: unknown): string {
  const apiError = toApiError(error);
  const details = fieldDetails(apiError.details);
  if (details.length === 0) return apiError.message;
  return `${apiError.message} · ${details.join("; ")}`;
}

function fieldDetails(details?: ApiErrorDetails): string[] {
  if (!details) return [];

  const rendered: string[] = [];
  for (const [field, messages] of Object.entries(details)) {
    const message = messages?.find((entry) => entry.trim().length > 0);
    if (!message) continue;
    rendered.push(
      message.toLowerCase().startsWith(field.toLowerCase())
        ? message
        : `${field}: ${message}`,
    );
  }
  return rendered;
}
