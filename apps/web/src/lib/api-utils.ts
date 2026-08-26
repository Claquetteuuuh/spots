import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { getUserFromRequest, type AuthUser } from "./auth";

/**
 * An error carrying an HTTP status code and optional structured details.
 * Throw this from within a route handler body and let `handleApiError`
 * (or the `withAuth` wrapper) turn it into a proper HTTP response.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Standard success envelope: `{ data: T }`.
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Standard error envelope: `{ error: string, details?: unknown }`.
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    details !== undefined ? { error: message, details } : { error: message },
    { status }
  );
}

/**
 * Parse and validate `body` against `schema`, returning the typed, parsed
 * data. Throws an `ApiError` (400) with field-level details on failure.
 *
 * `schema` is inferred as a whole (rather than pinning just its output type
 * parameter) so that fields with `.default()`/coercion — where the parsed
 * output type differs from the raw input type — resolve to the correct,
 * non-optional output type instead of a union of the two.
 */
export function validateBody<S extends z.ZodTypeAny>(
  schema: S,
  body: unknown
): z.infer<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError("Validation failed", 400, result.error.flatten());
  }
  return result.data as z.infer<S>;
}

/**
 * Convert a thrown value into a standardized error `NextResponse`.
 * Handles `ApiError`, raw Zod validation errors, and falls back to a
 * generic 500 for anything unexpected (while logging it server-side).
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return errorResponse("Validation failed", 400, error.flatten());
  }

  console.error("Unhandled API error:", error);
  return errorResponse("Internal server error", 500);
}

type RouteHandler<Context> = (
  request: NextRequest,
  context: Context
) => Promise<NextResponse> | NextResponse;

type AuthedRouteHandler<Context> = (
  request: NextRequest,
  user: AuthUser,
  context: Context
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap a route handler so it only runs for authenticated requests. Extracts
 * the user from the `Authorization: Bearer <token>` header, returns a 401
 * `errorResponse` when missing/invalid, and otherwise centralizes error
 * handling for anything the wrapped handler throws.
 */
export function withAuth<Context = unknown>(
  handler: AuthedRouteHandler<Context>
): RouteHandler<Context> {
  return async (request: NextRequest, context: Context) => {
    try {
      const user = await getUserFromRequest(request);
      if (!user) {
        return errorResponse("Unauthorized", 401);
      }
      return await handler(request, user, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
