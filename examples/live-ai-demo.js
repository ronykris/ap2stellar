/**
 * Live AI Agent Demo - Interactive Payment Decision System
 * Simulates an AI agent making real-time payment decisions with actual blockchain execution
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

// Configuration
const CONFIG = {
  agentId: 'live-ai-agent-demo',
  jwtSecret: process.env.AP2_JWT_SECRET || 'c5fedbfa23a88adfd97ade7b37c57fe323ecbd06b750da25e493ebeb05299d18',
  apiUrl: process.env.AP2_STELLAR_URL || 'http://localhost:3000',
};

// AI Agent Decision Engine
class AIPaymentAgent {
  constructor(config) {
    this.agentId = config.agentId;
    this.jwtSecret = config.jwtSecret;
    this.apiUrl = config.apiUrl;
    this.transactionHistory = [];
    this.riskTolerance = 0.05; // 5% loss tolerance
  }

  generateAuthToken() {
    return jwt.sign(
      {
        agent_id: this.agentId,
        permissions: ['payment:send', 'payment:receive'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      this.jwtSecret,
      { algorithm: 'HS256' }
    );
  }

  async getQuote(sourceCurrency, destinationCurrency, amount) {
    const response = await axios.get(`${this.apiUrl}/api/v1/quote`, {
      params: {
        source_currency: sourceCurrency,
        destination_currency: destinationCurrency,
        source_amount: amount,
      },
    });

    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to get quote');
  }

  /**
   * AI Decision Engine - Analyzes payment request and makes autonomous decision
   */
  async analyzePaymentRequest(request) {
    console.log('\n🤖 AI AGENT ANALYZING REQUEST...');
    console.log('━'.repeat(70));

    // Step 1: Get real-time market data
    console.log('\n📊 Fetching real-time exchange rates...');
    const quote = await this.getQuote(
      request.sourceCurrency,
      request.destinationCurrency,
      request.amount
    );

    // Step 2: Calculate financial metrics
    const sourceAmount = parseFloat(request.amount);
    const destinationAmount = parseFloat(quote.estimated_destination_amount);
    const exchangeRate = parseFloat(quote.exchange_rate);
    const fee = parseFloat(quote.estimated_fee);
    const effectiveRate = destinationAmount / sourceAmount;

    console.log(`\n💹 Market Analysis:`);
    console.log(`   Source: ${sourceAmount} ${quote.source_currency}`);
    console.log(`   Destination: ${destinationAmount.toFixed(4)} ${quote.destination_currency}`);
    console.log(`   Exchange Rate: 1 ${quote.source_currency} = ${exchangeRate.toFixed(4)} ${quote.destination_currency}`);
    console.log(`   Network Fee: ${fee} XLM`);

    // Step 3: AI Risk Assessment
    console.log('\n🧠 AI DECISION REASONING:');
    const reasons = [];
    const warnings = [];
    let riskScore = 0;

    // Fee analysis
    if (fee > 0.001) {
      warnings.push(`⚠️  Network fee (${fee} XLM) is higher than usual`);
      riskScore += 0.1;
    } else {
      reasons.push(`✓ Network fee (${fee} XLM) is within acceptable range`);
    }

    // Exchange rate analysis
    if (quote.source_currency !== quote.destination_currency) {
      const lossPercentage = ((sourceAmount - destinationAmount / exchangeRate) / sourceAmount) * 100;
      if (lossPercentage > this.riskTolerance * 100) {
        warnings.push(`⚠️  Exchange rate shows ${lossPercentage.toFixed(2)}% loss (exceeds ${this.riskTolerance * 100}% tolerance)`);
        riskScore += 0.3;
      } else {
        reasons.push(`✓ Exchange rate is favorable (${lossPercentage.toFixed(2)}% loss within tolerance)`);
      }
    }

    // Path efficiency analysis
    if (quote.path_length > 3) {
      warnings.push(`⚠️  Payment requires ${quote.path_length} hops through DEX`);
      riskScore += 0.2;
    } else {
      reasons.push(`✓ Efficient payment path (${quote.path_length} hops)`);
    }

    // Recipient validation
    if (request.recipientAgentId && request.recipientAgentId.includes('merchant')) {
      reasons.push('✓ Recipient is verified merchant agent');
    }

    // Amount validation
    if (sourceAmount > 1000) {
      warnings.push('⚠️  Large transaction amount - higher scrutiny required');
      riskScore += 0.2;
    } else if (sourceAmount < 1) {
      warnings.push('⚠️  Very small transaction - may not be cost-effective');
      riskScore += 0.1;
    } else {
      reasons.push('✓ Transaction amount within normal range');
    }

    // Display reasoning
    reasons.forEach(r => console.log(`   ${r}`));
    warnings.forEach(w => console.log(`   ${w}`));

    // Step 4: Make decision
    const approved = riskScore < 0.5;
    const confidence = Math.max(0, 100 - (riskScore * 100));

    console.log(`\n🎯 AI DECISION:`);
    console.log(`   Risk Score: ${(riskScore * 100).toFixed(1)}%`);
    console.log(`   Confidence: ${confidence.toFixed(1)}%`);
    console.log(`   Decision: ${approved ? '✅ APPROVED' : '❌ REJECTED'}`);

    return {
      approved,
      confidence,
      riskScore,
      quote,
      reasons,
      warnings,
    };
  }

  /**
   * Execute payment after AI approval
   */
  async executePayment(request, quote) {
    console.log('\n💸 EXECUTING PAYMENT...');
    console.log('━'.repeat(70));

    const paymentIntent = {
      intent_id: uuidv4(),
      amount: request.amount,
      currency: request.sourceCurrency,
      recipient: {
        agent_id: request.recipientAgentId,
        payment_address: request.recipientAddress,
        destination_currency: request.destinationCurrency,
      },
      sender: {
        agent_id: this.agentId,
        authorization_token: this.generateAuthToken(),
      },
      metadata: {
        ai_generated: true,
        risk_score: request.riskScore,
        confidence: request.confidence,
        timestamp: new Date().toISOString(),
        ...request.metadata,
      },
    };

    const response = await axios.post(
      `${this.apiUrl}/api/v1/ap2/payment`,
      paymentIntent,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.status === 'completed') {
      const tx = response.data;
      console.log('✅ PAYMENT SUCCESSFUL!');
      console.log(`   Transaction Hash: ${tx.transaction_details.transaction_hash}`);
      console.log(`   Sent: ${tx.amount.sent} ${tx.amount.currency_sent}`);
      console.log(`   Received: ${tx.amount.received} ${tx.amount.currency_received}`);
      console.log(`   Settlement Time: ${tx.transaction_details.settlement_time_seconds}s`);
      console.log(`   Ledger: ${tx.transaction_details.ledger}`);

      // Store in history
      this.transactionHistory.push({
        intentId: paymentIntent.intent_id,
        timestamp: new Date().toISOString(),
        txHash: tx.transaction_details.transaction_hash,
        sent: `${tx.amount.sent} ${tx.amount.currency_sent}`,
        received: `${tx.amount.received} ${tx.amount.currency_received}`,
      });

      return { success: true, intentId: paymentIntent.intent_id, confirmation: tx };
    } else {
      throw new Error(response.data.error?.message || 'Payment failed');
    }
  }

  showTransactionHistory() {
    console.log('\n📜 TRANSACTION HISTORY:');
    console.log('━'.repeat(70));
    if (this.transactionHistory.length === 0) {
      console.log('   No transactions yet');
    } else {
      this.transactionHistory.forEach((tx, i) => {
        console.log(`\n   ${i + 1}. ${tx.timestamp}`);
        console.log(`      TX: ${tx.txHash.substring(0, 16)}...`);
        console.log(`      Sent: ${tx.sent} → Received: ${tx.received}`);
      });
    }
  }
}

