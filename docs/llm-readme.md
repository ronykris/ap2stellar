# LLM-Powered AI Payment Agent

This integration uses **real AI language models** to make autonomous payment decisions. The AI analyzes payment requests, assesses risks, and provides detailed reasoning for approval or rejection.

## Supported LLM Providers

### 1. **Ollama** (Local, Free) ⭐ **Recommended for Testing**
- ✅ Free and private
- ✅ Runs locally on your machine
- ✅ No API keys needed
- ✅ Multiple model options (Llama 3.1, Mistral, etc.)

### 2. **OpenAI** (GPT-4, GPT-3.5)
- Requires API key
- Best accuracy
- ~$0.03 per 1K tokens (GPT-4)

### 3. **Anthropic Claude** (Claude 3.5 Sonnet)
- Requires API key
- Excellent reasoning
- ~$0.003 per 1K tokens

---

## Quick Start with Ollama (Local LLM)

### Step 1: Install Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or download from: https://ollama.com/download
```

### Step 2: Pull a Model

```bash
# Download Llama 3.1 (4.7GB)
ollama pull llama3.1

# Or use a smaller model
ollama pull llama3.1:8b

# Or Mistral
ollama pull mistral
```

### Step 3: Start Ollama Server

```bash
ollama serve
```

### Step 4: Run the LLM AI Agent

```bash
# No configuration needed for Ollama - it's the default!
cd examples/llm-integration
npx tsx llm-ai-agent.ts
```

---

## Using OpenAI

### Setup

```bash
# Set environment variables
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-your-openai-api-key-here
export LLM_MODEL=gpt-4  # or gpt-3.5-turbo for lower cost

# Run the agent
npx tsx llm-ai-agent.ts
```

### Cost Estimate
- **GPT-4**: ~$0.05 per payment analysis
- **GPT-3.5 Turbo**: ~$0.002 per payment analysis

---

## Using Anthropic Claude

### Setup

```bash
# Set environment variables
export LLM_PROVIDER=anthropic
export LLM_API_KEY=sk-ant-your-anthropic-api-key-here
export LLM_MODEL=claude-3-5-sonnet-20241022

# Run the agent
npx tsx llm-ai-agent.ts
```

### Cost Estimate
- **Claude 3.5 Sonnet**: ~$0.01 per payment analysis

---

## How It Works

### 1. Payment Analysis Flow

```
Payment Request
    ↓
Get Real-time Quote from AP2Stellar
    ↓
Build Analysis Prompt with:
  - Payment amount and currencies
  - Market data and exchange rates
  - Recipient information
  - Metadata and purpose
    ↓
Send to LLM for Analysis
    ↓
LLM Evaluates:
  - Transaction amount risk
  - Exchange rate favorability
  - Network fees
  - Path efficiency
  - Recipient verification
  - Metadata validity
    ↓
LLM Returns Decision:
  {
    "decision": "APPROVED" or "REJECTED",
    "confidence": 0-100,
    "risk_score": 0-100,
    "reasoning": "Detailed explanation",
    "concerns": [...],
    "recommendations": [...]
  }
    ↓
Execute Payment (if approved)
    ↓
Record Transaction on Stellar Blockchain
```

### 2. What the LLM Analyzes

The AI receives complete payment context:

**Payment Request Data:**
- Amount and currencies
- Recipient information
- Payment purpose
- Metadata (order IDs, customer info, etc.)

**Market Data:**
- Real-time exchange rates
- Network fees
- DEX path efficiency
- Conversion costs

**Risk Factors:**
- High-value transaction flags
- Unfavorable exchange rates (>5% loss)
- Unusual network fees
- Unknown recipients
- Missing metadata

### 3. Example LLM Analysis

**Input to LLM:**
```
PAYMENT REQUEST:
- Amount: 50.00 XLM
- Destination Currency: USDC
- Recipient: merchant-subscription-service
- Purpose: Monthly subscription

MARKET DATA:
- Exchange Rate: 1 XLM = 3.3969 USDC
- Estimated Destination: 169.85 USDC
- Network Fee: 0.00001 XLM
- Path Length: 0 hops
```

**LLM Response:**
```json
{
  "decision": "APPROVED",
  "confidence": 95,
  "risk_score": 5,
  "reasoning": "This is a low-risk recurring subscription payment to a verified merchant. The exchange rate is favorable, network fees are minimal, and the payment uses a direct path with no DEX hops. The transaction amount is within normal subscription ranges.",
  "concerns": [
    "Recurring payment - ensure budget allows for monthly charges"
  ],
  "recommendations": [
    "Set up spending limits for recurring subscriptions",
    "Monitor exchange rate trends for future payments"
  ]
}
```

---

## Running the Demo

### Basic Usage

```bash
# Start AP2Stellar server (in one terminal)
cd /path/to/ap2stellar
npm run dev

# Run LLM AI agent (in another terminal)
cd examples/llm-integration
npx tsx llm-ai-agent.ts
```

### Example Output

```
═══════════════════════════════════════════════════════════════════
🤖 LLM-POWERED AI PAYMENT AGENT DEMO
═══════════════════════════════════════════════════════════════════

This demo uses REAL AI language models to make payment decisions
and execute actual blockchain transactions.

📋 Configuration:
   LLM Provider: OLLAMA
   Model: llama3.1
   AP2Stellar: http://localhost:3000
   Agent ID: llm-ai-agent


