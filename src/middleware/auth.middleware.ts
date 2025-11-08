/**
 * Authentication Middleware
 * API key authentication for protected endpoints
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Simple API key authentication middleware
 * For production, implement more robust authentication
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;

  // For development/testing, skip API key check if not configured
  const requiredApiKey = process.env.API_KEY;

  if (!requiredApiKey) {
    // No API key configured, allow all requests (dev mode)
    logger.warn('API key authentication disabled - no API_KEY env variable set');
    next();
    return;
  }

  if (!apiKey) {
    logger.warn('API key missing in request', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({
      status: 'error',
      error: {
        code: 'AUTH_ERROR',
        message: 'API key required',
      },
    });
    return;
  }

  if (apiKey !== requiredApiKey) {
    logger.warn('Invalid API key provided', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({
      status: 'error',
      error: {
        code: 'AUTH_ERROR',
        message: 'Invalid API key',
      },
    });
    return;
  }

  next();
}
