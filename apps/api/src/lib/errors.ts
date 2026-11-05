import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodError } from "zod";
import type { AppEnv } from "../types/hono";

export type ErrorDetails = Record<string, string[] | undefined>;

export class ApiError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    message: string,
    public readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function validationResponse(ctx: Context<AppEnv>, error: ZodError) {
  return ctx.json(
    {
      error: "Validation failed",
      details: error.flatten().fieldErrors as ErrorDetails,
    },
    400,
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}
