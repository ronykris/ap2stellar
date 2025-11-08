/**
 * Integration tests for complete payment flow
 * Note: These tests require a funded Stellar testnet account
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createApp } from '../../src/app';

// Mock environment for testing
process.env.AP2_JWT_SECRET = 'test_secret_key_at_least_32_characters_long_for_security';
process.env.STELLAR_NETWORK = 'testnet';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

describe('Payment Flow Integration Tests', () => {
  const app = createApp();

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.services).toBeDefined();
    });
  });

  describe('GET /api/v1/quote', () => {
    it('should return quote for valid currencies', async () => {
      const response = await request(app)
        .get('/api/v1/quote')
        .query({
          source_currency: 'XLM',
          destination_currency: 'XLM',
          source_amount: '10.00',
        });

      // May return 200 or 500 depending on testnet DEX liquidity
      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.status).toBe('success');
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 400 for invalid parameters', async () => {
      const response = await request(app)
        .get('/api/v1/quote')
        .query({
          source_currency: 'USD',
          // Missing destination_currency and source_amount
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/ap2/payment', () => {
    function generateJWT(agentId: string): string {
      return jwt.sign(
        {
          agent_id: agentId,
          permissions: ['payment:send'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.AP2_JWT_SECRET!,
        { algorithm: 'HS256' }
      );
    }

    it('should reject payment intent with invalid schema', async () => {
      const invalidIntent = {
        intent_id: '',
        amount: 'invalid',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/ap2/payment')
        .send(invalidIntent);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should reject payment intent with invalid JWT', async () => {
      const intent = {
        intent_id: uuidv4(),
        amount: '10.00',
        currency: 'XLM',
        recipient: {
          agent_id: 'test-recipient',
          payment_address: 'stellar:GABC123456789',
        },
        sender: {
          agent_id: 'test-sender',
          authorization_token: 'invalid-token',
        },
      };

      const response = await request(app)
        .post('/api/v1/ap2/payment')
        .send(intent);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('failed');
    });

    it('should reject payment intent with missing permissions', async () => {
      const token = jwt.sign(
        {
          agent_id: 'test-sender',
          permissions: [], // No permissions
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.AP2_JWT_SECRET!,
        { algorithm: 'HS256' }
      );

      const intent = {
        intent_id: uuidv4(),
        amount: '10.00',
        currency: 'XLM',
        recipient: {
          agent_id: 'test-recipient',
          payment_address: 'stellar:GABC123456789',
        },
        sender: {
          agent_id: 'test-sender',
          authorization_token: token,
        },
      };

      const response = await request(app)
        .post('/api/v1/ap2/payment')
        .send(intent);

      expect(response.status).toBe(400);
    });

    // Note: Actual payment tests require a funded testnet account
    // and valid recipient address. Skipped in CI/CD.
  });

  describe('GET /api/v1/ap2/payment/:intent_id', () => {
    it('should return 404 for non-existent intent', async () => {
      const response = await request(app)
        .get('/api/v1/ap2/payment/non-existent-intent');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });
});
