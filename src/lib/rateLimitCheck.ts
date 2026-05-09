/**
 * Checks whether an error or HTTP status indicates the API quota/rate limit
 * has been exhausted. This is the ONLY scenario where static fallback data
 * should be displayed to the user.
 *
 * Detects:
 *  - HTTP 429 (Too Many Requests)
 *  - Google Gemini quota errors (RESOURCE_EXHAUSTED / 429 in message)
 *  - Generic "rate limit" / "quota" keywords in error messages
 */
export function isRateLimitError(err: unknown, httpStatus?: number): boolean {
  if (httpStatus === 429) return true;

  const msg =
    err instanceof Error
      ? err.message.toLowerCase()
      : typeof err === 'string'
        ? err.toLowerCase()
        : '';

  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('too many requests') ||
    msg.includes('limit exceeded') ||
    msg.includes('exhausted')
  );
}
