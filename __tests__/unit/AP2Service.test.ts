/**
 * Unit tests for AP2Service
 */

import jwt from 'jsonwebtoken';
import { AP2Service } from '../../src/services/AP2Service';
import { AP2PaymentIntent, StellarTransactionResult } from '../../src/types';
import { AuthenticationError, AP2ValidationError } from '../../src/utils/errors';

// Mock environment variables
process.env.AP2_JWT_SECRET = 'test_secret_key_at_least_32_characters_long_for_security';

describe('AP2Service', () => {
  let service: AP2Service;
  const validIntent: AP2PaymentIntent = {
    intent_id: 'test-intent-001',
    amount: '100.00',
    currency: 'USD',
    recipient: {
      agent_id: 'recipient-agent',
      payment_address: 'stellar:GABC123456789',
    },
    sender: {
      agent_id: 'sender-agent',
      authorization_token: 'valid-jwt-token',
    },
  };

  beforeEach(() => {
    service = new AP2Service();
  });

  describe('validateIntent', () => {
    it('should validate a correct payment intent', () => {
      expect(() => service.validateIntent(validIntent)).not.toThrow();
    });

    it('should throw error for missing intent_id', () => {
      const invalidIntent = { ...validIntent, intent_id: '' };
      expect(() => service.validateIntent(invalidIntent as AP2PaymentIntent)).toThrow(
        AP2ValidationError
      );
    });

    it('should throw error for invalid amount format', () => {
      const invalidIntent = { ...validIntent, amount: 'invalid' };
      expect(() => service.validateIntent(invalidIntent as AP2PaymentIntent)).toThrow(
        AP2ValidationError
      );
    });

    it('should throw error for unsupported currency', () => {
      const invalidIntent = { ...validIntent, currency: 'JPY' };
      expect(() => service.validateIntent(invalidIntent)).toThrow(AP2ValidationError);
    });
  });

  describe('verifyAuthToken', () => {
    it('should verify valid JWT token', () => {
      const token = jwt.sign(
        {
          agent_id: 'test-agent',
          permissions: ['payment:send'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.AP2_JWT_SECRET!,
        { algorithm: 'HS256' }
      );

      const payload = service.verifyAuthToken(token);
      expect(payload.agent_id).toBe('test-agent');
      expect(payload.permissions).toContain('payment:send');
    });

    it('should throw error for invalid token', () => {
      expect(() => service.verifyAuthToken('invalid-token')).toThrow(AuthenticationError);
    });

    it('should throw error for missing permissions', () => {
      const token = jwt.sign(
        {
          agent_id: 'test-agent',
          permissions: [],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.AP2_JWT_SECRET!,
        { algorithm: 'HS256' }
      );

      expect(() => service.verifyAuthToken(token)).toThrow(AuthenticationError);
    });

    it('should throw error for expired token', () => {
      const token = jwt.sign(
        {
          agent_id: 'test-agent',
          permissions: ['payment:send'],
          iat: Math.floor(Date.now() / 1000) - 7200,
          exp: Math.floor(Date.now() / 1000) - 3600,
        },
        process.env.AP2_JWT_SECRET!,
        { algorithm: 'HS256' }
      );

      expect(() => service.verifyAuthToken(token)).toThrow(AuthenticationError);
    });
  });

  describe('createPaymentConfirmation', () => {
    const mockStellarTx: StellarTransactionResult = {
      hash: 'test-hash-123',
      ledger: 12345,
      successful: true,
      source_amount: '100.00',
      source_currency: 'USDC',
      destination_amount: '95.50',
      destination_currency: 'EURC',
      fee: '0.00001',
      duration: 5000,
      timestamp: new Date().toISOString(),
    };

    it('should create completed confirmation', () => {
      const confirmation = service.createPaymentConfirmation(
        'intent-123',
        mockStellarTx,
        'completed'
      );

      expect(confirmation.intent_id).toBe('intent-123');
      expect(confirmation.status).toBe('completed');
      expect(confirmation.transaction_details).toBeDefined();
      expect(confirmation.transaction_details?.transaction_hash).toBe('test-hash-123');
      expect(confirmation.amount).toBeDefined();
    });

    it('should create failed confirmation', () => {
      const confirmation = service.createPaymentConfirmation('intent-123', mockStellarTx, 'failed');

      expect(confirmation.intent_id).toBe('intent-123');
      expect(confirmation.status).toBe('failed');
    });

    it('should include all required fields in confirmation', () => {
      const confirmation = service.createPaymentConfirmation(
        'intent-123',
        mockStellarTx,
        'completed'
      );

      expect(confirmation.confirmation_id).toBeTruthy();
      expect(confirmation.transaction_details?.network).toBe('stellar');
      expect(confirmation.fees).toBeDefined();
    });
  });

  describe('createFailedConfirmation', () => {
    it('should create failed confirmation with error', () => {
      const confirmation = service.createFailedConfirmation(
        'intent-123',
        'STELLAR_ERROR',
        'Transaction failed'
      );

      expect(confirmation.status).toBe('failed');
      expect(confirmation.error).toBeDefined();
      expect(confirmation.error?.code).toBe('STELLAR_ERROR');
      expect(confirmation.error?.message).toBe('Transaction failed');
    });
  });
});