// Interactive Demo Scenarios
const SCENARIOS = [
  {
    id: 1,
    name: 'E-Commerce Payment',
    description: 'Customer paying for online purchase',
    request: {
      amount: '20.00',
      sourceCurrency: 'XLM',
      destinationCurrency: 'USDC',
      recipientAgentId: 'merchant-ecommerce-agent',
      recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
      metadata: { purpose: 'Product purchase', order_id: 'ORD-2024-001' },
    },
  },
  {
    id: 2,
    name: 'Subscription Payment',
    description: 'Monthly subscription to AI service',
    request: {
      amount: '50.00',
      sourceCurrency: 'XLM',
      destinationCurrency: 'USDC',
      recipientAgentId: 'merchant-subscription-service',
      recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
      metadata: { purpose: 'Monthly subscription', service: 'AI API Credits' },
    },
  },
  {
    id: 3,
    name: 'Peer-to-Peer Transfer',
    description: 'Send XLM to another AI agent (same currency)',
    request: {
      amount: '10.00',
      sourceCurrency: 'XLM',
      destinationCurrency: 'XLM',
      recipientAgentId: 'peer-ai-agent',
      recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
      metadata: { purpose: 'P2P transfer', type: 'agent-to-agent' },
    },
  },
  {
    id: 4,
    name: 'Micro-Payment',
    description: 'Small payment for micro-service',
    request: {
      amount: '2.50',
      sourceCurrency: 'XLM',
      destinationCurrency: 'USDC',
      recipientAgentId: 'merchant-microservice',
      recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
      metadata: { purpose: 'API call payment', calls: 100 },
    },
  },
  {
    id: 5,
    name: 'Custom Payment',
    description: 'Enter your own payment parameters',
    request: null, // Will be filled interactively
  },
];

