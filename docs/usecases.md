# AI Agent Integration Examples

This directory contains example implementations showing how AI agents can integrate with the AP2Stellar payment router.

## Examples

### 1. JavaScript/Node.js Integration (`simple-ai-agent.ts`)

A complete AI agent implementation that demonstrates:
- JWT token generation
- Getting exchange rate quotes
- Making payment decisions
- Executing cross-currency payments
- Tracking payment status

**Run the demo:**
```bash
npx tsx examples/simple-ai-agent.ts
```

### 2. Python Integration (`simple-ai-agent.py`)

Python implementation showing the same functionality:
- Clean, idiomatic Python code
- Full type hints
- Error handling
- AI decision-making logic

**Requirements:**
```bash
pip install requests pyjwt
```

**Run the demo:**
```bash
python examples/simple-ai-agent.py
```

### 3. **Live AI Agent Demo** (`live-ai-demo-auto.ts`) ⭐ **NEW**

**Advanced autonomous AI agent that makes REAL payment decisions with actual blockchain execution.**

This demo showcases:
- **AI Decision Engine**: Sophisticated risk assessment and autonomous approval logic
- **Real-time Market Analysis**: Fetches live exchange rates and analyzes financial metrics
- **Risk Scoring**: Evaluates fees, exchange rates, path efficiency, and transaction amounts
- **Autonomous Execution**: Makes decisions and executes real transactions without human intervention
- **Transaction Tracking**: Maintains complete audit trail of all AI-approved payments

**Features:**
- ✅ Analyzes real-time exchange rates from Stellar DEX
- ✅ Calculates risk scores based on multiple factors
- ✅ Makes autonomous approve/reject decisions
- ✅ Executes actual payments on Stellar testnet
- ✅ Provides detailed AI reasoning for each decision
- ✅ Tracks transaction history with blockchain confirmations

**Run the live demo:**
```bash
npx tsx examples/live-ai-demo-auto.ts
```

**Example Output:**
```
🤖 AI AGENT ANALYZING REQUEST...
📊 Fetching real-time exchange rates...
💹 Market Analysis:
   Source: 15 XLM
   Destination: 50.9540 USDC
   Exchange Rate: 1 XLM = 3.3969 USDC

🧠 AI DECISION REASONING:
   ✓ Network fee (0.00001 XLM) is within acceptable range
   ✓ Exchange rate is favorable
   ✓ Direct payment path (no DEX hops required)
   ✓ Recipient is verified merchant agent

🎯 AI DECISION:
   Risk Score: 0.0%
   Confidence: 100.0%
   Decision: ✅ APPROVED

💸 EXECUTING PAYMENT...
✅ PAYMENT SUCCESSFUL!
   TX Hash: 732dc25cc46b2440fbd91125b8a32257beb2166f08a804073ca7dfb80e4e70c2
```

### 4. Interactive AI Agent Demo (`live-ai-demo.ts`)

Interactive version where you can:
- Choose from pre-built scenarios or create custom payments
- See AI decision-making in real-time
- Approve or override AI decisions
- View complete transaction history

**Run interactively:**
```bash
npx tsx examples/live-ai-demo.ts
```

### 5. **🧠 LLM-Powered AI Agent** (`llm-integration/`) ⭐ **REAL AI INTEGRATION**

**Use actual AI language models (GPT-4, Claude, Llama) to make payment decisions!**

This is a complete integration with real LLM APIs that provides:
- **Real AI Reasoning**: Uses OpenAI, Anthropic Claude, or local Ollama models
- **Sophisticated Analysis**: AI analyzes payment context and provides detailed reasoning
- **Risk Assessment**: AI calculates confidence levels and risk scores
- **Concerns & Recommendations**: AI identifies potential issues and suggests improvements
- **Multiple Providers**: Support for OpenAI, Anthropic, and free local models

**Supported LLM Providers:**
- **OpenAI** (GPT-4, GPT-3.5 Turbo) - Best accuracy
- **Anthropic** (Claude 3.5 Sonnet) - Excellent reasoning
- **Ollama** (Llama 3.1, Mistral, etc.) - **FREE** and runs locally!