🔌 Testing OLLAMA connection...
✅ OLLAMA connection successful!
   Model: llama3.1

═══════════════════════════════════════════════════════════════════
📋 SCENARIO 1/3: E-Commerce Payment
═══════════════════════════════════════════════════════════════════
Description: LLM analyzes a standard e-commerce transaction

📦 Payment Request:
   Amount: 20.00 XLM
   Destination: USDC
   Recipient: merchant-ecommerce-agent
   Purpose: Product purchase

📊 Fetching real-time market data...

💹 Market Data:
   Exchange Rate: 1 XLM = 3.3969 USDC
   You'll receive: 67.9380 USDC
   Network Fee: 0.00001 XLM
   Path Length: 0 hops

🤖 Calling OLLAMA LLM (llama3.1)...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ LLM Response Time: 1247ms

🧠 AI ANALYSIS FROM OLLAMA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Decision: APPROVED
   Confidence: 92%
   Risk Score: 8%

💭 AI Reasoning:
   This e-commerce transaction is low-risk with verified merchant,
   favorable exchange rate, and minimal fees. Customer verification
   is confirmed in metadata.

⚠️  Concerns:
   - Cross-currency conversion introduces minor exchange rate risk

💡 Recommendations:
   - Monitor exchange rates for optimal conversion timing
   - Consider setting price alerts for large purchases

🎯 LLM DECISION: ✅ APPROVED

💸 EXECUTING PAYMENT...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PAYMENT SUCCESSFUL!

📝 Transaction Details:
   TX Hash: abc123...
   Ledger: 1478234
   Settlement Time: 4s
```

---

## Advanced Configuration

### Custom Model Selection

```bash
# OpenAI with specific model
export LLM_PROVIDER=openai
export LLM_MODEL=gpt-4-turbo-preview

# Ollama with different model
export LLM_PROVIDER=ollama
export LLM_MODEL=mistral

# Claude with specific version
export LLM_PROVIDER=anthropic
export LLM_MODEL=claude-3-opus-20240229
```

### Custom Endpoint

```bash
# Use custom OpenAI-compatible endpoint
export LLM_BASE_URL=https://your-custom-endpoint.com/v1

# Use Ollama on different host
export LLM_BASE_URL=http://your-server:11434/api
```

### Temperature Control

Edit `llm-ai-agent.ts`:
```javascript
const agent = new LLMAIPaymentAgent({
  ...CONFIG,
  temperature: 0.1, // Lower = more consistent, Higher = more creative
});
```

---

## API Integration

### Using LLM Analyzer in Your Code

```javascript
const { LLMPaymentAnalyzer } = require('./LLMPaymentAnalyzer');

// Initialize analyzer
const analyzer = new LLMPaymentAnalyzer({
  provider: 'ollama',
  model: 'llama3.1',
});

// Analyze payment
const analysis = await analyzer.analyzePayment(paymentRequest, quote);

if (analysis.approved) {
  console.log(`LLM approved with ${analysis.confidence}% confidence`);
  console.log(`Reasoning: ${analysis.reasoning}`);
  // Execute payment...
} else {
  console.log(`LLM rejected: ${analysis.reasoning}`);
}
```

---

## Troubleshooting

### Ollama Connection Failed

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Verify model is installed
ollama list
```

### OpenAI API Errors

```bash
# Verify API key
echo $LLM_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $LLM_API_KEY"
```

### Anthropic API Errors

```bash
# Verify API key format (should start with sk-ant-)
echo $LLM_API_KEY

# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $LLM_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

---

## Cost Optimization

### Use Ollama for Development
- Free and unlimited
- Privacy-preserving
- Fast local execution

### Use GPT-3.5 for Production
- Lower cost than GPT-4
- Good accuracy for payment decisions
- ~$0.002 per analysis

### Batch Processing
- Analyze multiple payments in parallel
- Cache LLM decisions for similar transactions
- Use lower temperatures for consistency

---

## Security Considerations

1. **API Key Protection**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

2. **Local LLM Privacy**
   - Ollama runs entirely offline
   - Payment data never leaves your machine
   - Ideal for sensitive transactions

3. **Decision Validation**
   - Always validate LLM output structure
   - Implement fallback logic for API failures
   - Log all decisions for audit trail

4. **Rate Limiting**
   - Implement rate limits on LLM calls
   - Handle API rate limit errors gracefully
   - Cache repeated analyses

---

## Comparison: Simulated vs Real LLM

| Feature | Simulated AI | Real LLM |
|---------|-------------|----------|
| Decision Quality | Rule-based | Context-aware reasoning |
| Reasoning | Simple checks | Detailed analysis |
| Adaptability | Fixed rules | Learns from patterns |
| Cost | Free | $0.002 - $0.05 per call |
| Privacy | Local | API or Local (Ollama) |
| Response Time | <10ms | 500ms - 3s |
| Flexibility | Limited | High |

---

## Next Steps

1. **Try the Demo**: `npx tsx llm-ai-agent.ts`
2. **Customize Prompts**: Edit `LLMPaymentAnalyzer.ts` system prompt
3. **Integrate with Your App**: Use `LLMPaymentAnalyzer` class
4. **Fine-tune Models**: Train on your payment history
5. **Add Monitoring**: Log LLM decisions for analysis

---

## Support

For issues or questions:
- See main [README.md](../../README.md)
- Check [API-DOCS.md](../../API-DOCS.md)
- Review [examples/README.md](../README.md)
