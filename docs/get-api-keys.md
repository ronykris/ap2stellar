# How to Get LLM API Keys

## 🆓 **RECOMMENDED: Ollama (100% Free, Local)**

**No API key needed! Best option for getting started.**

If you want to avoid API costs entirely and run the demo immediately:

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Download a model (one-time, ~4GB)
ollama pull llama3.1

# 3. Run Ollama server (in one terminal)
ollama serve

# 4. Run the demo (in another terminal)
cd examples/llm-integration
./run-interactive-demo.sh
```

**Pros:**
- ✅ **Completely free** - No API costs, no credit card needed
- ✅ **Runs locally** - Private, no data sent to third parties
- ✅ **No API limits** - Use as much as you want
- ✅ **No internet required** - Works offline after model download
- ✅ **Ready in minutes** - Default provider in the demo script

**Cons:**
- ❌ Requires 8GB+ RAM
- ❌ Slower than cloud APIs (but still fast enough)
- ❌ Lower quality than GPT-4/Claude (but good enough for demos)

**For most users, Ollama is the best choice to get started!**

---

## 🔑 OpenAI (GPT-4, ChatGPT)

**Use this if you need highest quality and already have credits.**

### Step 1: Sign Up

1. Go to: **https://platform.openai.com/signup**
2. Create an account using:
   - Email address
   - Google account
   - Microsoft account
3. Verify your email address

### Step 2: Add Billing

⚠️ **Important**: OpenAI requires a payment method even for small usage

1. Go to: **https://platform.openai.com/account/billing/overview**
2. Click "Add payment method"
3. Enter credit card details
4. Add initial credit (minimum $5 recommended)

### Step 3: Create API Key

1. Go to: **https://platform.openai.com/api-keys**
2. Click "Create new secret key"
3. Give it a name (e.g., "AP2Stellar Demo")
4. Copy the key immediately - **you won't see it again!**
5. It will look like: `sk-proj-abc123...` or `sk-abc123...`

### Step 4: Use the Key

```bash
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-your-key-here
export LLM_MODEL=gpt-4  # or gpt-3.5-turbo for lower cost
```

### Pricing (as of 2024)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Est. Cost per Demo |
|-------|----------------------|------------------------|-------------------|
| GPT-4 | $30 | $60 | $0.10 - $0.30 |
| GPT-4 Turbo | $10 | $30 | $0.05 - $0.15 |
| GPT-3.5 Turbo | $0.50 | $1.50 | $0.01 - $0.05 |

💡 **Recommendation**: Start with GPT-3.5 Turbo for testing (much cheaper)

### Free Credits

- OpenAI sometimes offers **$5 free credit** for new accounts
- Check: https://platform.openai.com/account/billing/overview
- Credit expires after 3 months

---

## 🔑 Anthropic (Claude)

### Step 1: Sign Up

1. Go to: **https://console.anthropic.com/**
2. Click "Sign Up"
3. Create an account using:
   - Email address
   - Google account
4. Verify your email

### Step 2: Add Billing

1. Go to: **https://console.anthropic.com/settings/billing**
2. Click "Add payment method"
3. Enter credit card details
4. Add initial credit (minimum $5 recommended)

### Step 3: Create API Key

1. Go to: **https://console.anthropic.com/settings/keys**
2. Click "Create Key"
3. Give it a name (e.g., "AP2Stellar Demo")
4. Copy the key immediately - **you won't see it again!**
5. It will look like: `sk-ant-api03-abc123...`

### Step 4: Use the Key

```bash
export LLM_PROVIDER=anthropic
export LLM_API_KEY=sk-ant-api03-your-key-here
export LLM_MODEL=claude-3-5-sonnet-20241022  # Latest model
```

### Pricing (as of 2024)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Est. Cost per Demo |
|-------|----------------------|------------------------|-------------------|
| Claude 3.5 Sonnet | $3 | $15 | $0.02 - $0.10 |
| Claude 3 Opus | $15 | $75 | $0.10 - $0.30 |
| Claude 3 Haiku | $0.25 | $1.25 | $0.01 - $0.03 |

💡 **Recommendation**: Claude 3.5 Sonnet offers best quality/price ratio

### Free Credits

- Anthropic sometimes offers **$5 free credit** for new accounts
- Check: https://console.anthropic.com/settings/billing
- Credit expires after 3 months

---

## 💰 Cost Comparison

### For This Demo

Based on typical usage (conversation with 3-5 payment requests):

| Provider | Model | Estimated Cost |
|----------|-------|---------------|
| **Ollama** | **Llama 3.1** | **$0.00** ⭐ **FREE - RECOMMENDED** |
| OpenAI | GPT-3.5 Turbo | $0.01 - $0.05 |
| Anthropic | Claude 3.5 Sonnet | $0.02 - $0.10 |
| OpenAI | GPT-4 Turbo | $0.05 - $0.15 |
| OpenAI | GPT-4 | $0.10 - $0.30 |

### Monthly Cost Estimates

If you run the demo **10 times per day**:

| Provider | Model | Daily | Monthly |
|----------|-------|-------|---------|
| **Ollama** | **Llama 3.1** | **$0.00** | **$0.00** ⭐ |
| GPT-3.5 Turbo | $0.25 | $7.50 |
| Claude 3.5 Sonnet | $0.50 | $15.00 |
| GPT-4 | $2.00 | $60.00 |

💡 **For learning/testing**: Ollama is completely free! Cloud options are available if you need higher quality.

### Option 2: Mock LLM (No Setup)

```bash
# No API key needed - simulates realistic AI responses
npx tsx examples/llm-integration/mock-llm-demo.ts
```

---

## 🚀 Quick Setup Commands

### For OpenAI:

```bash
# 1. Get key from: https://platform.openai.com/api-keys

