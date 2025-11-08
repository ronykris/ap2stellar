/**
 * AP2 Service
 * Handles Agent Payments Protocol (AP2) logic
 */

import jwt from 'jsonwebtoken';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  AP2PaymentIntent,
  AP2PaymentConfirmation,
  AP2AuthPayload,
  StellarTransactionResult,
} from '../types';
import { paymentIntentSchema } from '../schemas/ap2.schemas';
import { JWT_CONFIG, REQUIRED_PERMISSIONS, CALLBACK_CONFIG, AP2_VERSION } from '../config/ap2.config';
import {
  AP2ValidationError,
  AuthenticationError,
  ExpiredIntentError,
} from '../utils/errors';
import { isExpired, calculateSettlementTime, sanitizeForLogging } from '../utils/helpers';
import { CurrencyMapper } from './CurrencyMapper';
import logger from '../utils/logger';

export class AP2Service {
  private ajv: Ajv;
  private jwtSecret: string;
  private currencyMapper: CurrencyMapper;

  constructor() {
    this.ajv = new Ajv();
    addFormats(this.ajv);
    this.jwtSecret = JWT_CONFIG.secret;

    if (!this.jwtSecret) {
      throw new Error('AP2_JWT_SECRET environment variable is required');
    }

    this.currencyMapper = new CurrencyMapper();
  }

  /**
   * Validate AP2 payment intent against JSON schema
   * @param intent Payment intent to validate
   * @throws AP2ValidationError if validation fails
   */
  public validateIntent(intent: AP2PaymentIntent): void {
    logger.info('Validating AP2 payment intent', {
      intent_id: intent.intent_id,
      currency: intent.currency,
      amount: intent.amount,
    });

    // Validate with AJV schema
    const validate = this.ajv.compile(paymentIntentSchema);
    const valid = validate(intent);

    if (!valid) {
      logger.error('Payment intent validation failed', {
        errors: validate.errors,
        intent: sanitizeForLogging(intent),
      });
      throw new AP2ValidationError('Invalid payment intent schema', validate.errors);
    }

    // Validate currency is supported
    if (!this.currencyMapper.isCurrencySupported(intent.currency)) {
      throw new AP2ValidationError(`Unsupported currency: ${intent.currency}`);
    }

    // Check if destination currency is supported (if specified)
    if (
      intent.recipient.destination_currency &&
      !this.currencyMapper.isCurrencySupported(intent.recipient.destination_currency)
    ) {
      throw new AP2ValidationError(
        `Unsupported destination currency: ${intent.recipient.destination_currency}`
      );
    }

    // Check expiration
    if (intent.expires_at) {
      if (isExpired(intent.expires_at)) {
        throw new ExpiredIntentError(`Payment intent expired at ${intent.expires_at}`);
      }
    }

    logger.info('Payment intent validation successful', { intent_id: intent.intent_id });
  }

  /**
   * Verify JWT authorization token
   * @param token JWT token from sender
   * @returns Decoded payload
   * @throws AuthenticationError if verification fails
   */
  public verifyAuthToken(token: string): AP2AuthPayload {
    logger.info('Verifying authorization token');

    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: [JWT_CONFIG.algorithm],
      }) as AP2AuthPayload;

      // Validate payload structure
      if (!decoded.agent_id || !Array.isArray(decoded.permissions)) {
        throw new AuthenticationError('Invalid token payload structure');
      }

      // Check permissions
      const hasRequiredPermissions = REQUIRED_PERMISSIONS.every((perm) =>
        decoded.permissions.includes(perm)
      );

      if (!hasRequiredPermissions) {
        throw new AuthenticationError(
          `Missing required permissions: ${REQUIRED_PERMISSIONS.join(', ')}`
        );
      }

      logger.info('Authorization token verified', {
        agent_id: decoded.agent_id,
        permissions: decoded.permissions,
      });

      return decoded;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError(`JWT verification failed: ${error.message}`);
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('JWT token has expired');
      }

      logger.error('Token verification error', { error });
      throw new AuthenticationError('Failed to verify authorization token');
    }
  }

  /**
   * Create AP2 payment confirmation from Stellar transaction result
   * @param intentId Original payment intent ID
   * @param stellarTx Stellar transaction result
   * @param status Payment status
   * @returns AP2 payment confirmation
   */
  public createPaymentConfirmation(
    intentId: string,
    stellarTx: StellarTransactionResult,
    status: 'completed' | 'failed' | 'pending'
  ): AP2PaymentConfirmation {
    logger.info('Creating payment confirmation', {
      intent_id: intentId,
      status,
      tx_hash: stellarTx.hash,
    });

    const confirmation: AP2PaymentConfirmation = {
      confirmation_id: uuidv4(),
      intent_id: intentId,
      status,
    };

    if (status === 'completed') {
      confirmation.transaction_details = {
        network: 'stellar',
        transaction_hash: stellarTx.hash,
        ledger: stellarTx.ledger,
        timestamp: stellarTx.timestamp,
        settlement_time_seconds: calculateSettlementTime(stellarTx.duration),
      };

      confirmation.amount = {
        sent: stellarTx.source_amount,
        received: stellarTx.destination_amount,
        currency_sent: stellarTx.source_currency,
        currency_received: stellarTx.destination_currency,
      };

      confirmation.fees = {
        network_fee: stellarTx.fee,
        conversion_fee: '0', // DEX conversion is already reflected in destination amount
      };
    }

    logger.info('Payment confirmation created', {
      confirmation_id: confirmation.confirmation_id,
      intent_id: intentId,
    });

    return confirmation;
  }

  /**
   * Send async callback to provided URL
   * @param callbackUrl URL to send callback to
   * @param confirmation Payment confirmation to send
   * @returns Success status and response details
   */
  public async sendCallback(
    callbackUrl: string,
    confirmation: AP2PaymentConfirmation
  ): Promise<{ success: boolean; status?: number; error?: string }> {
    logger.info('Sending callback', {
      callback_url: callbackUrl,
      confirmation_id: confirmation.confirmation_id,
    });

    try {
      const response = await axios.post(callbackUrl, confirmation, {
        timeout: CALLBACK_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-AP2-Version': AP2_VERSION,
          'User-Agent': 'AP2Stellar/1.0',
        },
      });

      logger.info('Callback sent successfully', {
        callback_url: callbackUrl,
        status: response.status,
      });

      return {
        success: true,
        status: response.status,
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? `HTTP ${error.response?.status}: ${error.message}`
        : 'Unknown error';

      logger.error('Callback failed', {
        callback_url: callbackUrl,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create failed payment confirmation
   * @param intentId Payment intent ID
   * @param errorCode Error code
   * @param errorMessage Error message
   * @returns Failed payment confirmation
   */
  public createFailedConfirmation(
    intentId: string,
    errorCode: string,
    errorMessage: string
  ): AP2PaymentConfirmation {
    return {
      confirmation_id: uuidv4(),
      intent_id: intentId,
      status: 'failed',
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };
  }
}