**Quick Start with Free Local LLM:**
```bash
# Install Ollama (free, runs locally)
curl -fsSL https://ollama.com/install.sh | sh

# Download a model
ollama pull llama3.1

# Start Ollama
ollama serve

# Run LLM AI agent (in another terminal)
cd examples/llm-integration
npx tsx llm-ai-agent.ts
```

**Or use OpenAI/Claude:**
```bash
export LLM_PROVIDER=openai  # or 'anthropic'
export LLM_API_KEY=sk-your-api-key-here
npx tsx llm-ai-agent.ts
```

**Example LLM Analysis:**
```
🤖 Calling OPENAI LLM (gpt-4)...
⚡ LLM Response Time: 1247ms

🧠 AI ANALYSIS FROM OPENAI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Decision: ✅ APPROVED
   Confidence: 95%
   Risk Score: 5%

💭 AI Reasoning:
   This e-commerce transaction is low-risk with verified merchant,
   favorable exchange rate, and minimal fees. Customer verification
   is confirmed in metadata. The cross-currency conversion from XLM
   to USDC at rate 3.3965 is within acceptable market ranges.

⚠️  Concerns:
   - Cross-currency conversion introduces minor exchange rate risk

💡 Recommendations:
   - Monitor exchange rate trends for optimal conversion timing
   - Consider setting price alerts for large purchases
   - Verified merchant agent - transaction is likely legitimate
```

**Demo without API keys (Mock LLM):**
```bash
# No configuration needed - simulates realistic LLM responses
cd examples/llm-integration
npx tsx mock-llm-demo.ts
```

**📚 Complete Documentation:**
See [llm-integration/README.md](llm-integration/README.md) for:
- Setup instructions for all providers
- Cost comparison
- API integration examples
- Security best practices
- Advanced configuration

**📊 Verified Results:**
See [LLM-INTEGRATION-GUIDE.md](../LLM-INTEGRATION-GUIDE.md) for verified blockchain transactions with real LLM analysis.

---

## AI Agent Capabilities

The example agents demonstrate how AI can:

1. **Autonomous Decision Making**
   - Evaluate payment requests
   - Analyze exchange rates
   - Assess fees and risks
   - Approve/reject transactions

2. **Payment Execution**
   - Generate secure JWT tokens
   - Submit payment intents
   - Handle responses
   - Track confirmations

3. **Financial Intelligence**
   - Query real-time exchange rates
   - Compare currency pairs
   - Optimize payment timing
   - Monitor transaction status

## Integration Patterns

### Pattern 1: Direct Payment
```javascript
const agent = new AIAgentPaymentService(config);
const result = await agent.sendPayment({
  amount: '100.00',
  currency: 'XLM',
  destinationCurrency: 'USDC',
  recipientAgentId: 'merchant-agent',
  recipientAddress: 'stellar:GXXXXX...',
});
```

### Pattern 2: Quote-First Approval
```javascript
// Get quote
const quote = await agent.getQuote('XLM', 'USDC', '100');

// AI evaluates
const evaluation = await agent.evaluatePayment(paymentRequest);

// Execute if approved
if (evaluation.approved) {
  const result = await agent.sendPayment(paymentRequest);
}
```

### Pattern 3: Async Callbacks
```javascript
const result = await agent.sendPayment({
  ...paymentDetails,
  callbackUrl: 'https://my-agent.com/payment-callback',
});
```

## Use Cases

### E-Commerce AI Agents
```javascript
// AI agent handling customer payments
const payment = await agent.sendPayment({
  amount: orderTotal,
  currency: customerCurrency,
  recipientAddress: merchantAddress,
  metadata: {
    orderId: order.id,
    items: order.items,
  },
});
```

### Trading Bots
```javascript
// AI trading bot converting currencies
const quote = await agent.getQuote('XLM', 'USDC', amount);

if (quote.exchange_rate > targetRate) {
  await agent.sendPayment(conversionRequest);
}
```

