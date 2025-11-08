/**
 * Health Check Routes
 * Provides service health status for monitoring
 */

import { Router, Request, Response } from 'express';
import { HealthCheckResponse } from '../types';
import { StellarService } from '../services/StellarService';
import { validateAP2Config } from '../config/ap2.config';
import logger from '../utils/logger';

const router = Router();

// Lazy service initialization to ensure dotenv loads first
let stellarService: StellarService | null = null;
let serviceInitError: Error | null = null;

function getStellarService(): StellarService | null {
  if (!stellarService && !serviceInitError) {
    try {
      stellarService = new StellarService();
    } catch (error) {
      serviceInitError = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Failed to initialize Stellar service for health checks', { error });
    }
  }
  return stellarService;
}

/**
 * GET /health
 * Health check endpoint for monitoring
 */
router.get('/', async (req: Request, res: Response<HealthCheckResponse>) => {
  try {
    const service = getStellarService();

    // Check Stellar service connectivity
    const stellarHealthy = service ? await service.healthCheck() : false;

    // Check AP2 configuration
    let ap2Healthy = true;
    try {
      validateAP2Config();
    } catch (error) {
      ap2Healthy = false;
      logger.error('AP2 configuration validation failed', { error });
    }

    const overallHealthy = stellarHealthy && ap2Healthy;

    const health: HealthCheckResponse = {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        stellar: service ? 'connected' : 'disconnected',
        horizon: stellarHealthy ? 'reachable' : 'unreachable',
      },
      version: '1.0.0',
    };

    const statusCode = overallHealthy ? 200 : 503;

    logger.info('Health check completed', {
      status: health.status,
      stellar: health.services.stellar,
      horizon: health.services.horizon,
    });

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        stellar: 'disconnected',
        horizon: 'unreachable',
      },
      version: '1.0.0',
    });
  }
});

export default router;