// Main Interactive Demo
async function runInteractiveDemo() {
  console.clear();
  console.log('═'.repeat(70));
  console.log('🤖 LIVE AI PAYMENT AGENT DEMO');
  console.log('═'.repeat(70));
  console.log('\nThis demo simulates an AI agent making autonomous payment decisions');
  console.log('and executing REAL transactions on the Stellar testnet.\n');

  const agent = new AIPaymentAgent(CONFIG);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  while (true) {
    console.log('\n📋 AVAILABLE SCENARIOS:');
    console.log('━'.repeat(70));
    SCENARIOS.forEach((scenario) => {
      console.log(`   ${scenario.id}. ${scenario.name}`);
      console.log(`      ${scenario.description}`);
    });
    console.log('   6. View Transaction History');
    console.log('   0. Exit');

    const choice = await question('\n👉 Select a scenario (0-6): ');

    if (choice === '0') {
      console.log('\n👋 Exiting demo. Thank you!');
      rl.close();
      break;
    }

    if (choice === '6') {
      agent.showTransactionHistory();
      continue;
    }

    const scenarioIndex = parseInt(choice) - 1;
    if (scenarioIndex < 0 || scenarioIndex >= SCENARIOS.length) {
      console.log('❌ Invalid choice. Please try again.');
      continue;
    }

    const scenario = SCENARIOS[scenarioIndex];
    console.log(`\n🎬 SCENARIO: ${scenario.name}`);
    console.log('━'.repeat(70));
    console.log(`Description: ${scenario.description}\n`);

    let request = scenario.request;

    // Handle custom payment
    if (scenario.id === 5) {
      const amount = await question('Enter amount: ');
      const sourceCurrency = await question('Enter source currency (XLM/USDC): ');
      const destinationCurrency = await question('Enter destination currency (XLM/USDC): ');

      request = {
        amount,
        sourceCurrency: sourceCurrency.toUpperCase(),
        destinationCurrency: destinationCurrency.toUpperCase(),
        recipientAgentId: 'custom-recipient',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: { purpose: 'Custom payment', source: 'interactive-demo' },
      };
    }

    try {
      // AI analyzes the request
      const analysis = await agent.analyzePaymentRequest(request);

      if (analysis.approved) {
        const proceed = await question('\n❓ AI approved the payment. Execute? (y/n): ');

        if (proceed.toLowerCase() === 'y') {
          const result = await agent.executePayment(
            { ...request, riskScore: analysis.riskScore, confidence: analysis.confidence },
            analysis.quote
          );
          console.log('\n🎉 Transaction completed successfully!');
        } else {
          console.log('\n🚫 Payment cancelled by user.');
        }
      } else {
        console.log('\n🚫 AI rejected the payment due to high risk.');
        const override = await question('Override AI decision and execute anyway? (y/n): ');

        if (override.toLowerCase() === 'y') {
          const result = await agent.executePayment(
            { ...request, riskScore: analysis.riskScore, confidence: analysis.confidence, override: true },
            analysis.quote
          );
          console.log('\n⚠️  Transaction completed (AI override)!');
        } else {
          console.log('\n✅ Payment cancelled - AI decision respected.');
        }
      }
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
    }

    await question('\nPress Enter to continue...');
  }
}

// Run the demo
if (require.main === module) {
  runInteractiveDemo().catch(console.error);
}

module.exports = { AIPaymentAgent };
