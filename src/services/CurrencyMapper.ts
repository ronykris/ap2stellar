/**
 * Currency Mapping Service
 * Maps fiat currency codes to Stellar assets
 */

import { StellarAssetConfig } from '../types';
import { getStellarAsset, SUPPORTED_CURRENCIES } from '../config/stellar.config';
import logger from '../utils/logger';

export class CurrencyMapper {
  /**
   * Map currency code to Stellar asset configuration
   */
  public mapToStellarAsset(currency: string): StellarAssetConfig {
    logger.info(`Mapping currency to Stellar asset`, { currency });

    const asset = getStellarAsset(currency);

    logger.info(`Mapped currency to Stellar asset`, {
      currency,
      assetCode: asset.code,
      issuer: asset.issuer || 'native',
    });

    return asset;
  }

  /**
   * Check if currency is supported
   */
  public isCurrencySupported(currency: string): boolean {
    return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
  }

  /**
   * Get all supported currencies
   */
  public getSupportedCurrencies(): string[] {
    return [...SUPPORTED_CURRENCIES];
  }

  /**
   * Normalize currency code (e.g., USD -> USDC)
   */
  public normalizeCurrencyCode(currency: string): string {
    const upperCurrency = currency.toUpperCase();

    switch (upperCurrency) {
      case 'USD':
        return 'USDC';
      case 'EUR':
        return 'EURC';
      case 'GBP':
        return 'GBPC';
      default:
        return upperCurrency;
    }
  }
}
