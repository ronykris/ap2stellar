/**
 * LLM-Powered AI Payment Agent (TypeScript)
 * Uses real AI language models to make autonomous payment decisions
 */

import axios, { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { LLMPaymentAnalyzer, LLMConfig, PaymentRequest, Quote, Analysis } from './LLMPaymentAnalyzer';

// Type Definitions
interface Config {
  agentId: string;
  jwtSecret: string;
  apiUrl: string;
  llmProvider: 'openai' | 'anthropic' | 'ollama';
  llmApiKey?: string;
  llmModel?: string;
  llmBaseURL?: string;
}

interface QuoteResponse {
  status: string;
  data: Quote;
  error?: { message: string };
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
  llmProvider: string;
  llmModel: string;
  llmConfidence: number;
}

interface AnalysisWithQuote extends Analysis {
  quote: Quote;
}

// Configuration
const CONFIG: Config = {
  // AP2Stellar Configuration
  agentId: 'llm-ai-agent',
  jwtSecret: process.env.AP2_JWT_SECRET || 'c5fedbfa23a88adfd97ade7b37c57fe323ecbd06b750da25e493ebeb05299d18',
  apiUrl: process.env.AP2_STELLAR_URL || 'http://localhost:3000',

  // LLM Configuration
  llmProvider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic' | 'ollama') || 'ollama',
  llmApiKey: process.env.LLM_API_KEY,
  llmModel: process.env.LLM_MODEL,
  llmBaseURL: process.env.LLM_BASE_URL,
};

class LLMAIPaymentAgent {
  private agentId: string;
  private jwtSecret: string;
  private apiUrl: string;
  private llm: LLMPaymentAnalyzer;
  public transactionHistory: TransactionHistory[];

  constructor(config: Config) {
    this.agentId = config.agentId;
    this.jwtSecret = config.jwtSecret;
    this.apiUrl = config.apiUrl;

    // Initialize LLM analyzer
    this.llm = new LLMPaymentAnalyzer({
      provider: config.llmProvider,
      apiKey: config.llmApiKey,
      model: config.llmModel,
      baseURL: config.llmBaseURL,
    });

    this.transactionHistory = [];
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
   * Use LLM to analyze payment and make decision
   */
  async analyzePaymentWithLLM(paymentRequest: PaymentRequest): Promise<AnalysisWithQuote> {
    console.log('\n📊 Fetching real-time market data...');

    // Get quote from AP2Stellar
    const quote = await this.getQuote(
      paymentRequest.sourceCurrency,
      paymentRequest.destinationCurrency,
      paymentRequest.amount
    );

    console.log(`\n💹 Market Data:`);
    console.log(`   Exchange Rate: 1 ${quote.source_currency} = ${quote.exchange_rate} ${quote.destination_currency}`);
    console.log(`   You'll receive: ${quote.estimated_destination_amount} ${quote.destination_currency}`);
    console.log(`   Network Fee: ${quote.estimated_fee} XLM`);
    console.log(`   Path Length: ${quote.path_length} hops`);

    // Let LLM analyze the payment
    const analysis = await this.llm.analyzePayment(paymentRequest, quote);

    return { ...analysis, quote };
  }

  /**
   * Execute payment after LLM approval
   */
  async executePayment(paymentRequest: PaymentRequest, analysis: Analysis): Promise<PaymentResult> {
    console.log('\n💸 EXECUTING PAYMENT...');
    console.log('━'.repeat(70));

    const paymentIntent = {
      intent_id: uuidv4(),
      amount: paymentRequest.amount,
      currency: paymentRequest.sourceCurrency,
      recipient: {
        agent_id: paymentRequest.recipientAgentId,
        payment_address: paymentRequest.recipientAddress,
        destination_currency: paymentRequest.destinationCurrency,
      },
      sender: {
        agent_id: this.agentId,
        authorization_token: this.generateAuthToken(),
      },
      metadata: {
        llm_provider: analysis.provider,
        llm_model: analysis.model,
        llm_confidence: analysis.confidence,
        llm_risk_score: analysis.riskScore,
        llm_response_time_ms: analysis.responseTime,
        llm_reasoning: analysis.reasoning,
        ai_generated: true,
        timestamp: new Date().toISOString(),
        ...paymentRequest.metadata,
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
      console.log(`   TX Hash: ${tx.transaction_details.transaction_hash}`);
      console.log(`   Ledger: ${tx.transaction_details.ledger}`);
      console.log(`   Settlement Time: ${tx.transaction_details.settlement_time_seconds}s`);
      console.log(`\n💰 Amounts:`);
      console.log(`   Sent: ${tx.amount.sent} ${tx.amount.currency_sent}`);
      console.log(`   Received: ${tx.amount.received} ${tx.amount.currency_received}`);
      console.log(`\n💵 Fees:`);
      console.log(`   Network Fee: ${tx.fees.network_fee} XLM`);

      // Store in history
      this.transactionHistory.push({
        intentId: paymentIntent.intent_id,
        timestamp: new Date().toISOString(),
        txHash: tx.transaction_details.transaction_hash,
        sent: `${tx.amount.sent} ${tx.amount.currency_sent}`,
        received: `${tx.amount.received} ${tx.amount.currency_received}`,
        llmProvider: analysis.provider,
        llmModel: analysis.model,
        llmConfidence: analysis.confidence,
      });

      return { success: true, intentId: paymentIntent.intent_id, confirmation: tx };
    } else {
      throw new Error('Payment failed');
    }
  }

  showTransactionHistory(): void {
    console.log('\n📜 LLM AI AGENT TRANSACTION HISTORY:');
    console.log('━'.repeat(70));
    if (this.transactionHistory.length === 0) {
      console.log('   No transactions yet');
    } else {
      this.transactionHistory.forEach((tx, i) => {
        console.log(`\n   ${i + 1}. ${tx.timestamp}`);
        console.log(`      TX Hash: ${tx.txHash}`);
        console.log(`      Transfer: ${tx.sent} → ${tx.received}`);
        console.log(`      LLM: ${tx.llmProvider}/${tx.llmModel} (${tx.llmConfidence}% confidence)`);
      });
    }
    console.log('\n');
  }
}

/**
 * Run demo with LLM integration
 */
async function runLLMDemo(): Promise<void> {
  console.clear();
  console.log('═'.repeat(70));
  console.log('🤖 LLM-POWERED AI PAYMENT AGENT DEMO');
  console.log('═'.repeat(70));
  console.log('\nThis demo uses REAL AI language models to make payment decisions');
  console.log('and execute actual blockchain transactions.\n');

  console.log(`📋 Configuration:`);
  console.log(`   LLM Provider: ${CONFIG.llmProvider.toUpperCase()}`);
  console.log(`   Model: ${CONFIG.llmModel || 'default'}`);
  console.log(`   AP2Stellar: ${CONFIG.apiUrl}`);
  console.log(`   Agent ID: ${CONFIG.agentId}`);

  const agent = new LLMAIPaymentAgent(CONFIG);

  // Test LLM connection first
  console.log('\n');
  const connected = await agent.llm.testConnection();
  if (!connected) {
    console.error('\n❌ LLM connection failed. Please check your configuration:');
    console.error('\nFor OpenAI:');
    console.error('  export LLM_PROVIDER=openai');
    console.error('  export LLM_API_KEY=sk-...');
    console.error('\nFor Anthropic Claude:');
    console.error('  export LLM_PROVIDER=anthropic');
    console.error('  export LLM_API_KEY=sk-ant-...');
    console.error('\nFor Ollama (local):');
    console.error('  export LLM_PROVIDER=ollama');
    console.error('  # Ensure Ollama is running: ollama serve');
    process.exit(1);
  }

  // Demo scenarios
  const scenarios: Array<{ name: string; description: string; request: PaymentRequest }> = [
    {
      name: 'E-Commerce Payment',
      description: 'LLM analyzes a standard e-commerce transaction',
      request: {
        amount: '20.00',
        sourceCurrency: 'XLM',
        destinationCurrency: 'USDC',
        recipientAgentId: 'merchant-ecommerce-agent',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'Product purchase',
          order_id: 'ORD-2024-042',
          items: ['Laptop', 'Mouse'],
          customer_verified: true,
        },
      },
    },
    {
      name: 'Subscription Payment',
      description: 'LLM evaluates recurring subscription payment',
      request: {
        amount: '50.00',
        sourceCurrency: 'XLM',
        destinationCurrency: 'USDC',
        recipientAgentId: 'merchant-subscription-service',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'Monthly subscription',
          service: 'AI API Credits',
          subscription_type: 'premium',
          recurring: true,
        },
      },
    },
    {
      name: 'Peer-to-Peer Transfer',
      description: 'LLM assesses agent-to-agent payment',
      request: {
        amount: '10.00',
        sourceCurrency: 'XLM',
        destinationCurrency: 'XLM',
        recipientAgentId: 'peer-ai-agent',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'Task completion reward',
          task_id: 'TASK-123',
          task_type: 'data_processing',
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
    console.log(`   Destination: ${scenario.request.destinationCurrency}`);
    console.log(`   Recipient: ${scenario.request.recipientAgentId}`);
    console.log(`   Purpose: ${scenario.request.metadata?.purpose}`);

    try {
      // LLM analyzes payment
      const analysis = await agent.analyzePaymentWithLLM(scenario.request);

      console.log(`\n🎯 LLM DECISION: ${analysis.approved ? '✅ APPROVED' : '❌ REJECTED'}`);

      if (analysis.approved) {
        // Execute payment
        await agent.executePayment(scenario.request, analysis);

        if (i < scenarios.length - 1) {
          console.log(`\n⏳ Preparing next scenario...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        console.log('\n🚫 Payment rejected by LLM - transaction cancelled');
      }
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}`);
      if (error.response?.data) {
        console.error(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }

  // Show transaction history
  agent.showTransactionHistory();

  console.log('═'.repeat(70));
  console.log('✅ LLM AI DEMO COMPLETE');
  console.log('═'.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Total LLM Decisions: ${scenarios.length}`);
  console.log(`   Transactions Executed: ${agent.transactionHistory.length}`);
  console.log(`   LLM Provider: ${CONFIG.llmProvider.toUpperCase()}`);
  console.log(`\n💡 All payment decisions made by real AI language model!`);
  console.log('\n');
}

// Run the demo
if (require.main === module) {
  runLLMDemo().catch(console.error);
}

export { LLMAIPaymentAgent };
