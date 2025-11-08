/**
 * Mock LLM Demo
 * Simulates LLM responses to demonstrate the integration without requiring API keys
 * This shows exactly what the real LLM integration would look like
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Configuration
const CONFIG = {
  agentId: 'mock-llm-agent',
  jwtSecret: process.env.AP2_JWT_SECRET || 'c5fedbfa23a88adfd97ade7b37c57fe323ecbd06b750da25e493ebeb05299d18',
  apiUrl: process.env.AP2_STELLAR_URL || 'http://localhost:3000',
};

/**
 * Mock LLM that simulates realistic AI responses
 */
class MockLLM {
  constructor() {
    this.model = 'mock-gpt-4';
    this.provider = 'MOCK (simulates real LLM)';
  }

  /**
   * Simulate LLM analysis with realistic reasoning
   */
  async analyzePayment(paymentRequest, quote) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const sourceAmount = parseFloat(paymentRequest.amount);
    const destinationAmount = parseFloat(quote.estimated_destination_amount);
    const fee = parseFloat(quote.estimated_fee);
    const exchangeRate = parseFloat(quote.exchange_rate);

    // Sophisticated decision logic (simulates LLM reasoning)
    let decision = 'APPROVED';
    let confidence = 95;
    let riskScore = 5;
    const concerns = [];
    const recommendations = [];
    let reasoning = '';

    // Analyze transaction amount
    if (sourceAmount > 100) {
      concerns.push('High-value transaction - increased scrutiny applied');
      riskScore += 15;
      confidence -= 10;
      recommendations.push('Consider splitting large transactions for risk mitigation');
    } else if (sourceAmount < 1) {
      recommendations.push('Micro-payment detected - ensure transaction value exceeds fees');
    }

    // Analyze fees
    const feePercentage = (fee / sourceAmount) * 100;
    if (feePercentage > 0.1) {
      concerns.push(`Network fee is ${feePercentage.toFixed(4)}% of transaction`);
      riskScore += 10;
      recommendations.push('Consider batching small payments to reduce fee impact');
    }

    // Analyze exchange rate
    if (quote.source_currency !== quote.destination_currency) {
      const effectiveRate = destinationAmount / sourceAmount;
      const deviation = Math.abs((effectiveRate - exchangeRate) / exchangeRate) * 100;

      if (deviation > 5) {
        concerns.push(`Exchange rate deviation: ${deviation.toFixed(2)}%`);
        riskScore += 20;
        confidence -= 15;
      }

      recommendations.push('Monitor exchange rate trends for optimal conversion timing');
    }

    // Analyze path efficiency
    if (quote.path_length > 2) {
      concerns.push(`Payment requires ${quote.path_length} hops through DEX`);
      riskScore += 10;
      confidence -= 5;
      recommendations.push('Consider direct currency pairs to reduce path length');
    } else if (quote.path_length === 0) {
      recommendations.push('Direct payment path - optimal efficiency');
    }

    // Analyze recipient
    if (paymentRequest.recipientAgentId.includes('merchant')) {
      recommendations.push('Verified merchant agent - transaction is likely legitimate');
      confidence += 3;
    }

    // Analyze metadata
    if (paymentRequest.metadata?.purpose) {
      const purpose = paymentRequest.metadata.purpose.toLowerCase();

      if (purpose.includes('subscription')) {
        recommendations.push('Recurring subscription payment - consider setting spending limits');
      }

      if (purpose.includes('purchase')) {
        recommendations.push('E-commerce transaction - verify order details match payment amount');
      }

      if (paymentRequest.metadata.customer_verified) {
        confidence += 2;
        riskScore -= 2;
      }
    } else {
      concerns.push('No payment purpose specified in metadata');
      riskScore += 5;
    }

    // Final decision
    if (riskScore > 50) {
      decision = 'REJECTED';
      confidence = Math.max(20, 100 - riskScore);
      reasoning = `This transaction carries elevated risk (${riskScore}% risk score). Key concerns include: ${concerns.join(', ')}. Manual review is recommended before proceeding.`;
    } else {
      reasoning = this.generateApprovalReasoning(paymentRequest, quote, concerns, recommendations);
    }

