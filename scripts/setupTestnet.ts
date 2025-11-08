/**
 * Setup Stellar Testnet Account Script
 * Creates a new account, funds it via Friendbot, and establishes trustlines
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';

/**
 * Create a new Stellar keypair
 */
function createKeypair(): StellarSdk.Keypair {
  const keypair = StellarSdk.Keypair.random();
  console.log('Generated new Stellar keypair:');
  console.log(`Public Key: ${keypair.publicKey()}`);
  console.log(`Secret Key: ${keypair.secret()}`);
  console.log('\nWARNING: Save the secret key securely. It will be needed for ROUTER_SECRET_KEY env variable.\n');
  return keypair;
}

/**
 * Fund account via Friendbot
 */
async function fundAccount(publicKey: string): Promise<void> {
  console.log(`Funding account ${publicKey} via Friendbot...`);

  try {
    const response = await axios.get(`${FRIENDBOT_URL}?addr=${publicKey}`);
    console.log('Account funded successfully!');
    console.log(`Transaction: ${response.data.hash}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Friendbot error:', error.response?.data || error.message);
    } else {
      console.error('Error funding account:', error);
    }
    throw error;
  }
}

/**
 * Establish trustline for an asset
 */
async function establishTrustline(
  keypair: StellarSdk.Keypair,
  assetCode: string,
  issuer: string
): Promise<void> {
  console.log(`\nEstablishing trustline for ${assetCode}...`);

  try {
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(keypair.publicKey());
    const asset = new StellarSdk.Asset(assetCode, issuer);

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset,
        })
      )
      .setTimeout(180)
      .build();

    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);

    console.log(`Trustline established for ${assetCode}`);
    console.log(`Transaction: ${result.hash}`);
  } catch (error) {
    console.error(`Error establishing trustline for ${assetCode}:`, error);
    throw error;
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('=== Stellar Testnet Account Setup ===\n');

  try {
    // Check if ROUTER_SECRET_KEY already exists
    const existingSecret = process.env.ROUTER_SECRET_KEY;

    let keypair: StellarSdk.Keypair;

    if (existingSecret) {
      console.log('Using existing ROUTER_SECRET_KEY from .env file\n');
      keypair = StellarSdk.Keypair.fromSecret(existingSecret);
      console.log(`Public Key: ${keypair.publicKey()}`);
    } else {
      // Create new keypair
      keypair = createKeypair();

      // Fund the account
      await fundAccount(keypair.publicKey());
    }

    // Wait a bit for the account to be fully created
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Establish trustlines for supported assets
    const USDC_ISSUER =
      process.env.USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    const EURC_ISSUER =
      process.env.EURC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    const GBPC_ISSUER =
      process.env.GBPC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

    await establishTrustline(keypair, 'USDC', USDC_ISSUER);
    await establishTrustline(keypair, 'EURC', EURC_ISSUER);
    await establishTrustline(keypair, 'GBPC', GBPC_ISSUER);

    console.log('\n=== Setup Complete ===');
    console.log('\nNext steps:');
    console.log('1. Add this to your .env file:');
    console.log(`   ROUTER_SECRET_KEY=${keypair.secret()}`);
    console.log('2. Fund the account with test USDC/EURC/GBPC tokens if needed');
    console.log('3. Start the server with: npm run dev');
    console.log(`\nView your account on Stellar Expert:`);
    console.log(`https://stellar.expert/explorer/testnet/account/${keypair.publicKey()}`);
  } catch (error) {
    console.error('\nSetup failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
