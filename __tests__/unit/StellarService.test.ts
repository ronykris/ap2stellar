/**
 * Unit tests for StellarService
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarService } from '../../src/services/StellarService';

// Mock environment variables
process.env.ROUTER_SECRET_KEY = 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
process.env.STELLAR_NETWORK = 'testnet';
process.env.HORIZON_URL = 'https://horizon-testnet.stellar.org';

// Mock Stellar SDK
jest.mock('@stellar/stellar-sdk');

describe('StellarService', () => {
  let service: StellarService;

  beforeEach(() => {
    jest.clearAllMocks();
    // service = new StellarService();
  });

  describe('constructor', () => {
    it('should initialize with valid secret key', () => {
      expect(() => new StellarService()).not.toThrow();
    });

    it('should throw error if ROUTER_SECRET_KEY is missing', () => {
      const originalKey = process.env.ROUTER_SECRET_KEY;
      delete process.env.ROUTER_SECRET_KEY;

      expect(() => new StellarService()).toThrow('ROUTER_SECRET_KEY environment variable is required');

      process.env.ROUTER_SECRET_KEY = originalKey;
    });
  });

  describe('getRouterPublicKey', () => {
    it('should return router public key', () => {
      service = new StellarService();
      const publicKey = service.getRouterPublicKey();
      expect(typeof publicKey).toBe('string');
      expect(publicKey.startsWith('G')).toBe(true);
    });
  });

  // Note: More comprehensive tests would require mocking Stellar SDK operations
  // and Horizon API responses. For now, we include basic structure tests.

  describe('healthCheck', () => {
    it('should return true when Horizon is reachable', async () => {
      // This would require mocking the Horizon server
      // service = new StellarService();
      // const health = await service.healthCheck();
      // expect(typeof health).toBe('boolean');
    });
  });
});
