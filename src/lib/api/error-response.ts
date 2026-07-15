import { NextResponse } from "next/server";

import { captureCaughtException } from "@/lib/monitoring/capture-exception";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500;

type ApiErrorOptions = {
  details?: unknown;
  headers?: HeadersInit;
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: ApiErrorStatus,
  options: ApiErrorOptions = {},
) {
  return NextResponse.json(
    {
      success: false,
      // Temporary compatibility field for existing clients during migration.
      message,
      error: {
        code,
        message,
        ...(options.details === undefined ? {} : { details: options.details }),
      },
    },
    { status, headers: options.headers },
  );
}

export function logApiError(context: string, error: unknown): void {
  captureCaughtException(error, context);

  if (process.env.NODE_ENV === "production") {
    const errorType = error instanceof Error ? error.name : typeof error;
    console.error(`[${context}] ${errorType}`);
    return;
  }

  console.error(`[${context}]`, error);
}
