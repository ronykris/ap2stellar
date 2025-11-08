/**
 * Unit tests for CurrencyMapper service
 */

import { CurrencyMapper } from '../../src/services/CurrencyMapper';

describe('CurrencyMapper', () => {
  let mapper: CurrencyMapper;

  beforeEach(() => {
    mapper = new CurrencyMapper();
  });

  describe('mapToStellarAsset', () => {
    it('should map XLM to native asset', () => {
      const asset = mapper.mapToStellarAsset('XLM');
      expect(asset.code).toBe('native');
      expect(asset.issuer).toBeNull();
    });

    it('should map USD to USDC', () => {
      const asset = mapper.mapToStellarAsset('USD');
      expect(asset.code).toBe('USDC');
      expect(asset.issuer).toBeTruthy();
    });

    it('should map EUR to EURC', () => {
      const asset = mapper.mapToStellarAsset('EUR');
      expect(asset.code).toBe('EURC');
      expect(asset.issuer).toBeTruthy();
    });

    it('should throw error for unsupported currency', () => {
      expect(() => mapper.mapToStellarAsset('JPY')).toThrow('Unsupported currency: JPY');
    });
  });

  describe('isCurrencySupported', () => {
    it('should return true for supported currencies', () => {
      expect(mapper.isCurrencySupported('USD')).toBe(true);
      expect(mapper.isCurrencySupported('EUR')).toBe(true);
      expect(mapper.isCurrencySupported('XLM')).toBe(true);
    });

    it('should return false for unsupported currencies', () => {
      expect(mapper.isCurrencySupported('JPY')).toBe(false);
      expect(mapper.isCurrencySupported('BTC')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(mapper.isCurrencySupported('usd')).toBe(true);
      expect(mapper.isCurrencySupported('xlm')).toBe(true);
    });
  });

  describe('normalizeCurrencyCode', () => {
    it('should normalize USD to USDC', () => {
      expect(mapper.normalizeCurrencyCode('USD')).toBe('USDC');
    });

    it('should normalize EUR to EURC', () => {
      expect(mapper.normalizeCurrencyCode('EUR')).toBe('EURC');
    });

    it('should keep XLM as XLM', () => {
      expect(mapper.normalizeCurrencyCode('XLM')).toBe('XLM');
    });

    it('should keep already normalized codes', () => {
      expect(mapper.normalizeCurrencyCode('USDC')).toBe('USDC');
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return array of supported currencies', () => {
      const currencies = mapper.getSupportedCurrencies();
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies).toContain('XLM');
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
    });
  });
});
