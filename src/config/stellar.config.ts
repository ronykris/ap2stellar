/**
 * Stellar Network Configuration
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarNetworkConfig, StellarAssetConfig } from '../types';

// Determine network from environment
const network = process.env.STELLAR_NETWORK || 'testnet';

/**
 * Get Stellar network configuration based on environment
 */
export function getStellarNetworkConfig(): StellarNetworkConfig {
  if (network === 'mainnet') {
    return {
      horizonUrl: 'https://horizon.stellar.org',
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    };
  }

  // Default to testnet
  return {
    horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
    networkPassphrase: StellarSdk.Networks.TESTNET,
    friendbotUrl: 'https://friendbot.stellar.org',
  };
}

/**
 * Stellar asset issuer addresses
 * NOTE: These are testnet addresses. Update for mainnet deployment.
 */
export const STELLAR_ASSET_ISSUERS = {
  // Circle USDC issuer on testnet
  USDC: process.env.USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',

  // Circle EURC issuer on testnet
  EURC: process.env.EURC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',

  // GBP Coin issuer on testnet
  GBPC: process.env.GBPC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
};

/**
 * Get Stellar asset configuration by currency code
 */
export function getStellarAsset(currency: string): StellarAssetConfig {
  const upperCurrency = currency.toUpperCase();

  switch (upperCurrency) {
    case 'XLM':
      return {
        code: 'native',
        issuer: null,
      };

    case 'USD':
    case 'USDC':
      return {
        code: 'USDC',
        issuer: STELLAR_ASSET_ISSUERS.USDC,
      };

    case 'EUR':
    case 'EURC':
      return {
        code: 'EURC',
        issuer: STELLAR_ASSET_ISSUERS.EURC,
      };

    case 'GBP':
    case 'GBPC':
      return {
        code: 'GBPC',
        issuer: STELLAR_ASSET_ISSUERS.GBPC,
      };

    default:
      throw new Error(`Unsupported currency: ${currency}`);
  }
}

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = ['XLM', 'USD', 'USDC', 'EUR', 'EURC', 'GBP', 'GBPC'];
