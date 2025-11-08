/**
 * Express Application Configuration
 * Sets up middleware and routes
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import ap2PaymentRoutes from './routes/ap2Payment.routes';
import quoteRoutes from './routes/quote.routes';
import healthRoutes from './routes/health.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import logger from './utils/logger';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-AP2-Version'],
  };
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, _res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Apply rate limiting to all API routes
  app.use('/api', apiRateLimiter);

  // Mount routes
  app.use('/health', healthRoutes);
  app.use('/api/v1/ap2', ap2PaymentRoutes);
  app.use('/api/v1/quote', quoteRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
