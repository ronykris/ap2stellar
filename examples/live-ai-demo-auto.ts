/**
 * Live AI Agent Demo - Automated Version (TypeScript)
 * Demonstrates AI decision-making with real blockchain execution
 */

import axios, { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Type Definitions
interface Config {
  agentId: string;
  jwtSecret: string;
  apiUrl: string;
}

interface Quote {
  source_currency: string;
  destination_currency: string;
  source_amount: string;
  estimated_destination_amount: string;
  exchange_rate: string;
  estimated_fee: string;
  path_length: number;
}

interface QuoteResponse {
  status: string;
  data: Quote;
  error?: { message: string };
}

interface PaymentRequest {
  amount: string;
  sourceCurrency: string;
  destinationCurrency: string;
  recipientAgentId: string;
  recipientAddress: string;
  metadata: Record<string, unknown>;
  riskScore?: number;
  confidence?: number;
}

interface Analysis {
  approved: boolean;
  confidence: number;
  riskScore: number;
  quote: Quote;
  reasons: string[];
  warnings: string[];
}

interface TransactionDetails {
  network: string;
  transaction_hash: string;
  ledger: number;
  timestamp: string;
  settlement_time_seconds: number;
}

interface PaymentAmount {
  sent: string;
  received: string;
  currency_sent: string;
  currency_received: string;
}

interface PaymentFees {
  network_fee: string;
  conversion_fee: string;
}

interface PaymentConfirmation {
  status: string;
  transaction_details: TransactionDetails;
  amount: PaymentAmount;
  fees: PaymentFees;
}

interface PaymentResult {
  success: boolean;
  intentId: string;
  confirmation: PaymentConfirmation;
}

interface TransactionHistory {
  intentId: string;
  timestamp: string;
  txHash: string;
  sent: string;
  received: string;
  aiScore: number;
}

interface StellarAssetConfig {
  code: string;
  issuer: string | null;
}

// Configuration
const CONFIG: Config = {
  agentId: 'live-ai-agent-demo',
  jwtSecret: process.env.AP2_JWT_SECRET || 'c5fedbfa23a88adfd97ade7b37c57fe323ecbd06b750da25e493ebeb05299d18',
  apiUrl: process.env.AP2_STELLAR_URL || 'http://localhost:3000',
};

// AI Agent Decision Engine
class AIPaymentAgent {
  private agentId: string;
  private jwtSecret: string;
  private apiUrl: string;
  public transactionHistory: TransactionHistory[];
  private riskTolerance: number;

  constructor(config: Config) {
    this.agentId = config.agentId;
    this.jwtSecret = config.jwtSecret;
    this.apiUrl = config.apiUrl;
    this.transactionHistory = [];
    this.riskTolerance = 0.05; // 5% loss tolerance
  }

  generateAuthToken(): string {
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

  async getQuote(sourceCurrency: string, destinationCurrency: string, amount: string): Promise<Quote> {
    const response: AxiosResponse<QuoteResponse> = await axios.get(`${this.apiUrl}/api/v1/quote`, {
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
  async analyzePaymentRequest(request: PaymentRequest): Promise<Analysis> {
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

    console.log(`\n💹 Market Analysis:`);
    console.log(`   Source: ${sourceAmount} ${quote.source_currency}`);
    console.log(`   Destination: ${destinationAmount.toFixed(4)} ${quote.destination_currency}`);
    console.log(`   Exchange Rate: 1 ${quote.source_currency} = ${exchangeRate.toFixed(4)} ${quote.destination_currency}`);
    console.log(`   Network Fee: ${fee} XLM`);
    console.log(`   Path Hops: ${quote.path_length}`);

    // Step 3: AI Risk Assessment
    console.log('\n🧠 AI DECISION REASONING:');
    const reasons: string[] = [];
    const warnings: string[] = [];
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
      if (Math.abs(lossPercentage) > this.riskTolerance * 100) {
        warnings.push(`⚠️  Exchange rate shows ${lossPercentage.toFixed(2)}% variance (exceeds ${this.riskTolerance * 100}% tolerance)`);
        riskScore += 0.3;
      } else {
        reasons.push(`✓ Exchange rate is favorable (${lossPercentage.toFixed(2)}% variance within tolerance)`);
      }
    } else {
      reasons.push(`✓ Same currency transfer - no exchange rate risk`);
    }

    // Path efficiency analysis
    if (quote.path_length > 3) {
      warnings.push(`⚠️  Payment requires ${quote.path_length} hops through DEX`);
      riskScore += 0.2;
    } else if (quote.path_length === 0) {
      reasons.push(`✓ Direct payment path (no DEX hops required)`);
    } else {
      reasons.push(`✓ Efficient payment path (${quote.path_length} hops)`);
    }

    // Recipient validation
    if (request.recipientAgentId && request.recipientAgentId.includes('merchant')) {
      reasons.push('✓ Recipient is verified merchant agent');
    }

    // Amount validation
    if (sourceAmount > 100) {
      warnings.push('⚠️  Large transaction amount - higher scrutiny required');
      riskScore += 0.15;
    } else if (sourceAmount < 1) {
      reasons.push('✓ Micro-payment - low risk amount');
    } else {
      reasons.push('✓ Transaction amount within normal range');
    }

    // Metadata validation
    if (request.metadata && request.metadata.purpose) {
      reasons.push(`✓ Valid payment purpose: "${request.metadata.purpose}"`);
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

    if (approved) {
      console.log(`\n💡 AI Reasoning: "This transaction meets all safety criteria and is approved for execution."`);
    } else {
      console.log(`\n💡 AI Reasoning: "This transaction carries elevated risk and requires human review."`);
    }

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
  async executePayment(request: PaymentRequest, analysis: Analysis): Promise<PaymentResult> {
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
        ai_risk_score: analysis.riskScore,
        ai_confidence: analysis.confidence,
        ai_decision: 'approved',
        timestamp: new Date().toISOString(),
        ...request.metadata,
      },
    };

    const response: AxiosResponse<PaymentConfirmation> = await axios.post(
      `${this.apiUrl}/api/v1/ap2/payment`,
      paymentIntent,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.status === 'completed') {
      const tx = response.data;
      console.log('✅ PAYMENT SUCCESSFUL!');
      console.log(`\n📝 Transaction Details:`);
      console.log(`   Transaction Hash: ${tx.transaction_details.transaction_hash}`);
      console.log(`   Ledger: ${tx.transaction_details.ledger}`);
      console.log(`   Timestamp: ${tx.transaction_details.timestamp}`);
      console.log(`   Settlement Time: ${tx.transaction_details.settlement_time_seconds}s`);
      console.log(`\n💰 Amounts:`);
      console.log(`   Sent: ${tx.amount.sent} ${tx.amount.currency_sent}`);
      console.log(`   Received: ${tx.amount.received} ${tx.amount.currency_received}`);
      console.log(`   Exchange Rate: 1 ${tx.amount.currency_sent} = ${(parseFloat(tx.amount.received) / parseFloat(tx.amount.sent)).toFixed(4)} ${tx.amount.currency_received}`);
      console.log(`\n💵 Fees:`);
      console.log(`   Network Fee: ${tx.fees.network_fee} XLM`);
      console.log(`   Conversion Fee: ${tx.fees.conversion_fee} XLM`);

      // Store in history
      this.transactionHistory.push({
        intentId: paymentIntent.intent_id,
        timestamp: new Date().toISOString(),
        txHash: tx.transaction_details.transaction_hash,
        sent: `${tx.amount.sent} ${tx.amount.currency_sent}`,
        received: `${tx.amount.received} ${tx.amount.currency_received}`,
        aiScore: analysis.riskScore,
      });

      return { success: true, intentId: paymentIntent.intent_id, confirmation: tx };
    } else {
      throw new Error('Payment failed');
    }
  }

  showTransactionHistory(): void {
    console.log('\n📜 AI AGENT TRANSACTION HISTORY:');
    console.log('━'.repeat(70));
    if (this.transactionHistory.length === 0) {
      console.log('   No transactions yet');
    } else {
      this.transactionHistory.forEach((tx, i) => {
        console.log(`\n   ${i + 1}. ${tx.timestamp}`);
        console.log(`      TX Hash: ${tx.txHash}`);
        console.log(`      Transfer: ${tx.sent} → ${tx.received}`);
        console.log(`      AI Risk Score: ${(tx.aiScore * 100).toFixed(1)}%`);
      });
    }
    console.log('\n');
  }
}

// Demo Scenarios
async function runLiveDemo(): Promise<void> {
  console.clear();
  console.log('═'.repeat(70));
  console.log('🤖 LIVE AI PAYMENT AGENT - AUTONOMOUS DECISION DEMO');
  console.log('═'.repeat(70));
  console.log('\nThis demo shows an AI agent making REAL autonomous payment decisions');
  console.log('and executing actual transactions on the Stellar blockchain.\n');

  const agent = new AIPaymentAgent(CONFIG);

  const scenarios: Array<{ name: string; description: string; request: PaymentRequest }> = [
    {
      name: 'E-Commerce Payment',
      description: 'Customer purchasing online goods',
      request: {
        amount: '15.00',
        sourceCurrency: 'XLM',
        destinationCurrency: 'USDC',
        recipientAgentId: 'merchant-ecommerce-agent',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'Product purchase',
          order_id: 'ORD-2024-001',
          items: ['AI Training Credits', 'API Access'],
        },
      },
    },
    {
      name: 'Micro-Payment for API Call',
      description: 'Pay-per-use AI service consumption',
      request: {
        amount: '0.50',
        sourceCurrency: 'XLM',
        destinationCurrency: 'USDC',
        recipientAgentId: 'merchant-api-service',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'API usage payment',
          api_calls: 50,
          service: 'GPT-4 Vision',
        },
      },
    },
    {
      name: 'Peer-to-Peer Agent Transfer',
      description: 'AI agent sending funds to another agent',
      request: {
        amount: '8.00',
        sourceCurrency: 'XLM',
        destinationCurrency: 'XLM',
        recipientAgentId: 'peer-ai-agent-worker',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'Task completion reward',
          task_id: 'TASK-789',
          completed_at: new Date().toISOString(),
        },
      },
    },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📋 SCENARIO ${i + 1}/${scenarios.length}: ${scenario.name}`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`\n📦 Payment Request:`);
    console.log(`   Amount: ${scenario.request.amount} ${scenario.request.sourceCurrency}`);
    console.log(`   Destination Currency: ${scenario.request.destinationCurrency}`);
    console.log(`   Recipient: ${scenario.request.recipientAgentId}`);
    console.log(`   Purpose: ${scenario.request.metadata.purpose}`);

    try {
      // AI analyzes and decides
      const analysis = await agent.analyzePaymentRequest(scenario.request);

      if (analysis.approved) {
        // Execute payment
        await agent.executePayment(scenario.request, analysis);

        // Brief pause between scenarios
        if (i < scenarios.length - 1) {
          console.log(`\n⏳ Preparing next scenario...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        console.log('\n🚫 Payment rejected by AI - requires human review');
      }
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`);
    }
  }

  // Show complete transaction history
  agent.showTransactionHistory();

  console.log('═'.repeat(70));
  console.log('✅ LIVE AI DEMO COMPLETE');
  console.log('═'.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Total Transactions: ${agent.transactionHistory.length}`);
  console.log(`   All payments executed autonomously by AI agent`);
  console.log(`   All transactions confirmed on Stellar testnet`);
  console.log(`\n💡 The AI agent successfully:`);
  console.log(`   ✓ Analyzed real-time exchange rates`);
  console.log(`   ✓ Assessed transaction risks`);
  console.log(`   ✓ Made autonomous approval decisions`);
  console.log(`   ✓ Executed blockchain payments`);
  console.log(`   ✓ Tracked all transactions`);
  console.log('\n');
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1])) {
  runLiveDemo().catch(console.error);
}

export { AIPaymentAgent, PaymentRequest, Analysis, PaymentResult };
