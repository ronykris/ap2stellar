/**
 * Stellar Service
 * Handles all interactions with the Stellar blockchain
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import {
  PathPaymentParams,
  StellarTransactionResult,
  StellarAssetConfig,
  TrustlineConfig,
} from '../types';
import { StellarTransactionError, InsufficientFundsError } from '../utils/errors';
import { getStellarNetworkConfig } from '../config/stellar.config';
import { PathFinderService } from './PathFinderService';
import logger from '../utils/logger';

export class StellarService {
  private server: StellarSdk.Horizon.Server;
  private routerKeypair: StellarSdk.Keypair;
  private networkPassphrase: string;
  private pathFinder: PathFinderService;

  constructor() {
    const networkConfig = getStellarNetworkConfig();

    this.server = new StellarSdk.Horizon.Server(networkConfig.horizonUrl);
    this.networkPassphrase = networkConfig.networkPassphrase;

    // Load router keypair from environment
    const secretKey = process.env.ROUTER_SECRET_KEY;
    if (!secretKey) {
      throw new Error('ROUTER_SECRET_KEY environment variable is required');
    }

    try {
      this.routerKeypair = StellarSdk.Keypair.fromSecret(secretKey);
      logger.info('Stellar service initialized', {
        routerAccount: this.routerKeypair.publicKey(),
        network: process.env.STELLAR_NETWORK || 'testnet',
      });
    } catch (error) {
      throw new Error('Invalid ROUTER_SECRET_KEY format');
    }

    this.pathFinder = new PathFinderService(this.server);
  }

  /**
   * Execute a path payment operation on Stellar
   * @param params Payment parameters including assets, amounts, and destination
   * @returns Transaction result with hash, amounts, and fees
   */
  public async executePathPayment(params: PathPaymentParams): Promise<StellarTransactionResult> {
    const startTime = Date.now();

    logger.info('Executing path payment', {
      sourceAsset: params.sourceAsset.code,
      destAsset: params.destAsset.code,
      sourceAmount: params.sourceAmount,
      destination: params.destination,
      memo: params.memo,
    });

    try {
      // Create asset objects
      const sourceAsset = this.createAsset(params.sourceAsset);
      const destAsset = this.createAsset(params.destAsset);

      // Load router account to get sequence number
      const routerAccount = await this.server.loadAccount(this.routerKeypair.publicKey());

      // Check if this is a same-currency transfer
      const isSameCurrency = this.assetsEqual(params.sourceAsset, params.destAsset);

      let transaction: StellarSdk.Transaction;
      let destinationAmount: string;

      if (isSameCurrency) {
        // Same currency: use regular payment operation
        logger.info('Executing same-currency payment', {
          currency: params.sourceAsset.code,
          amount: params.sourceAmount,
        });

        transaction = new StellarSdk.TransactionBuilder(routerAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: this.networkPassphrase,
        })
          .addOperation(
            StellarSdk.Operation.payment({
              destination: params.destination,
              asset: sourceAsset,
              amount: params.sourceAmount,
            })
          )
          .addMemo(StellarSdk.Memo.text(params.memo))
          .setTimeout(180)
          .build();

        destinationAmount = params.sourceAmount; // Same amount for same currency
      } else {
        // Cross-currency: use path payment with DEX
        logger.info('Executing cross-currency path payment', {
          sourceCurrency: params.sourceAsset.code,
          destCurrency: params.destAsset.code,
        });

        // Find optimal payment path
        const path = await this.pathFinder.findOptimalPath(
          params.sourceAsset,
          params.destAsset,
          params.sourceAmount,
          params.destination
        );

        transaction = new StellarSdk.TransactionBuilder(routerAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: this.networkPassphrase,
        })
          .addOperation(
            StellarSdk.Operation.pathPaymentStrictSend({
              sendAsset: sourceAsset,
              sendAmount: params.sourceAmount,
              destination: params.destination,
              destAsset: destAsset,
              destMin: this.calculateMinDestAmount(path.destination_amount),
              path: path.path,
            })
          )
          .addMemo(StellarSdk.Memo.text(params.memo))
          .setTimeout(180)
          .build();

        destinationAmount = path.destination_amount;
      }

      // Sign transaction
      transaction.sign(this.routerKeypair);

      // Submit transaction
      const response = await this.server.submitTransaction(transaction);

      const duration = Date.now() - startTime;

      logger.info('Payment successful', {
        hash: response.hash,
        ledger: response.ledger,
        duration,
        sameCurrency: isSameCurrency,
      });

      // Parse transaction result
      return {
        hash: response.hash,
        ledger: response.ledger,
        successful: response.successful,
        source_amount: params.sourceAmount,
        source_currency: params.sourceAsset.code,
        destination_amount: destinationAmount,
        destination_currency: params.destAsset.code,
        fee: (parseInt(StellarSdk.BASE_FEE) / 10000000).toString(),
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log detailed error information
      console.error('Stellar payment error:', error);

      logger.error('Path payment failed', {
        error: error instanceof Error ? error.message : String(error),
        errorDetails: error,
        duration,
        params,
      });

      // Parse Stellar error
      if (this.isStellarError(error)) {
        const resultCodes = error.response?.data?.extras?.result_codes;

        if (resultCodes?.operations?.includes('op_underfunded')) {
          throw new InsufficientFundsError('Insufficient funds for payment');
        }

        throw new StellarTransactionError(
          `Stellar transaction failed: ${resultCodes?.transaction || 'unknown error'}`,
          undefined,
          resultCodes
        );
      }

      throw new StellarTransactionError('Failed to execute path payment', undefined, { cause: error });
    }
  }

  /**
   * Find transactions by memo text
   * @param memoText Memo to search for
   * @returns Array of matching transactions
   */
  public async findTransactionsByMemo(memoText: string): Promise<StellarSdk.ServerApi.TransactionRecord[]> {
    logger.info('Searching for transactions by memo', { memo: memoText });

    try {
      const transactions = await this.server
        .transactions()
        .forAccount(this.routerKeypair.publicKey())
        .order('desc')
        .limit(200)
        .call();

      // Filter by memo
      const matches = transactions.records.filter((tx) => tx.memo === memoText);

      logger.info('Found transactions', { count: matches.length, memo: memoText });

      return matches;
    } catch (error) {
      logger.error('Error searching transactions', { error, memo: memoText });
      throw new StellarTransactionError('Failed to search transactions', undefined, { cause: error });
    }
  }

  /**
   * Establish trustline for an asset
   * @param trustline Trustline configuration
   */
  public async establishTrustline(trustline: TrustlineConfig): Promise<void> {
    logger.info('Establishing trustline', { asset: trustline.asset });

    try {
      const account = await this.server.loadAccount(this.routerKeypair.publicKey());
      const asset = this.createAsset(trustline.asset);

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset,
            limit: trustline.limit,
          })
        )
        .setTimeout(180)
        .build();

      transaction.sign(this.routerKeypair);

      const response = await this.server.submitTransaction(transaction);

      logger.info('Trustline established', {
        hash: response.hash,
        asset: trustline.asset.code,
      });
    } catch (error) {
      logger.error('Failed to establish trustline', { error, trustline });
      throw new StellarTransactionError('Failed to establish trustline', undefined, { cause: error });
    }
  }

  /**
   * Get account balance
   */
  public async getAccountBalance(): Promise<StellarSdk.Horizon.HorizonApi.BalanceLine[]> {
    try {
      const account = await this.server.loadAccount(this.routerKeypair.publicKey());
      return account.balances;
    } catch (error) {
      logger.error('Failed to get account balance', { error });
      throw new StellarTransactionError('Failed to get account balance', undefined, { cause: error });
    }
  }

  /**
   * Check if Horizon server is reachable
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.server.ledgers().limit(1).order('desc').call();
      return true;
    } catch (error) {
      logger.error('Horizon health check failed', { error });
      return false;
    }
  }

  /**
   * Get router account public key
   */
  public getRouterPublicKey(): string {
    return this.routerKeypair.publicKey();
  }

  /**
   * Create Stellar SDK Asset from configuration
   */
  private createAsset(assetConfig: StellarAssetConfig): StellarSdk.Asset {
    if (assetConfig.code === 'native' || assetConfig.issuer === null) {
      return StellarSdk.Asset.native();
    }

    return new StellarSdk.Asset(assetConfig.code, assetConfig.issuer);
  }

  /**
   * Check if two asset configurations are equal
   */
  private assetsEqual(asset1: StellarAssetConfig, asset2: StellarAssetConfig): boolean {
    // Both native
    if ((asset1.code === 'native' || asset1.issuer === null) &&
        (asset2.code === 'native' || asset2.issuer === null)) {
      return true;
    }

    // Compare code and issuer
    return asset1.code === asset2.code && asset1.issuer === asset2.issuer;
  }

  /**
   * Calculate minimum destination amount with 1% slippage tolerance
   */
  private calculateMinDestAmount(estimatedAmount: string): string {
    const amount = parseFloat(estimatedAmount);
    const minAmount = amount * 0.99; // 1% slippage
    return minAmount.toFixed(7);
  }

  /**
   * Type guard for Stellar errors
   */
  private isStellarError(error: unknown): error is StellarSdk.Horizon.HorizonApi.ErrorResponseData & { response: { data: { extras: { result_codes: { transaction: string; operations: string[] } } } } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response: unknown }).response === 'object'
    );
  }
}
