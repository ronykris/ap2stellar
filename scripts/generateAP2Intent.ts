/**
 * Generate AP2 Payment Intent Script
 * Creates a test AP2 payment intent with valid JWT token
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.AP2_JWT_SECRET || 'development_secret_min_32_characters_long';

/**
 * Generate a JWT token for testing
 */
function generateJWT(agentId: string): string {
  const payload = {
    agent_id: agentId,
    permissions: ['payment:send', 'payment:receive'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

/**
 * Generate a test AP2 payment intent
 */
function generatePaymentIntent() {
  const intentId = uuidv4();
  const senderAgentId = 'test-ai-agent-001';
  const recipientAgentId = 'test-recipient-agent-002';

  // Example Stellar testnet address (replace with actual funded account)
  const recipientAddress = 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789ABC';

  const authToken = generateJWT(senderAgentId);

  const paymentIntent = {
    intent_id: intentId,
    amount: '100.00',
    currency: 'USD',
    recipient: {
      agent_id: recipientAgentId,
      payment_address: `stellar:${recipientAddress}`,
      payment_network: 'stellar',
      destination_currency: 'USDC',
    },
    sender: {
      agent_id: senderAgentId,
      authorization_token: authToken,
    },
    metadata: {
      purpose: 'Test payment',
      reference: 'TEST-001',
    },
    callback_url: 'https://example.com/callback',
    expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  };

  return paymentIntent;
}

// Generate and print the payment intent
const intent = generatePaymentIntent();

console.log('Generated AP2 Payment Intent:');
console.log(JSON.stringify(intent, null, 2));
console.log('\n');
console.log('To test, send this payload to POST http://localhost:3000/api/v1/ap2/payment');
console.log('\n');
console.log('Example curl command:');
console.log(`curl -X POST http://localhost:3000/api/v1/ap2/payment \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(intent)}'`);
