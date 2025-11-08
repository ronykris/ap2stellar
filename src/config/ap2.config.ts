/**
 * AP2 Protocol Configuration
 */

/**
 * AP2 Protocol Version
 */
export const AP2_VERSION = process.env.AP2_VERSION || '1.0';

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  get secret() {
    return process.env.AP2_JWT_SECRET || '';
  },
  algorithm: 'HS256' as const,
  expiresIn: '1h',
};

/**
 * Callback Configuration
 */
export const CALLBACK_CONFIG = {
  timeout: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Required permissions for payment operations
 */
export const REQUIRED_PERMISSIONS = ['payment:send'];

/**
 * Validate AP2 configuration
 */
export function validateAP2Config(): void {
  if (!JWT_CONFIG.secret) {
    throw new Error('AP2_JWT_SECRET environment variable is required');
  }

  if (JWT_CONFIG.secret.length < 32) {
    throw new Error('AP2_JWT_SECRET must be at least 32 characters long');
  }
}