### Service Subscription Agents
```javascript
// AI agent managing recurring subscriptions
const payment = await agent.sendPayment({
  amount: '50.00',
  currency: 'USDC',
  recipientAddress: serviceProviderAddress,
  metadata: {
    subscriptionId: sub.id,
    period: 'monthly',
  },
});
```

## API Reference

### AIAgentPaymentService

#### `constructor(config)`
- `config.agentId`: Your AI agent's unique identifier
- `config.jwtSecret`: Secret for signing JWT tokens
- `config.ap2StellarUrl`: AP2Stellar API URL

#### `getQuote(sourceCurrency, destinationCurrency, amount)`
Returns exchange rate quote without executing payment.

**Returns:**
```javascript
{
  source_currency: 'XLM',
  destination_currency: 'USDC',
  source_amount: '100.00',
  estimated_destination_amount: '340.00',
  exchange_rate: '3.4000000',
  estimated_fee: '0.00001',
  path_length: 0
}
```

#### `sendPayment(paymentDetails)`
Executes a payment with full AP2 compliance.

**Parameters:**
```javascript
{
  amount: '100.00',
  currency: 'XLM',
  destinationCurrency: 'USDC',  // optional
  recipientAgentId: 'merchant-001',
  recipientAddress: 'stellar:GXXXXX...',
  metadata: {},  // optional
  callbackUrl: 'https://...',  // optional
}
```

**Returns:**
```javascript
{
  success: true,
  intentId: 'uuid',
  confirmation: {
    confirmation_id: 'uuid',
    status: 'completed',
    transaction_details: {
      network: 'stellar',
      transaction_hash: 'hash',
      ledger: 123456,
      settlement_time_seconds: 5,
    },
    amount: {
      sent: '100.00',
      received: '340.00',
      currency_sent: 'XLM',
      currency_received: 'USDC',
    },
    fees: {
      network_fee: '0.00001',
      conversion_fee: '0',
    },
  },
}
```

#### `checkPaymentStatus(intentId)`
Query the status of a previously submitted payment.

#### `evaluatePayment(paymentRequest)`
AI decision-making logic to approve/reject payments based on rates, fees, and risk assessment.

## Security Best Practices

1. **Secure JWT Secrets**: Never hardcode JWT secrets in production
2. **Environment Variables**: Use `.env` files for configuration
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting in your AI agent
5. **Error Handling**: Always handle payment failures gracefully
6. **Audit Logging**: Log all payment decisions and executions
7. **Callback Verification**: Verify callback signatures if using webhooks

## Advanced Features

### Multi-Agent Coordination
```javascript
// Agent A requests payment from Agent B
const agentA = new AIAgentPaymentService(configA);
const agentB = new AIAgentPaymentService(configB);

// Coordinated payment
await agentA.sendPayment({
  recipientAgentId: agentB.agentId,
  // ...
});
```

### Payment Streaming
```javascript
// AI agent making multiple micro-payments
for (const task of completedTasks) {
  await agent.sendPayment({
    amount: task.payment,
    metadata: { taskId: task.id },
  });
}
```

### Dynamic Currency Selection
```javascript
// AI choosing optimal currency based on rates
const quotes = await Promise.all([
  agent.getQuote('XLM', 'USDC', amount),
  agent.getQuote('XLM', 'EURC', amount),
]);

const best = quotes.reduce((a, b) =>
  parseFloat(a.estimated_destination_amount) > parseFloat(b.estimated_destination_amount) ? a : b
);

// Use best currency
await agent.sendPayment({
  destinationCurrency: best.destination_currency,
  // ...
});
```

## Testing

The examples can be run against the local development server:

```bash
# Terminal 1: Start AP2Stellar server
npm run dev

# Terminal 2: Run AI agent example
npx tsx examples/simple-ai-agent.ts
```

## Support

For questions or issues:
- See main [README.md](../README.md)
- Check [API-DOCS.md](../API-DOCS.md)
- Review [CLAUDE.md](../CLAUDE.md) for development guidance
