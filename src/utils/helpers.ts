/**
 * Utility helper functions
 */

/**
 * Parse Stellar G-address from payment address string
 * Handles formats like "stellar:GXXXXXXX" or "GXXXXXXX"
 */
export function parseStellarAddress(paymentAddress: string): string {
  // Remove stellar: prefix if present
  const address = paymentAddress.replace(/^stellar:/, '');

  // Validate G-address format (56 characters starting with G)
  if (!/^G[A-Z2-7]{55}$/.test(address)) {
    throw new Error(`Invalid Stellar address format: ${paymentAddress}`);
  }

  return address;
}

/**
 * Validate that a string represents a valid monetary amount
 */
export function isValidAmount(amount: string): boolean {
  // Must match decimal format with up to 7 decimal places (Stellar precision)
  return /^[0-9]+(\.[0-9]{1,7})?$/.test(amount) && parseFloat(amount) > 0;
}

/**
 * Convert timestamp string to ISO 8601 format
 */
export function toISO8601(timestamp: number | string): string {
  return new Date(timestamp).toISOString();
}

/**
 * Check if a timestamp has expired
 */
export function isExpired(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  return currentTime > expiryTime;
}

/**
 * Calculate settlement time in seconds from duration in milliseconds
 */
export function calculateSettlementTime(durationMs: number): number {
  return Math.round(durationMs / 1000);
}

/**
 * Sanitize log data to prevent sensitive information leakage
 */
export function sanitizeForLogging(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data } as Record<string, unknown>;

  // Remove sensitive fields
  const sensitiveFields = ['authorization_token', 'secret', 'password', 'api_key'];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