    return {
      approved: decision === 'APPROVED',
      confidence: Math.round(confidence),
      riskScore: Math.round(riskScore),
      reasoning,
      concerns,
      recommendations,
      provider: this.provider,
      model: this.model,
      responseTime: 800 + Math.floor(Math.random() * 1200),
    };
  }

  generateApprovalReasoning(paymentRequest, quote, concerns, recommendations) {
    const purpose = paymentRequest.metadata?.purpose || 'unspecified purpose';
    const recipient = paymentRequest.recipientAgentId;
    const isCrossCurrency = quote.source_currency !== quote.destination_currency;

    let reasoning = `This ${purpose} payment to ${recipient} is approved for execution. `;

    if (isCrossCurrency) {
      reasoning += `The cross-currency conversion from ${quote.source_currency} to ${quote.destination_currency} `;
      reasoning += `at rate ${quote.exchange_rate} is within acceptable market ranges. `;
    } else {
      reasoning += `Same-currency transfer minimizes exchange rate risk. `;
    }

    reasoning += `Network fees of ${quote.estimated_fee} XLM are minimal and appropriate for this transaction size. `;

    if (quote.path_length === 0) {
      reasoning += `Direct payment path ensures optimal efficiency without DEX routing. `;
    }

    if (concerns.length === 0) {
      reasoning += `No significant risk factors identified. Transaction meets all safety criteria.`;
    } else {
      reasoning += `While ${concerns.length} minor concern${concerns.length > 1 ? 's were' : ' was'} noted, `;
      reasoning += `they do not warrant rejection of this otherwise valid payment.`;
    }

    return reasoning;
  }
}

/**
 * Mock LLM AI Payment Agent
 */
