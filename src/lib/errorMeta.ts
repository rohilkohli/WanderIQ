export type ErrorWithMeta = Error & { _httpStatus?: number; _details?: unknown };

export function attachErrorMeta(error: Error, httpStatus: number, details: unknown): ErrorWithMeta {
  const withMeta = error as ErrorWithMeta;
  withMeta._httpStatus = httpStatus;
  withMeta._details = details;
  return withMeta;
}

export function readErrorMeta(error: unknown): { httpStatus?: number; details?: unknown } {
  if (!error || typeof error !== 'object') return {};
  const maybe = error as { _httpStatus?: unknown; _details?: unknown };
  return {
    httpStatus: typeof maybe._httpStatus === 'number' ? maybe._httpStatus : undefined,
    details: maybe._details,
  };
}
