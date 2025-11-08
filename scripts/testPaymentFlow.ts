/**
 * Test Payment Flow Script
 * Tests the complete AP2 to Stellar payment flow
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.AP2_JWT_SECRET || 'development_secret_min_32_characters_long';

/**
 * Generate JWT token
 */
function generateJWT(agentId: string): string {
  const payload = {
    agent_id: agentId,
    permissions: ['payment:send', 'payment:receive'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

/**
 * Test health endpoint
 */
async function testHealth(): Promise<void> {
  console.log('Testing health endpoint...');
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('✓ Health check passed');
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Stellar: ${response.data.services.stellar}`);
    console.log(`  Horizon: ${response.data.services.horizon}\n`);
  } catch (error) {
    console.error('✗ Health check failed:', error);
    throw error;
  }
}

/**
 * Test quote endpoint
 */
async function testQuote(): Promise<void> {
  console.log('Testing quote endpoint...');
  try {
    const response = await axios.get(`${API_URL}/api/v1/quote`, {
      params: {
        source_currency: 'USD',
        destination_currency: 'EUR',
        source_amount: '100.00',
      },
    });

    console.log('✓ Quote request successful');
    console.log(`  Exchange rate: ${response.data.data.exchange_rate}`);
    console.log(`  Estimated destination: ${response.data.data.estimated_destination_amount}`);
    console.log(`  Path length: ${response.data.data.path_length}\n`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('✗ Quote request failed:', error.response?.data || error.message);
    } else {
      console.error('✗ Quote request failed:', error);
    }
    console.log('  (This may fail if DEX liquidity is low on testnet)\n');
  }
}

/**
 * Test payment endpoint
 */
async function testPayment(destinationAddress: string): Promise<string | null> {
  console.log('Testing payment endpoint...');

  const intentId = uuidv4();
  const senderAgentId = 'test-agent-001';

  const paymentIntent = {
    intent_id: intentId,
    amount: '10.00',
    currency: 'XLM',
    recipient: {
      agent_id: 'test-recipient-002',
      payment_address: `stellar:${destinationAddress}`,
      destination_currency: 'XLM',
    },
    sender: {
      agent_id: senderAgentId,
      authorization_token: generateJWT(senderAgentId),
    },
    metadata: {
      test: true,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    const response = await axios.post(`${API_URL}/api/v1/ap2/payment`, paymentIntent);

    console.log('✓ Payment successful');
    console.log(`  Confirmation ID: ${response.data.confirmation_id}`);
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Transaction Hash: ${response.data.transaction_details?.transaction_hash}`);
    console.log(`  Amount sent: ${response.data.amount?.sent} ${response.data.amount?.currency_sent}`);
    console.log(
      `  Amount received: ${response.data.amount?.received} ${response.data.amount?.currency_received}\n`
    );

    return intentId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('✗ Payment failed:', error.response?.data || error.message);
    } else {
      console.error('✗ Payment failed:', error);
    }
    return null;
  }
}

/**
 * Test payment status query
 */
async function testPaymentStatus(intentId: string): Promise<void> {
  console.log('Testing payment status query...');

  try {
    const response = await axios.get(`${API_URL}/api/v1/ap2/payment/${intentId}`);

    console.log('✓ Status query successful');
    console.log(`  Intent ID: ${response.data.intent_id}`);
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Transaction Hash: ${response.data.transaction_details?.transaction_hash}\n`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('✗ Status query failed:', error.response?.data || error.message);
    } else {
      console.error('✗ Status query failed:', error);
    }
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('=== AP2Stellar Payment Flow Test ===\n');

  // Get destination address from command line or use default
  const destinationAddress =
    process.argv[2] || process.env.TEST_DESTINATION_ADDRESS || '';

  if (!destinationAddress) {
    console.error(
      'Error: No destination address provided.\n' +
        'Usage: npm run test:flow <STELLAR_ADDRESS>\n' +
        'Or set TEST_DESTINATION_ADDRESS in .env file'
    );
    process.exit(1);
  }

  console.log(`Using destination address: ${destinationAddress}\n`);

  try {
    // Run tests in sequence
    await testHealth();
    await testQuote();

    const intentId = await testPayment(destinationAddress);

    if (intentId) {
      // Wait a bit for transaction to be recorded
      console.log('Waiting for transaction to be recorded...\n');
      await new Promise((resolve) => setTimeout(resolve, 10000));

      await testPaymentStatus(intentId);
    }

    console.log('=== Test Flow Complete ===');
  } catch (error) {
    console.error('\nTest flow failed:', error);
    process.exit(1);
  }
}

// Run the test
main();
