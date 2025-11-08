/**
 * Server Entry Point
 * Starts the Express server with graceful shutdown handling
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import logger from './utils/logger';
import { validateAP2Config } from './config/ap2.config';

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
async function startServer() {
  try {
    // Validate configuration
    validateAP2Config();

    // Create logs directory if it doesn't exist
    const fs = await import('fs');
    const path = await import('path');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info('AP2Stellar server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        stellarNetwork: process.env.STELLAR_NETWORK || 'testnet',
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(() => {
        logger.info('Server closed, exiting process');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      logger.error('Uncaught exception', { error });
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
