/**
 * Global Error Handler Middleware
 * Catches and formats errors for API responses
 */

import { Request, Response, NextFunction } from 'express';
import { AP2StellarError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 * Converts errors to consistent API response format
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error('Error handling request', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom AP2Stellar errors
  if (error instanceof AP2StellarError) {
    res.status(400).json({
      status: 'error',
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    status: 'error',
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
}
