# 🌐 AP2Stellar — Agent Payment Protocol Gateway on Stellar

> **A unified API for Agentic, AI, and Automated Payments on the Stellar Network**

AP2Stellar implements the **Agent Payment Protocol (AP2)** on top of **Stellar**, providing a secure, programmable backend for intelligent agents — human, software, or AI — to analyze, authorize, and execute blockchain payments.

It acts as a **gateway between intent-driven payment standards and blockchain settlement**, supporting multiple agent types (AI, IoT, enterprise bots, and financial automation systems).

---

## 🚀 Overview

AP2Stellar allows developers to:
- Parse and validate **AP2 mandates** (Intent, Cart, Payment)
- Retrieve **real-time Stellar quotes** and routes
- Execute **on-chain payments and conversions**
- Extend the logic through plugins or agent integrations (LLMs, rule engines, IoT controllers)

It is **payment-rail agnostic** at the protocol layer but uses **Stellar** as its default low-cost, high-speed settlement backend.

---

## 🧱 Core Architecture

```
Agent (AI / IoT / Workflow)
        │
        │   AP2 Mandates (Intent → Cart → Payment)
        ▼
+-----------------------------------------------+
|                AP2Stellar API                 |
|-----------------------------------------------|
|  • Mandate validation                         |
|  • Quote & path payment engine                |
|  • Risk / rule framework                      |
|  • Plugin integrations (LLMs, Oracles, etc.)  |
+-----------------------------------------------+
        │
        ▼
   Stellar Network (Testnet / Mainnet)
```

---

## 🧩 Key Capabilities

### 🔐 Protocol Compliance
Implements **Google’s Agent Payment Protocol (AP2)** structure:
- **Intent Mandate:** what the user/agent intends to do  
- **Cart Mandate:** itemized purchase or request  
- **Payment Mandate:** final signed approval  

### 💸 Settlement Engine
- Uses Stellar Horizon & DEX for routing, quoting, and conversion  
- Supports multiple assets: XLM, USDC, EURC, etc.  
- Executes transactions with instant on-chain confirmation  

### 🧠 Extensible Analysis Layer
- Pluggable architecture for decision logic:
  - **LLMs** (e.g., GPT-4, Claude, Ollama)  
  - **Rule engines / policy evaluators**  
  - **IoT device agents**  
  - **Enterprise workflow triggers (Kafka, Airflow, etc.)**

### 📊 Observability & Security
- Logs every mandate → decision → transaction  
- Configurable spending limits, rate limits, and replay protection  
- Webhook callbacks for settlement confirmations  

---

## 💡 Example Use Cases

| Category | Description | Example |
|-----------|--------------|----------|
| 🤖 **AI Payment Agent** | LLM analyzes payment requests and executes via AP2Stellar | See [`examples/llm-integration`](./examples/llm-integration) |
| 🏭 **IoT / M2M Payments** | Devices automatically pay for energy, bandwidth, or supplies | Smart meter paying supplier via AP2 mandate |
| 🧾 **Subscription Billing** | Agents manage recurring AP2 payment mandates with limits | Auto-renew SaaS payments in stablecoins |
| 🛒 **E-Commerce Checkout** | Merchants process AP2 payments with dynamic quotes | Customer agent sends Intent → Cart → Payment |
| 🌍 **Cross-Border Remittance** | FX conversion and instant Stellar settlement | USD→EURC with risk-checked path payment |
| 💼 **Enterprise Automation** | Back-office bots pay vendors using AP2 mandates and audit trails | ERP triggers payments through AP2Stellar API |

---

## ⚙️ Quick Start

```bash
# 1. Clone repo
git clone https://github.com/yourorg/ap2stellar
cd ap2stellar

# 2. Install dependencies
npm install

# 3. Start server
npm run dev
```

Visit `http://localhost:3000/api/v1/health` to verify it’s running.

---

## 🔧 Configuration

Set environment variables as needed:

```bash
# Stellar network
export STELLAR_NETWORK=testnet

# Optional LLM provider for AI-based analysis
export LLM_PROVIDER=ollama
export LLM_MODEL=llama3.1

# Optional API keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## 💬 Example: LLM-Powered Payment Analyzer (One of Many Plugins)

The **LLM integration** demonstrates how any intelligent agent can plug into AP2Stellar:

```bash
cd examples/llm-integration
./run-interactive-demo.sh
```

It enables natural-language conversations about payments:

```
🤖 Assistant: What's the rate for 100 XLM → USDC?
📊 Real-time Quote: 100 XLM = 339.6 USDC
💸 Execute? → Confirmed on-chain in 4s
```

 [![](https://markdown-videos-api.jorgenkh.no/youtube/Rvx3Ku0E9aM)](https://youtu.be/Rvx3Ku0E9aM)


You can replace the LLM layer with:
- Business-rule logic (`if amount < threshold`)  
- IoT triggers (`sensor.payment_due = true`)  
- External APIs (e.g., risk scoring, KYC providers)

---

## 🧭 Roadmap & Planned Enhancements

### Protocol & Payment Layer
- Multi-asset & cross-ledger settlements  
- Batch transactions and recurring mandates  
- Smart-routing engine with cost optimization  

### Intelligence Layer
- LLM fine-tuning on payment reasoning  
- Rule-based and hybrid decision modules  
- Policy engine for compliance (KYC/AML hooks)  

### Developer Experience
- `/simulate` endpoint for dry runs  
- SDKs: `@ap2stellar/core` (JS/TS), `ap2stellar-py` (Python)  
- CLI: `npx ap2stellar simulate-payment`  
- OpenAPI / Swagger UI  
- Plug-and-play React `<PaymentAgent />` widget  

### Observability
- Real-time dashboard for mandates & settlements  
- Prometheus metrics, Grafana panels  
- Webhook and Kafka event streaming  

---

## 📦 Packaging & Distribution

| Channel | Description |
|----------|--------------|
| **NPM** | `@ap2stellar/core`, `@ap2stellar/agent`, `@ap2stellar/react` |
| **Docker** | `docker pull yourorg/ap2stellar:latest` |
| **Cloud Templates** | GCP Cloud Run / AWS Lambda / Helm chart for K8s |
| **API Marketplace** | RapidAPI or Google Marketplace listing for external developers |

---

## 🔗 Integration Opportunities

### Agent Ecosystems
- Google AP2 Agents (native)
- LangChain / CrewAI / AutoGen “Payment Tool”
- Workflow engines (Airflow, Temporal, Kafka consumers)

### Wallets & Identity
- Freighter, Lobstr, Albedo wallet integration  
- WebAuthn / Passkey for mandate approvals  
- zkEmail and social login options  

### Financial & Data Systems
- ERP export (Xero, QuickBooks)
- Accounting ledger sync
- Analytics pipeline via Kafka or Pub/Sub

### Messaging & Interfaces
- Slack / Telegram / Discord bots for payments  
- Browser extension or in-checkout widget (“Pay with Agent”)  

---

## 📊 Cost Snapshot

| Component | Approx. Cost |
|------------|--------------|
| Stellar TX | 0.00001 XLM (<$0.00003) |
| Ollama (local) | Free |
| OpenAI GPT-4 | ~$0.05 per analysis |
| Claude 3.5 | ~$0.01 per analysis |

---

## 🧱 Repository Layout

```
ap2stellar/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration files
│   ├── schemas/         # AJV JSON schemas
│   ├── services/        # Business logic (AP2, Stellar, PathFinder, CurrencyMapper)
│   ├── routes/          # Express route handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── utils/           # Logger, errors, helpers
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── scripts/             # Utility scripts
├── __tests__/           # Unit and integration tests
└── logs/                # Application logs (gitignored)

```
---

## 🧰 Developer Snippet

```javascript
import { AP2StellarClient } from '@ap2stellar/core';

const client = new AP2StellarClient();

const intent = {
  type: 'payment',
  amount: '50',
  asset: 'XLM',
  recipient: 'merchant123',
};

const quote = await client.getQuote(intent);
const decision = await client.analyze(intent, quote);

if (decision.approved) await client.execute(intent, quote);
```

---

## API Endpoints

### Health Check

```bash
GET /health
```

Returns service health status for monitoring.

### Submit Payment

```bash
POST /api/v1/ap2/payment
Content-Type: application/json

{
  "intent_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": "100.00",
  "currency": "USD",
  "recipient": {
    "agent_id": "recipient-agent-id",
    "payment_address": "stellar:GXXXXXXXXXXXXXXXXXXXXX",
    "destination_currency": "EUR"
  },
  "sender": {
    "agent_id": "sender-agent-id",
    "authorization_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "callback_url": "https://your-service.com/callback",
  "metadata": {
    "purpose": "Payment for services"
  }
}
```

### Query Payment Status

```bash
GET /api/v1/ap2/payment/:intent_id
```

### Get Exchange Rate Quote

```bash
GET /api/v1/quote?source_currency=USD&destination_currency=EUR&source_amount=100
```

See [API-DOCS](./docs/api-docs.md) for complete API documentation.

---

## 🧩 License
MIT © 2025 — AP2Stellar Contributors


---

**AP2Stellar — powering the next generation of agent-driven payments.** ⚡