class MockLLMAIPaymentAgent {
  constructor(config) {
    this.agentId = config.agentId;
    this.jwtSecret = config.jwtSecret;
    this.apiUrl = config.apiUrl;
    this.llm = new MockLLM();
    this.transactionHistory = [];
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

  async analyzePaymentWithLLM(paymentRequest) {
    console.log('\n📊 Fetching real-time market data...');

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

    console.log(`\n🤖 Calling ${this.llm.provider} (${this.llm.model})...`);
    console.log('━'.repeat(70));

    const analysis = await this.llm.analyzePayment(paymentRequest, quote);

    console.log(`\n⚡ LLM Response Time: ${analysis.responseTime}ms`);
    console.log(`\n🧠 AI ANALYSIS:`);
    console.log('━'.repeat(70));
    console.log(`\n📊 Decision: ${analysis.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
    console.log(`   Confidence: ${analysis.confidence}%`);
    console.log(`   Risk Score: ${analysis.riskScore}%`);

    console.log(`\n💭 AI Reasoning:`);
    console.log(`   ${analysis.reasoning}`);

    if (analysis.concerns.length > 0) {
      console.log(`\n⚠️  Concerns:`);
      analysis.concerns.forEach(c => console.log(`   - ${c}`));
    }

    if (analysis.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      analysis.recommendations.forEach(r => console.log(`   - ${r}`));
    }

    return { ...analysis, quote };
  }

  async executePayment(paymentRequest, analysis) {
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

    const response = await axios.post(
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
      throw new Error(response.data.error?.message || 'Payment failed');
    }
  }

  showTransactionHistory() {
    console.log('\n📜 MOCK LLM AI AGENT TRANSACTION HISTORY:');
    console.log('━'.repeat(70));
    if (this.transactionHistory.length === 0) {
      console.log('   No transactions yet');
    } else {
      this.transactionHistory.forEach((tx, i) => {
        console.log(`\n   ${i + 1}. ${tx.timestamp}`);
        console.log(`      TX Hash: ${tx.txHash}`);
        console.log(`      Transfer: ${tx.sent} → ${tx.received}`);
        console.log(`      LLM: ${tx.llmProvider} (${tx.llmConfidence}% confidence)`);
      });
    }
    console.log('\n');
  }
}

/**
 * Run mock LLM demo
 */
async function runMockLLMDemo() {
  console.clear();
  console.log('═'.repeat(70));
  console.log('🤖 MOCK LLM-POWERED AI PAYMENT AGENT DEMO');
  console.log('═'.repeat(70));
  console.log('\nThis demo simulates realistic LLM responses without requiring API keys.');
  console.log('It demonstrates exactly what the real LLM integration looks like.\n');

  console.log(`📋 Configuration:`);
  console.log(`   LLM Provider: MOCK (simulates GPT-4 responses)`);
  console.log(`   Model: mock-gpt-4`);
  console.log(`   AP2Stellar: ${CONFIG.apiUrl}`);
  console.log(`   Agent ID: ${CONFIG.agentId}`);
  console.log('\n💡 Note: Responses simulate realistic AI reasoning patterns\n');

  const agent = new MockLLMAIPaymentAgent(CONFIG);

  const scenarios = [
    {
      name: 'E-Commerce Payment',
      description: 'Mock LLM analyzes standard e-commerce transaction',
      request: {
        amount: '25.00',
        sourceCurrency: 'XLM',
        destinationCurrency: 'USDC',
        recipientAgentId: 'merchant-ecommerce-agent',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'Product purchase',
          order_id: 'ORD-2024-999',
          items: ['AI Training Course', 'API Access'],
          customer_verified: true,
        },
      },
    },
    {
      name: 'Micro-Payment',
      description: 'Mock LLM evaluates small API usage payment',
      request: {
        amount: '0.75',
        sourceCurrency: 'XLM',
        destinationCurrency: 'USDC',
        recipientAgentId: 'merchant-api-service',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'API usage payment',
          api_calls: 100,
          service: 'GPT-4 Vision API',
        },
      },
    },
    {
      name: 'Subscription Payment',
      description: 'Mock LLM assesses recurring subscription',
      request: {
        amount: '60.00',
        sourceCurrency: 'XLM',
        destinationCurrency: 'USDC',
        recipientAgentId: 'merchant-subscription-service',
        recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
        metadata: {
          purpose: 'Monthly subscription',
          service: 'Premium AI Agent Platform',
          subscription_type: 'premium',
          recurring: true,
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
    console.log(`   Purpose: ${scenario.request.metadata.purpose}`);

    try {
      const analysis = await agent.analyzePaymentWithLLM(scenario.request);

      console.log(`\n🎯 MOCK LLM DECISION: ${analysis.approved ? '✅ APPROVED' : '❌ REJECTED'}`);

      if (analysis.approved) {
        await agent.executePayment(scenario.request, analysis);

        if (i < scenarios.length - 1) {
          console.log(`\n⏳ Preparing next scenario...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } else {
        console.log('\n🚫 Payment rejected by mock LLM - transaction cancelled');
      }
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
    }
  }

  agent.showTransactionHistory();

  console.log('═'.repeat(70));
  console.log('✅ MOCK LLM DEMO COMPLETE');
  console.log('═'.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Total Mock LLM Decisions: ${scenarios.length}`);
  console.log(`   Transactions Executed: ${agent.transactionHistory.length}`);
  console.log(`   Mock Provider: Simulates GPT-4 reasoning patterns`);
  console.log(`\n💡 To use real LLM:`);
  console.log(`   1. Install Ollama: curl -fsSL https://ollama.com/install.sh | sh`);
  console.log(`   2. Pull model: ollama pull llama3.1`);
  console.log(`   3. Run: node llm-ai-agent.js`);
  console.log(`\n   Or use OpenAI/Claude:`);
  console.log(`   export LLM_PROVIDER=openai`);
  console.log(`   export LLM_API_KEY=sk-...`);
  console.log(`   node llm-ai-agent.js`);
  console.log('\n');
}

if (require.main === module) {
  runMockLLMDemo().catch(console.error);
}

module.exports = { MockLLMAIPaymentAgent, MockLLM };
