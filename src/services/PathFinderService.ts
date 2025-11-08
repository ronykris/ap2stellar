/**
 * Path Finder Service for Stellar DEX
 * Finds optimal payment paths through the DEX
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { DEXPath, StellarAssetConfig } from '../types';
import { NoPathFoundError } from '../utils/errors';
import logger from '../utils/logger';

export class PathFinderService {
  private server: StellarSdk.Horizon.Server;

  constructor(server: StellarSdk.Horizon.Server) {
    this.server = server;
  }

  /**
   * Find optimal payment path using strictSendPaths
   * @param sourceAsset Source asset configuration
   * @param destAsset Destination asset configuration
   * @param sourceAmount Amount to send
   * @param destinationAccount Destination account public key
   * @returns Optimal path with estimated amounts
   */
  public async findOptimalPath(
    sourceAsset: StellarAssetConfig,
    destAsset: StellarAssetConfig,
    sourceAmount: string,
    destinationAccount: string
  ): Promise<DEXPath> {
    logger.info('Finding optimal payment path', {
      sourceAsset: sourceAsset.code,
      destAsset: destAsset.code,
      sourceAmount,
      destinationAccount,
    });

    try {
      // Create Stellar SDK Asset objects
      const source = this.createAsset(sourceAsset);
      const destination = this.createAsset(destAsset);

      // Query Horizon for strict send paths
      const pathsResponse = await this.server
        .strictSendPaths(source, sourceAmount, [destination])
        .call();

      if (!pathsResponse.records || pathsResponse.records.length === 0) {
        throw new NoPathFoundError(
          `No payment path found from ${sourceAsset.code} to ${destAsset.code}`
        );
      }

      // Select the path with the highest destination amount
      const bestPath = pathsResponse.records.reduce((best, current) => {
        const bestAmount = parseFloat(best.destination_amount);
        const currentAmount = parseFloat(current.destination_amount);
        return currentAmount > bestAmount ? current : best;
      });

      logger.info('Found optimal path', {
        sourceAmount: bestPath.source_amount,
        destinationAmount: bestPath.destination_amount,
        pathLength: bestPath.path.length,
      });

      return {
        source_amount: bestPath.source_amount,
        destination_amount: bestPath.destination_amount,
        path: bestPath.path,
      };
    } catch (error) {
      if (error instanceof NoPathFoundError) {
        throw error;
      }

      logger.error('Error finding payment path', { error });
      throw new NoPathFoundError('Failed to query DEX for payment paths', { cause: error });
    }
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
   * Estimate conversion rate between two assets
   */
  public async estimateConversionRate(
    sourceAsset: StellarAssetConfig,
    destAsset: StellarAssetConfig,
    sourceAmount: string,
    destinationAccount: string
  ): Promise<string> {
    const path = await this.findOptimalPath(sourceAsset, destAsset, sourceAmount, destinationAccount);

    const sourceAmt = parseFloat(path.source_amount);
    const destAmt = parseFloat(path.destination_amount);

    if (sourceAmt === 0) {
      throw new Error('Invalid source amount in path');
    }

    const rate = destAmt / sourceAmt;
    return rate.toFixed(7);
  }
}
