/**
 * Quote Routes
 * Provides exchange rate quotes without executing transactions
 */

import { Router, Response } from 'express';
import { query } from 'express-validator';
import { QuoteRequest, QuoteResponse, ApiResponse } from '../types';
import { StellarService } from '../services/StellarService';
import { CurrencyMapper } from '../services/CurrencyMapper';
import { validateRequest } from '../middleware/validator.middleware';
import { apiRateLimiter } from '../middleware/rateLimiter.middleware';
import { parseStellarAddress } from '../utils/helpers';
import logger from '../utils/logger';

const router = Router();

// Lazy service initialization to ensure dotenv loads first
let stellarService: StellarService;
let currencyMapper: CurrencyMapper;

function getServices() {
  if (!stellarService) {
    stellarService = new StellarService();
    currencyMapper = new CurrencyMapper();
  }
  return { stellarService, currencyMapper };
}

/**
 * GET /api/v1/quote
 * Get exchange rate quote for currency conversion
 */
router.get(
  '/',
  apiRateLimiter,
  [
    query('source_currency')
      .isString()
      .isLength({ min: 3, max: 4 })
      .withMessage('source_currency is required (3-4 characters)'),
    query('destination_currency')
      .isString()
      .isLength({ min: 3, max: 4 })
      .withMessage('destination_currency is required (3-4 characters)'),
    query('source_amount')
      .isString()
      .matches(/^[0-9]+(\.[0-9]{1,7})?$/)
      .withMessage('source_amount must be a valid decimal string'),
    query('destination_address')
      .optional()
      .isString()
      .withMessage('destination_address must be a string'),
  ],
  validateRequest,
  async (req: QuoteRequest, res: Response<ApiResponse<QuoteResponse>>) => {
    const { source_currency, destination_currency, source_amount, destination_address } = req.query;
    const { stellarService, currencyMapper } = getServices();

    try {
      logger.info('Processing quote request', {
        source_currency,
        destination_currency,
        source_amount,
      });

      // Validate currencies are supported
      if (!currencyMapper.isCurrencySupported(source_currency)) {
        res.status(400).json({
          status: 'error',
          error: {
            code: 'VALIDATION_ERROR',
            message: `Unsupported source currency: ${source_currency}`,
          },
        });
        return;
      }

      if (!currencyMapper.isCurrencySupported(destination_currency)) {
        res.status(400).json({
          status: 'error',
          error: {
            code: 'VALIDATION_ERROR',
            message: `Unsupported destination currency: ${destination_currency}`,
          },
        });
        return;
      }

      // Map currencies to Stellar assets
      const sourceAsset = currencyMapper.mapToStellarAsset(source_currency);
      const destAsset = currencyMapper.mapToStellarAsset(destination_currency);

      // Use router's own address as destination for quote if not provided
      const destAddress = destination_address
        ? parseStellarAddress(destination_address as string)
        : stellarService.getRouterPublicKey();

      // Query DEX for path
      const pathFinder = (stellarService as any).pathFinder;
      const path = await pathFinder.findOptimalPath(
        sourceAsset,
        destAsset,
        source_amount,
        destAddress
      );

      // Calculate exchange rate
      const sourceAmt = parseFloat(path.source_amount);
      const destAmt = parseFloat(path.destination_amount);
      const exchangeRate = (destAmt / sourceAmt).toFixed(7);

      // Estimate fee (Stellar base fee)
      const estimatedFee = '0.00001'; // 100 stroops

      const quote: QuoteResponse = {
        source_currency: currencyMapper.normalizeCurrencyCode(source_currency),
        destination_currency: currencyMapper.normalizeCurrencyCode(destination_currency),
        source_amount,
        estimated_destination_amount: path.destination_amount,
        estimated_fee: estimatedFee,
        exchange_rate: exchangeRate,
        path_length: path.path.length,
      };

      logger.info('Quote generated successfully', {
        source_currency,
        destination_currency,
        exchange_rate: exchangeRate,
      });

      res.status(200).json({
        status: 'success',
        data: quote,
      });
    } catch (error) {
      logger.error('Error generating quote', { error });
      res.status(500).json({
        status: 'error',
        error: {
          code: 'QUOTE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate quote',
        },
      });
    }
  }
);

export default router;
