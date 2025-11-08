# Interactive LLM Payment Agent - Demo Guide

## 🎯 What This Demo Does

This is a **real-time conversational AI payment assistant** that:
- Has natural conversations with you about payments
- Gets real-time exchange rates from Stellar DEX
- Analyzes payment risks and fees using AI
- Executes **actual blockchain transactions** on your command
- Provides transaction confirmations with blockchain proof

**This is a REAL AI assistant powered by Ollama (free), GPT-4, or Claude that can execute REAL payments!**

---

## 🚀 Quick Start

### Option 1: Using Ollama (FREE - Recommended) ⭐

**No API key needed! Completely free and runs locally.**

```bash
# 1. Install and start Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1
ollama serve  # Keep this running in one terminal

# 2. Start AP2Stellar server (in another terminal)
cd /home/roger/dev/code/ap2stellar
npm run dev

# 3. Run interactive agent (in a third terminal)
cd examples/llm-integration
./run-interactive-demo.sh
# Note: Ollama is the default provider, no environment variables needed!
```

### Option 2: Using Anthropic Claude (Paid)

**Best quality responses, requires API key and credits.**

```bash
# 1. Set your Anthropic API key
export LLM_PROVIDER=anthropic
export LLM_API_KEY=sk-ant-your-anthropic-api-key-here

# 2. Start AP2Stellar server (in one terminal)
npm run dev

# 3. Run interactive agent (in another terminal)
cd examples/llm-integration
./run-interactive-demo.sh
```

### Option 3: Using OpenAI GPT-4 (Paid)

**High quality, requires API key and credits.**

```bash
# 1. Set your OpenAI API key
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-your-openai-api-key-here

# 2. Start AP2Stellar server (in one terminal)
npm run dev

# 3. Run interactive agent (in another terminal)
cd examples/llm-integration
./run-interactive-demo.sh
```

---

## 💬 Example Conversation

```
═══════════════════════════════════════════════════════════════════
💬 INTERACTIVE LLM PAYMENT AGENT
═══════════════════════════════════════════════════════════════════

Powered by: OPENAI (gpt-4)
Connected to: Stellar Testnet

This AI assistant can help you:
  • Get real-time exchange rates
  • Analyze payment risks and fees
  • Execute blockchain payments
  • Track transaction confirmations

Try saying:
  - "What's the exchange rate for 100 XLM to USDC?"
  - "I want to send 50 XLM to a merchant"
  - "Help me make a payment"

Type "exit" to quit

═══════════════════════════════════════════════════════════════════

🤖 Assistant: Hello! 👋 I'm your AI payment assistant, and I'm here to help
you with cryptocurrency payments on the Stellar blockchain. I can assist you
with getting real-time exchange rates, analyzing payment costs and risks,
executing secure payments, and tracking your transactions.

What would you like to do today?

👤 You: What's the current exchange rate for XLM to USDC?

🤖 Assistant: Let me check the current exchange rate for you!

📊 Real-time Quote:
   100 XLM → 339.68 USDC
   Exchange Rate: 1 XLM = 3.3968 USDC
   Network Fee: 0.00001 XLM
   Path Length: 0 hops

The current rate is quite favorable! 💰 You're getting about 3.40 USDC for
each XLM. The network fee is minimal (less than $0.0001), and it's a direct
conversion with no intermediate hops, which is optimal for efficiency.

Would you like to make a payment with this rate?

👤 You: Yes, I want to send 50 XLM to a merchant

🤖 Assistant: Great! Let me analyze this payment for you:

📊 Payment Analysis:
   Amount: 50 XLM
   Will receive: 169.84 USDC
   Exchange Rate: 1 XLM = 3.3968 USDC
   Network Fee: 0.00001 XLM (0.0002%)
   Path Efficiency: Direct (optimal)

This looks like a solid payment! ✅ Here's my analysis:

• **Exchange Rate**: Excellent rate of ~3.40 USDC per XLM
• **Fees**: Extremely low (only 0.00001 XLM ≈ $0.00003)
• **Path**: Direct conversion (no routing through other currencies)
• **Total Cost**: You'll spend 50.00001 XLM to send 169.84 USDC

**Recommendation**: This is a low-risk payment with favorable terms. ⚡

Would you like me to proceed with this payment?

👤 You: Yes, please proceed

💸 Executing payment on Stellar blockchain...

✅ PAYMENT SUCCESSFUL!

Blockchain Confirmation:
   TX Hash: 8f3a2b9c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1
   Ledger: 1478234
   Settlement Time: 4s

Amount:
   Sent: 50.00 XLM
   Received: 169.84 USDC

Fee: 0.00001 XLM

Verify on Stellar: https://stellar.expert/explorer/testnet/tx/8f3a2b...

🤖 Assistant: Congratulations! 🎉 Your payment has been successfully
completed and confirmed on the Stellar blockchain!

Here's what happened:
• Sent 50 XLM from your account
• Converted to 169.84 USDC at the market rate
• Transaction confirmed in just 4 seconds
• Total fee was only 0.00001 XLM (less than a penny)

Your transaction is now permanently recorded on the blockchain. You can
verify it anytime using the transaction hash above. The recipient should
receive the USDC within seconds.

Is there anything else I can help you with today?

👤 You: exit

👋 Goodbye!
```

---

## 🎨 Conversation Examples

### 1. Getting Exchange Rates

**You:** "What's the rate for converting 100 USDC to XLM?"

