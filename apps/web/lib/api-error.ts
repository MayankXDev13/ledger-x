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
