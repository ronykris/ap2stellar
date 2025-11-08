/**
 * Simple AI Agent Integration Example
 * Demonstrates how an AI agent can use the AP2Stellar API to make payments
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// AI Agent Configuration
const AGENT_CONFIG = {
  agentId: 'ai-assistant-001',
  jwtSecret: process.env.AP2_JWT_SECRET || 'c5fedbfa23a88adfd97ade7b37c57fe323ecbd06b750da25e493ebeb05299d18',
  ap2StellarUrl: process.env.AP2_STELLAR_URL || 'http://localhost:3000',
};

/**
 * AI Agent Payment Service
 */
class AIAgentPaymentService {
  constructor(config) {
    this.agentId = config.agentId;
    this.jwtSecret = config.jwtSecret;
    this.apiUrl = config.ap2StellarUrl;
  }

  /**
   * Generate JWT token for authentication
   */
  generateAuthToken() {
    const payload = {
      agent_id: this.agentId,
      permissions: ['payment:send', 'payment:receive'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    };

    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Get exchange rate quote
   */
  async getQuote(sourceCurrency, destinationCurrency, amount) {
    console.log(`\n🔍 Getting quote: ${amount} ${sourceCurrency} → ${destinationCurrency}`);

    try {
      const response = await axios.get(`${this.apiUrl}/api/v1/quote`, {
        params: {
          source_currency: sourceCurrency,
          destination_currency: destinationCurrency,
          source_amount: amount,
        },
      });

      if (response.data.status === 'success') {
        const quote = response.data.data;
        console.log(`✅ Quote received:`);
        console.log(`   Rate: 1 ${quote.source_currency} = ${quote.exchange_rate} ${quote.destination_currency}`);
        console.log(`   You'll receive: ${quote.estimated_destination_amount} ${quote.destination_currency}`);
        console.log(`   Estimated fee: ${quote.estimated_fee} XLM`);
        return quote;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get quote');
      }
    } catch (error) {
      console.error('❌ Quote error:', error.message);
      throw error;
    }
  }

  /**
   * Send a payment
   */
  async sendPayment(paymentDetails) {
    console.log(`\n💸 Sending payment: ${paymentDetails.amount} ${paymentDetails.currency}`);

    const paymentIntent = {
      intent_id: uuidv4(),
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      recipient: {
        agent_id: paymentDetails.recipientAgentId,
        payment_address: paymentDetails.recipientAddress,
        destination_currency: paymentDetails.destinationCurrency,
      },
      sender: {
        agent_id: this.agentId,
        authorization_token: this.generateAuthToken(),
      },
      metadata: paymentDetails.metadata || {},
      callback_url: paymentDetails.callbackUrl,
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/ap2/payment`,
        paymentIntent,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.data.status === 'completed') {
        console.log('✅ Payment successful!');
        console.log(`   TX Hash: ${response.data.transaction_details.transaction_hash}`);
        console.log(`   Sent: ${response.data.amount.sent} ${response.data.amount.currency_sent}`);
        console.log(`   Received: ${response.data.amount.received} ${response.data.amount.currency_received}`);
        console.log(`   Network Fee: ${response.data.fees.network_fee} XLM`);
        console.log(`   Settlement Time: ${response.data.transaction_details.settlement_time_seconds}s`);

        return {
          success: true,
          intentId: paymentIntent.intent_id,
          confirmation: response.data,
        };
      } else {
        console.error('❌ Payment failed:', response.data.error?.message);
        return {
          success: false,
          intentId: paymentIntent.intent_id,
          error: response.data.error,
        };
      }
    } catch (error) {
      console.error('❌ Payment error:', error.message);
      throw error;
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(intentId) {
    console.log(`\n🔍 Checking payment status for intent: ${intentId}`);

    try {
      const response = await axios.get(
        `${this.apiUrl}/api/v1/ap2/payment/${intentId}`
      );

      console.log(`   Status: ${response.data.status}`);
      if (response.data.transaction_details) {
        console.log(`   TX Hash: ${response.data.transaction_details.transaction_hash}`);
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   Payment not found');
        return null;
      }
      throw error;
    }
  }

  /**
   * AI Agent Decision Making: Should I make this payment?
   */
  async evaluatePayment(paymentRequest) {
    console.log('\n🤖 AI Agent evaluating payment request...');

    // Step 1: Get a quote to understand the exchange rate
    const quote = await this.getQuote(
      paymentRequest.currency,
      paymentRequest.destinationCurrency || paymentRequest.currency,
      paymentRequest.amount
    );

    // Step 2: AI logic to evaluate if this is a good payment
    const expectedReceive = parseFloat(quote.estimated_destination_amount);
    const fee = parseFloat(quote.estimated_fee);

    console.log('\n💭 AI Analysis:');
    console.log(`   Expected to receive: ${expectedReceive} ${quote.destination_currency}`);
    console.log(`   Network fee: ${fee} XLM`);

    // Simple AI decision logic (can be enhanced with ML models, risk assessment, etc.)
    if (fee > 1.0) {
      console.log('   ⚠️  Warning: High network fee');
    }

    if (expectedReceive < parseFloat(paymentRequest.amount) * 0.95) {
      console.log('   ⚠️  Warning: Exchange rate may not be favorable (>5% loss)');
    }

    console.log('   ✅ Payment approved by AI agent');

    return {
      approved: true,
      quote,
      reasoning: 'Payment within acceptable parameters',
    };
  }
}

/**
 * Example usage scenarios
 */
async function demonstrateAIAgentIntegration() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🤖 AI Agent Payment Integration Demo');
  console.log('═══════════════════════════════════════════════════════');

  const agent = new AIAgentPaymentService(AGENT_CONFIG);

  // Scenario 1: AI Agent receives instruction to make a payment
  console.log('\n📋 Scenario 1: AI Agent Making a Payment Decision');
  console.log('─────────────────────────────────────────────────────');

  const paymentRequest = {
    amount: '25.00',
    currency: 'XLM',
    destinationCurrency: 'USDC',
    recipientAgentId: 'merchant-ai-agent',
    recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
    metadata: {
      purpose: 'AI service subscription payment',
      service: 'GPT-4 API Credits',
    },
  };

  // AI Agent evaluates the payment
  const evaluation = await agent.evaluatePayment(paymentRequest);

  if (evaluation.approved) {
    // AI Agent executes the payment
    const result = await agent.sendPayment(paymentRequest);

    if (result.success) {
      console.log('\n🎉 AI Agent successfully completed payment!');

      // AI Agent can track the payment
      setTimeout(async () => {
        await agent.checkPaymentStatus(result.intentId);
      }, 2000);
    }
  }

  // Scenario 2: AI Agent queries exchange rates for planning
  console.log('\n\n📋 Scenario 2: AI Agent Planning Future Payments');
  console.log('─────────────────────────────────────────────────────');

  const currencies = [
    { from: 'XLM', to: 'USDC', amount: '100' },
    { from: 'USDC', to: 'XLM', amount: '50' },
  ];

  for (const pair of currencies) {
    await agent.getQuote(pair.from, pair.to, pair.amount);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ AI Agent Integration Demo Complete!');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run the demo if executed directly
if (require.main === module) {
  demonstrateAIAgentIntegration().catch(console.error);
}

module.exports = { AIAgentPaymentService };