**AI:** *Gets real-time quote from Stellar DEX and explains the rate, fees, and efficiency*

### 2. Making a Payment

**You:** "I need to pay 25 XLM to a merchant"

**AI:** *Analyzes the payment, gets a quote, explains risks/fees, asks for confirmation*

**You:** "Yes, go ahead"

**AI:** *Executes actual blockchain transaction, provides TX hash and confirmation*

### 3. Getting Help

**You:** "What can you help me with?"

**AI:** *Explains capabilities, available currencies, and how to make payments*

### 4. Complex Scenarios

**You:** "I want to send $100 worth of XLM but I'm worried about fees"

**AI:** *Calculates amount in XLM, analyzes fees, explains cost breakdown, recommends best approach*

---

## 🔥 Key Features

### Real-Time Intelligence
- **Live Exchange Rates**: Fetches current rates from Stellar DEX
- **Market Analysis**: AI analyzes rate favorability and trends
- **Fee Optimization**: Calculates and explains all costs

### AI-Powered Decisions
- **Risk Assessment**: Evaluates payment risks
- **Fee Analysis**: Explains network fees and their impact
- **Path Efficiency**: Checks for optimal currency conversion routes
- **Smart Recommendations**: Suggests best timing and amounts

### Blockchain Execution
- **Actual Transactions**: Executes real payments on Stellar
- **Instant Confirmations**: Typical settlement in 3-5 seconds
- **Blockchain Proof**: Provides transaction hash and explorer link
- **Audit Trail**: All transactions verifiable on-chain

### Conversational Interface
- **Natural Language**: Talk to the AI like a human
- **Context Aware**: Remembers conversation history
- **Helpful Guidance**: Explains concepts and provides recommendations
- **Interactive Flow**: Asks clarifying questions when needed

---

## 🎯 Use Cases

### Personal Finance
```
You: "I need to send money to my friend overseas"
AI: *Helps you choose currencies, calculate amounts, minimize fees*
```

### Merchant Payments
```
You: "Customer wants to pay 100 USDC but I need XLM"
AI: *Analyzes conversion, executes cross-currency payment*
```

### Trading
```
You: "What's the best rate to convert my XLM to USDC right now?"
AI: *Provides real-time analysis and executes if you approve*
```

### Learning
```
You: "How do cross-currency payments work?"
AI: *Explains Stellar DEX, path payments, and shows live example*
```

---

## 🛠️ Technical Details

### How It Works

```
User Input
    ↓
Natural Language Processing (GPT-4/Claude)
    ↓
Intent Recognition
    ↓
If payment/quote requested → Stellar API
    ↓
Real-time Data → LLM Analysis
    ↓
AI Explanation + Recommendation
    ↓
User Confirmation
    ↓
Blockchain Execution
    ↓
Transaction Confirmation
```

### Architecture

1. **LLM Layer**: GPT-4 or Claude processes natural language
2. **Payment Layer**: AP2Stellar API handles blockchain operations
3. **Context Management**: Tracks conversation state
4. **Real-time Data**: Fetches live quotes from Stellar
5. **Execution Layer**: Submits transactions to Stellar network

---

## 💡 Advanced Usage

### Custom Prompts

You can modify the system prompt in the code to customize AI behavior:

```typescript
const systemPrompt = `You are a [your custom role]...
Your capabilities:
- [custom capability 1]
- [custom capability 2]

[Your custom instructions...]`;
```

### Adding Features

The code is modular and easy to extend:

```typescript
// Add custom command detection
if (input.toLowerCase().includes('batch')) {
  // Handle batch payments
}

// Add transaction history
private transactionHistory: Transaction[] = [];

// Add spending limits
if (parseFloat(amount) > spendingLimit) {
  // Warn or reject
}
```

### Integration with Your App

```typescript
import { InteractiveLLMAgent } from './interactive-llm-agent';

const agent = new InteractiveLLMAgent(config);

// Programmatic usage
const response = await agent.processUserInput(
  "Send 100 XLM to merchant"
);
```

---


## 💰 Cost Estimation

### OpenAI GPT-4
- **Input**: ~$0.03 per 1K tokens
- **Output**: ~$0.06 per 1K tokens
- **Average conversation**: ~2K tokens
- **Cost per session**: ~$0.10 - $0.30

### Anthropic Claude 3.5
- **Input**: ~$0.003 per 1K tokens
- **Output**: ~$0.015 per 1K tokens
- **Average conversation**: ~2K tokens
- **Cost per session**: ~$0.02 - $0.10

### Stellar Network Fees
- **Per transaction**: 0.00001 XLM (~$0.00003)
- **Negligible compared to LLM costs**

---

## 🐛 Troubleshooting

### "API key not configured"
```bash
# Make sure you set the environment variable
export LLM_API_KEY=sk-your-key-here

# Verify it's set
echo $LLM_API_KEY
```

### "Connection refused"
```bash
# Make sure AP2Stellar server is running
npm run dev

# Check server is responding
curl http://localhost:3000/api/v1/health
```

### "Payment failed"
- Check that you have test XLM in your account
- Verify recipient address is valid
- Ensure currencies are supported (XLM, USDC, EURC)

### "LLM not responding"
- Verify API key is correct
- Check rate limits on your LLM provider
- Try switching to different model

---



**Ready to try it?**

```bash
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-your-key
npx tsx examples/llm-integration/interactive-llm-agent.ts
```

Start chatting with your AI payment assistant! 💬💰
