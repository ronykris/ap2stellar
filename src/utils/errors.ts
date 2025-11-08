/**
 * Custom error classes for AP2Stellar application
 */

import { AP2ErrorCode } from '../types';

/**
 * Base error class for AP2Stellar errors
 */
export class AP2StellarError extends Error {
  constructor(
    message: string,
    public code: AP2ErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when AP2 payment intent validation fails
 */
export class AP2ValidationError extends AP2StellarError {
  constructor(message: string, details?: unknown) {
    super(message, AP2ErrorCode.VALIDATION_ERROR, details);
  }
}

/**
 * Error thrown when Stellar transaction fails
 */
export class StellarTransactionError extends AP2StellarError {
  constructor(message: string, public txHash?: string, details?: unknown) {
    super(message, AP2ErrorCode.STELLAR_ERROR, details);
    this.txHash = txHash;
  }
}

/**
 * Error thrown when JWT authentication fails
 */
export class AuthenticationError extends AP2StellarError {
  constructor(message: string, details?: unknown) {
    super(message, AP2ErrorCode.AUTH_ERROR, details);
  }
}

/**
 * Error thrown when payment intent has expired
 */
export class ExpiredIntentError extends AP2StellarError {
  constructor(message: string, details?: unknown) {
    super(message, AP2ErrorCode.EXPIRED_INTENT, details);
  }
}

/**
 * Error thrown when no payment path is found on DEX
 */
export class NoPathFoundError extends AP2StellarError {
  constructor(message: string, details?: unknown) {
    super(message, AP2ErrorCode.NO_PATH_FOUND, details);
  }
}

/**
 * Error thrown when account has insufficient funds
 */
export class InsufficientFundsError extends AP2StellarError {
  constructor(message: string, details?: unknown) {
    super(message, AP2ErrorCode.INSUFFICIENT_FUNDS, details);
  }
}