# 2. Set environment variables
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-your-openai-key-here
export LLM_MODEL=gpt-3.5-turbo  # Recommended for testing

# 3. Run demo
cd examples/llm-integration
./run-interactive-demo.sh
```

### For Anthropic:

```bash
# 1. Get key from: https://console.anthropic.com/settings/keys

# 2. Set environment variables
export LLM_PROVIDER=anthropic
export LLM_API_KEY=sk-ant-api03-your-key-here
export LLM_MODEL=claude-3-5-sonnet-20241022

# 3. Run demo
cd examples/llm-integration
./run-interactive-demo.sh
```

---



## 🎓 Getting Started Checklist

1. **Choose Your Provider**
   - [ ] **Ollama (recommended - free, no API key)** ⭐
   - [ ] Anthropic (recommended for quality, requires API key)
   - [ ] OpenAI (requires API key)

2. **Setup (depends on provider)**

   **If using Ollama (free):**
   - [ ] Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
   - [ ] Pull model: `ollama pull llama3.1`
   - [ ] Start Ollama: `ollama serve` (in a separate terminal)
   - [ ] No API key needed!

   **If using OpenAI or Anthropic (paid):**
   - [ ] Create account on provider's website
   - [ ] Add payment method
   - [ ] Generate API key
   - [ ] Copy and save key securely

3. **Set Environment Variables**

   **For Ollama (default):**
   ```bash
   # No environment variables needed! Just run the demo.
   # Ollama is the default provider.
   ```

   **For OpenAI:**
   ```bash
   export LLM_PROVIDER=openai
   export LLM_API_KEY=sk-your-openai-key
   ```

   **For Anthropic:**
   ```bash
   export LLM_PROVIDER=anthropic
   export LLM_API_KEY=sk-ant-your-anthropic-key
   ```

4. **Test Connection**
   ```bash
   # Start AP2Stellar server (in one terminal)
   npm run dev

   # Run interactive demo (in another terminal)
   cd examples/llm-integration
   ./run-interactive-demo.sh
   ```

5. **Monitor Usage** (only for OpenAI/Anthropic)
   - [ ] Set spending limit (if using cloud provider)
   - [ ] Enable usage alerts
   - [ ] Check usage dashboard regularly
   - [ ] Ollama users: No monitoring needed - it's free!

---

## ❓ Troubleshooting

### "Invalid API Key"
- Check key is copied correctly (no extra spaces)
- Verify key hasn't been deleted
- Try creating a new key

### "Insufficient Credits"
- Add funds to your account
- Check billing dashboard
- Ensure payment method is valid

### "Rate Limit Exceeded"
- Wait a few minutes
- Upgrade to higher tier
- Use different model (GPT-3.5 instead of GPT-4)

### "API Key Not Configured"
```bash
# Check if environment variable is set
echo $LLM_API_KEY

# If empty, set it:
export LLM_API_KEY=sk-your-key
```

---

## 📚 Additional Resources

### OpenAI
- Documentation: https://platform.openai.com/docs
- Pricing: https://openai.com/pricing
- API Keys: https://platform.openai.com/api-keys
- Usage Dashboard: https://platform.openai.com/usage

### Anthropic
- Documentation: https://docs.anthropic.com
- Pricing: https://www.anthropic.com/pricing
- API Keys: https://console.anthropic.com/settings/keys
- Console: https://console.anthropic.com

### Ollama
- Website: https://ollama.com
- Models: https://ollama.com/library
- Documentation: https://github.com/ollama/ollama

---


**Ready to get started?**

Pick your provider and follow the steps above. The whole process takes about 5 minutes! 🚀
