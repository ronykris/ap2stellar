/**
 * TypeScript type definitions for Stellar blockchain operations
 */

import { Asset } from '@stellar/stellar-sdk';

/**
 * Stellar Asset Configuration
 */
export interface StellarAssetConfig {
  code: string;
  issuer: string | null; // null for XLM native asset
}

/**
 * Result of a Stellar transaction execution
 */
export interface StellarTransactionResult {
  hash: string;
  ledger: number;
  successful: boolean;
  source_amount: string;
  source_currency: string;
  destination_amount: string;
  destination_currency: string;
  fee: string;
  duration: number; // milliseconds
  timestamp: string;
}

/**
 * Parameters for executing a path payment
 */
export interface PathPaymentParams {
  sourceAsset: StellarAssetConfig;
  destAsset: StellarAssetConfig;
  sourceAmount: string;
  destination: string;
  memo: string;
}

/**
 * DEX Path from Horizon strictSendPaths endpoint
 */
export interface DEXPath {
  source_amount: string;
  destination_amount: string;
  path: Asset[];
}

/**
 * Stellar Network Configuration
 */
export interface StellarNetworkConfig {
  horizonUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string; // Only for testnet
}

/**
 * Trustline Configuration
 */
export interface TrustlineConfig {
  asset: StellarAssetConfig;
  limit?: string;
}
