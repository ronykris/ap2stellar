/**
 * AP2 Payment Routes
 * Handles AP2 payment intent processing and status queries
 */

import { Router, Response } from 'express';
import { body } from 'express-validator';
import { PaymentRequest, StatusRequest, AP2PaymentConfirmation, ApiResponse } from '../types';
import { AP2Service } from '../services/AP2Service';
import { StellarService } from '../services/StellarService';
import { CurrencyMapper } from '../services/CurrencyMapper';
import { validateRequest } from '../middleware/validator.middleware';
import { paymentRateLimiter } from '../middleware/rateLimiter.middleware';
import { parseStellarAddress } from '../utils/helpers';
import logger from '../utils/logger';

const router = Router();

// Lazy service initialization to ensure dotenv loads first
let ap2Service: AP2Service;
let stellarService: StellarService;
let currencyMapper: CurrencyMapper;

function getServices() {
  if (!ap2Service) {
    ap2Service = new AP2Service();
    stellarService = new StellarService();
    currencyMapper = new CurrencyMapper();
  }
  return { ap2Service, stellarService, currencyMapper };
}

/**
 * POST /api/v1/ap2/payment
 * Process AP2 payment intent
 */
router.post(
  '/payment',
  paymentRateLimiter,
  [
    body('intent_id').isString().notEmpty().withMessage('intent_id is required'),
    body('amount')
      .isString()
      .matches(/^[0-9]+(\.[0-9]{1,7})?$/)
      .withMessage('amount must be a valid decimal string'),
    body('currency')
      .isString()
      .isLength({ min: 3, max: 4 })
      .withMessage('currency must be 3-4 characters'),
    body('recipient.agent_id').isString().notEmpty().withMessage('recipient.agent_id is required'),
    body('recipient.payment_address')
      .isString()
      .notEmpty()
      .withMessage('recipient.payment_address is required'),
    body('sender.agent_id').isString().notEmpty().withMessage('sender.agent_id is required'),
    body('sender.authorization_token')
      .isString()
      .notEmpty()
      .withMessage('sender.authorization_token is required'),
  ],
  validateRequest,
  async (req: PaymentRequest, res: Response<AP2PaymentConfirmation>) => {
    const paymentIntent = req.body;
    const { ap2Service, stellarService, currencyMapper } = getServices();

    try {
      logger.info('Processing AP2 payment intent', {
        intent_id: paymentIntent.intent_id,
        currency: paymentIntent.currency,
        amount: paymentIntent.amount,
      });

      // Step 1: Validate AP2 payment intent
      ap2Service.validateIntent(paymentIntent);

      // Step 2: Verify JWT authorization token
      const authPayload = ap2Service.verifyAuthToken(paymentIntent.sender.authorization_token);

      // Verify sender agent_id matches token
      if (authPayload.agent_id !== paymentIntent.sender.agent_id) {
        throw new Error('Token agent_id does not match sender agent_id');
      }

      // Step 3: Map currencies to Stellar assets
      const sourceAsset = currencyMapper.mapToStellarAsset(paymentIntent.currency);
      const destCurrency =
        paymentIntent.recipient.destination_currency || paymentIntent.currency;
      const destAsset = currencyMapper.mapToStellarAsset(destCurrency);

      // Step 4: Parse Stellar destination address
      const destinationAddress = parseStellarAddress(paymentIntent.recipient.payment_address);

      // Step 5: Execute Stellar path payment
      // Note: Stellar memo.text has 28-byte limit, so we truncate the intent_id
      const memoText = `AP2:${paymentIntent.intent_id.substring(0, 24)}`;
      const stellarTx = await stellarService.executePathPayment({
        sourceAsset,
        destAsset,
        sourceAmount: paymentIntent.amount,
        destination: destinationAddress,
        memo: memoText,
      });

      // Step 6: Create AP2 payment confirmation
      const confirmation = ap2Service.createPaymentConfirmation(
        paymentIntent.intent_id,
        stellarTx,
        stellarTx.successful ? 'completed' : 'failed'
      );

      // Step 7: Send async callback if provided
      if (paymentIntent.callback_url) {
        // Fire and forget - don't await
        ap2Service.sendCallback(paymentIntent.callback_url, confirmation).catch((error) => {
          logger.error('Callback failed but payment succeeded', {
            intent_id: paymentIntent.intent_id,
            error,
          });
        });
      }

      logger.info('Payment processed successfully', {
        intent_id: paymentIntent.intent_id,
        confirmation_id: confirmation.confirmation_id,
        tx_hash: stellarTx.hash,
      });

      res.status(200).json(confirmation);
    } catch (error) {
      logger.error('Payment processing failed', {
        intent_id: paymentIntent.intent_id,
        error,
      });

      // Create failed confirmation
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : 'PAYMENT_ERROR';

      const failedConfirmation = ap2Service.createFailedConfirmation(
        paymentIntent.intent_id,
        errorCode,
        errorMessage
      );

      // Send callback for failed payment
      if (paymentIntent.callback_url) {
        ap2Service.sendCallback(paymentIntent.callback_url, failedConfirmation).catch((err) => {
          logger.error('Failed to send failure callback', { error: err });
        });
      }

      res.status(400).json(failedConfirmation);
    }
  }
);

/**
 * GET /api/v1/ap2/payment/:intent_id
 * Query payment status by intent ID
 */
router.get(
  '/payment/:intent_id',
  async (req: StatusRequest, res: Response<AP2PaymentConfirmation | ApiResponse<null>>) => {
    const { intent_id } = req.params;
    const { stellarService } = getServices();

    try {
      logger.info('Querying payment status', { intent_id });

      // Search for transaction by memo (truncated to fit 28-byte limit)
      const memoText = `AP2:${intent_id.substring(0, 24)}`;
      const transactions = await stellarService.findTransactionsByMemo(memoText);

      if (transactions.length === 0) {
        logger.info('Payment not found', { intent_id });
        res.status(404).json({
          status: 'error',
          error: {
            code: 'NOT_FOUND',
            message: 'Payment not found',
          },
        });
        return;
      }

      // Get the most recent transaction
      const tx = transactions[0];

      // Create confirmation from transaction data
      const confirmation: AP2PaymentConfirmation = {
        confirmation_id: tx.id,
        intent_id,
        status: tx.successful ? 'completed' : 'failed',
        transaction_details: {
          network: 'stellar',
          transaction_hash: tx.hash,
          ledger: tx.ledger_attr,
          timestamp: tx.created_at,
          settlement_time_seconds: 5, // Stellar ~5 second settlement
        },
      };

      logger.info('Payment status retrieved', {
        intent_id,
        status: confirmation.status,
        tx_hash: tx.hash,
      });

      res.status(200).json(confirmation);
    } catch (error) {
      logger.error('Error querying payment status', { intent_id, error });
      res.status(500).json({
        status: 'error',
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to query payment status',
        },
      });
    }
  }
);

export default router;
