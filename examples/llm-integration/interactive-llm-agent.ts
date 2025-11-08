/**
 * Interactive LLM Payment Agent
 * Real-time conversational AI for payment decisions using Claude or ChatGPT
 */

import axios, { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';

// Type Definitions
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  model?: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ConversationContext {
  messages: Message[];
  pendingPayment?: PaymentRequest;
  lastQuote?: Quote;
}

interface PaymentRequest {
  amount: string;
  sourceCurrency: string;
  destinationCurrency: string;
  recipientAgentId: string;
  recipientAddress: string;
  purpose: string;
  metadata?: Record<string, unknown>;
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
}

interface PaymentConfirmation {
  status: string;
  transaction_details: {
    transaction_hash: string;
    ledger: number;
    settlement_time_seconds: number;
  };
  amount: {
    sent: string;
    received: string;
    currency_sent: string;
    currency_received: string;
  };
  fees: {
    network_fee: string;
  };
}

// Configuration
const CONFIG = {
  agentId: 'interactive-llm-agent',
  jwtSecret: process.env.AP2_JWT_SECRET || 'c5fedbfa23a88adfd97ade7b37c57fe323ecbd06b750da25e493ebeb05299d18',
  apiUrl: process.env.AP2_STELLAR_URL || 'http://localhost:3000',
  llmProvider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic' | 'ollama') || 'ollama',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL,
};

class InteractiveLLMAgent {
  private llmProvider: 'openai' | 'anthropic' | 'ollama';
  private llmApiKey: string;
  private llmModel: string;
  private agentId: string;
  private jwtSecret: string;
  private apiUrl: string;
  private context: ConversationContext;
  private rl: readline.Interface;

  constructor(config: typeof CONFIG) {
    this.llmProvider = config.llmProvider;
    this.llmApiKey = config.llmApiKey;
    this.llmModel = config.llmModel || this.getDefaultModel();
    this.agentId = config.agentId;
    this.jwtSecret = config.jwtSecret;
    this.apiUrl = config.apiUrl;

    this.context = {
      messages: [],
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.initializeSystemPrompt();
  }

  private getDefaultModel(): string {
    const models: Record<string, string> = {
      openai: 'gpt-4',
      anthropic: 'claude-3-5-sonnet-20241022',
      ollama: 'llama3.2:1b',  // Small 1B model - requires less memory
    };
    return models[this.llmProvider];
  }

  private initializeSystemPrompt(): void {
    const systemPrompt = `You are an AI payment agent assistant integrated with a Stellar blockchain payment system.

Your capabilities:
1. Analyze payment requests from users
2. Get real-time exchange rates from Stellar DEX
3. Execute cross-currency payments on Stellar blockchain
4. Provide payment recommendations and risk assessments

Available commands you can help with:
- "pay [amount] [currency] to [recipient]" - Execute a payment
- "quote [amount] [currency] to [currency]" - Get exchange rate
- "check payment [intent_id]" - Check payment status
- "help" - Show available commands

When a user requests a payment:
1. Extract: amount, source currency, destination currency, recipient
2. Ask for any missing information
3. Get a quote to show the exchange rate
4. Analyze the payment (fees, rate, risks)
5. Ask for confirmation before executing
6. Execute and show the blockchain transaction hash

Be conversational, helpful, and explain financial concepts clearly.
Always confirm before executing payments.
Use emojis to make interactions friendly: 💰 💸 ✅ ⚠️ 🔍

Current supported currencies: XLM (Stellar Lumens), USDC, EURC
Default recipient address: stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63`;

    this.context.messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  private async callLLM(userMessage: string): Promise<string> {
    this.context.messages.push({
      role: 'user',
      content: userMessage,
    });

    let response: string;

    if (this.llmProvider === 'openai') {
      response = await this.callOpenAI();
    } else if (this.llmProvider === 'anthropic') {
      response = await this.callAnthropic();
    } else {
      response = await this.callOllama();
    }

    this.context.messages.push({
      role: 'assistant',
      content: response,
    });

    return response;
  }

  private async callOpenAI(): Promise<string> {
    const response: AxiosResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.llmModel,
        messages: this.context.messages,
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.llmApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  private async callAnthropic(): Promise<string> {
    // Filter out system messages and ensure alternating user/assistant pattern
    const messages = this.context.messages
      .filter(m => m.role !== 'system')
      .filter((msg, idx, arr) => {
        // Remove consecutive messages with the same role
        if (idx === 0) return true;
        return msg.role !== arr[idx - 1].role;
      });

    // Ensure messages start with 'user' role
    if (messages.length > 0 && messages[0].role !== 'user') {
      messages.shift();
    }

    const systemMessage = this.context.messages.find(m => m.role === 'system')?.content || '';

    try {
      const response: AxiosResponse = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.llmModel,
          max_tokens: 1024,
          system: systemMessage,
          messages: messages,
        },
        {
          headers: {
            'x-api-key': this.llmApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.content[0].text;
    } catch (error: any) {
      if (error.response) {
        console.error('\n❌ Anthropic API Error:');
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`Anthropic API error: ${error.response.data.error?.message || error.message}`);
      }
      throw error;
    }
  }

  private async callOllama(): Promise<string> {
    try {
      // Use Ollama's chat API for proper conversation handling
      const response: AxiosResponse = await axios.post(
        'http://localhost:11434/api/chat',
        {
          model: this.llmModel,
          messages: this.context.messages,
          stream: false,
          options: {
            temperature: 0.7,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.message.content;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama not running. Please start Ollama with: ollama serve');
      }
      throw error;
    }
  }

  private async getQuote(sourceCurrency: string, destinationCurrency: string, amount: string): Promise<Quote> {
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
    throw new Error('Failed to get quote');
  }

  private generateAuthToken(): string {
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

  private async executePayment(payment: PaymentRequest): Promise<PaymentConfirmation> {
    const paymentIntent = {
      intent_id: uuidv4(),
      amount: payment.amount,
      currency: payment.sourceCurrency,
      recipient: {
        agent_id: payment.recipientAgentId,
        payment_address: payment.recipientAddress,
        destination_currency: payment.destinationCurrency,
      },
      sender: {
        agent_id: this.agentId,
        authorization_token: this.generateAuthToken(),
      },
      metadata: {
        purpose: payment.purpose,
        llm_assisted: true,
        llm_provider: this.llmProvider,
        ...payment.metadata,
      },
    };

    const response: AxiosResponse<PaymentConfirmation> = await axios.post(
      `${this.apiUrl}/api/v1/ap2/payment`,
      paymentIntent,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  }

  private async processUserInput(input: string): Promise<string> {
    // Check for special commands
    if (input.toLowerCase().includes('quote') || input.toLowerCase().includes('exchange rate')) {
      // Try to extract quote request
      const match = input.match(/(\d+\.?\d*)\s*(XLM|USDC|EURC).*?(XLM|USDC|EURC)/i);
      if (match) {
        const [, amount, fromCurrency, toCurrency] = match;
        try {
          const quote = await this.getQuote(fromCurrency.toUpperCase(), toCurrency.toUpperCase(), amount);
          this.context.lastQuote = quote;

          const quoteInfo = `
📊 Real-time Quote:
   ${quote.source_amount} ${quote.source_currency} → ${quote.estimated_destination_amount} ${quote.destination_currency}
   Exchange Rate: 1 ${quote.source_currency} = ${quote.exchange_rate} ${quote.destination_currency}
   Network Fee: ${quote.estimated_fee} XLM
   Path Length: ${quote.path_length} hops
`;

          // Add quote to context and ask LLM to analyze
          return await this.callLLM(`${input}\n\nHere's the real-time quote from Stellar:\n${quoteInfo}\n\nPlease analyze this quote and advise the user.`);
        } catch (error) {
          return await this.callLLM(`${input}\n\nNote: I tried to get a quote but encountered an error: ${(error as Error).message}`);
        }
      } else {
        // No specific currencies/amount mentioned, fetch sample quotes to show
        try {
          const sampleQuotes = await Promise.all([
            this.getQuote('XLM', 'USDC', '100'),
            this.getQuote('USDC', 'XLM', '100'),
          ]);

          const quotesInfo = `
📊 Current Stellar DEX Exchange Rates:

1. XLM → USDC:
   100 XLM = ${sampleQuotes[0].estimated_destination_amount} USDC
   Rate: 1 XLM = ${sampleQuotes[0].exchange_rate} USDC

2. USDC → XLM:
   100 USDC = ${sampleQuotes[1].estimated_destination_amount} XLM
   Rate: 1 USDC = ${sampleQuotes[1].exchange_rate} XLM

Network Fee: ${sampleQuotes[0].estimated_fee} XLM per transaction
`;

          return await this.callLLM(`${input}\n\nHere are the current exchange rates from Stellar DEX:\n${quotesInfo}\n\nPlease explain these rates to the user and ask if they want a specific quote.`);
        } catch (error) {
          return await this.callLLM(`${input}\n\nNote: I can get real-time exchange rates, but I need you to specify the currencies and amount. For example: "What's the rate for 100 XLM to USDC?"`);
        }
      }
    }

    // Check for payment requests
    if (input.toLowerCase().includes('pay') || input.toLowerCase().includes('send')) {
      const match = input.match(/(\d+\.?\d*)\s*(XLM|USDC|EURC)/i);
      if (match) {
        const [, amount, currency] = match;

        // Get quote first
        try {
          const destinationCurrency = input.toLowerCase().includes('usdc') && currency !== 'USDC' ? 'USDC' :
                                     input.toLowerCase().includes('xlm') && currency !== 'XLM' ? 'XLM' : currency;

          const quote = await this.getQuote(currency.toUpperCase(), destinationCurrency.toUpperCase(), amount);
          this.context.lastQuote = quote;

          const quoteInfo = `
📊 Payment Analysis:
   Amount: ${quote.source_amount} ${quote.source_currency}
   Will receive: ${quote.estimated_destination_amount} ${quote.destination_currency}
   Exchange Rate: 1 ${quote.source_currency} = ${quote.exchange_rate} ${quote.destination_currency}
   Network Fee: ${quote.estimated_fee} XLM (${((parseFloat(quote.estimated_fee) / parseFloat(amount)) * 100).toFixed(4)}%)
   Path Efficiency: ${quote.path_length === 0 ? 'Direct (optimal)' : `${quote.path_length} hops`}
`;

          return await this.callLLM(`${input}\n\nI've analyzed this payment:\n${quoteInfo}\n\nPlease review and ask the user if they want to proceed with this payment.`);
        } catch (error) {
          return await this.callLLM(`${input}\n\nNote: Error getting payment quote: ${(error as Error).message}`);
        }
      }
    }

    // Check for confirmation words
    if ((input.toLowerCase().includes('yes') || input.toLowerCase().includes('confirm') || input.toLowerCase().includes('proceed'))
        && this.context.lastQuote) {
      // Extract payment details from conversation history - use .content field
      const conversationText = this.context.messages.slice(-5).map(m => m.content).join(' ');
      const match = conversationText.match(/(\d+\.?\d*)\s*(XLM|USDC|EURC)/i);

      if (match) {
        const [, amount, currency] = match;
        try {
          console.log('\n💸 Executing payment on Stellar blockchain...\n');

          const payment: PaymentRequest = {
            amount: amount,
            sourceCurrency: this.context.lastQuote.source_currency,
            destinationCurrency: this.context.lastQuote.destination_currency,
            recipientAgentId: 'merchant-agent',
            recipientAddress: 'stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63',
            purpose: 'Interactive LLM payment',
          };

          const confirmation = await this.executePayment(payment);

          const txInfo = `
✅ PAYMENT SUCCESSFUL!

Blockchain Confirmation:
   TX Hash: ${confirmation.transaction_details?.transaction_hash || 'N/A'}
   Ledger: ${confirmation.transaction_details?.ledger || 'N/A'}
   Settlement Time: ${confirmation.transaction_details?.settlement_time_seconds || 'N/A'}s

Amount:
   Sent: ${confirmation.amount?.sent || 'N/A'} ${confirmation.amount?.currency_sent || 'N/A'}
   Received: ${confirmation.amount?.received || 'N/A'} ${confirmation.amount?.currency_received || 'N/A'}

Fee: ${confirmation.fees?.network_fee || 'N/A'} XLM

Verify on Stellar: https://stellar.expert/explorer/testnet/tx/${confirmation.transaction_details?.transaction_hash || 'N/A'}
`;

          // Print transaction details directly to console (not through LLM)
          console.log(txInfo);

          // Get LLM congratulatory message
          return await this.callLLM(`The payment was successfully executed! Transaction hash: ${confirmation.transaction_details?.transaction_hash || 'unknown'}. Please congratulate the user briefly and ask if they need anything else.`);
        } catch (error) {
          return await this.callLLM(`Payment execution failed: ${(error as Error).message}\n\nPlease inform the user about the error.`);
        }
      }
    }

    // Default: Just chat with LLM
    return await this.callLLM(input);
  }

  // Typing effect for responses
  private async typeText(text: string, speed: number = 20): Promise<void> {
    for (const char of text) {
      process.stdout.write(char);
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    console.log(); // New line at the end
  }

  async start(): Promise<void> {
    console.clear();
    console.log('═'.repeat(70));
    console.log('💬 INTERACTIVE LLM PAYMENT AGENT');
    console.log('═'.repeat(70));
    console.log(`\nPowered by: ${this.llmProvider.toUpperCase()} (${this.llmModel})`);
    console.log('Connected to: Stellar Testnet\n');
    console.log('This AI assistant can help you:');
    console.log('  • Get real-time exchange rates');
    console.log('  • Analyze payment risks and fees');
    console.log('  • Execute blockchain payments');
    console.log('  • Track transaction confirmations\n');
    console.log('Try saying:');
    console.log('  - "What\'s the exchange rate for 100 XLM to USDC?"');
    console.log('  - "I want to send 50 XLM to a merchant"');
    console.log('  - "Help me make a payment"\n');
    console.log('Type "exit" to quit\n');
    console.log('═'.repeat(70));

    // Initial greeting with typing effect
    process.stdout.write('\n🤖 Assistant: ');
    await this.typeText(`Hello! I'm your AI payment assistant powered by ${this.llmProvider.toUpperCase()}. 👋`, 15);
    console.log('\nI can help you with:');
    console.log('  • Getting real-time exchange rates from Stellar DEX');
    console.log('  • Analyzing payment costs and risks');
    console.log('  • Executing secure blockchain payments');
    console.log('  • Tracking your transaction confirmations\n');
    process.stdout.write('🤖 Assistant: ');
    await this.typeText('What would you like to do today?', 15);
    console.log();

    await this.chatLoop();
  }

  private async chatLoop(): Promise<void> {
    return new Promise((resolve) => {
      const promptUser = () => {
        this.rl.question('\n👤 You: ', async (input) => {
          if (input.toLowerCase() === 'exit') {
            console.log('\n👋 Goodbye!\n');
            this.rl.close();
            resolve();
            return;
          }

          if (!input.trim()) {
            promptUser();
            return;
          }

          try {
            const response = await this.processUserInput(input);
            process.stdout.write('\n🤖 Assistant: ');
            await this.typeText(response, 15); // 15ms per character for smooth typing
          } catch (error) {
            console.error(`\n❌ Error: ${(error as Error).message}`);
          }

          promptUser();
        });
      };

      promptUser();
    });
  }
}

// Main execution
async function main() {
  // API key not required for Ollama
  if (CONFIG.llmProvider !== 'ollama' && !CONFIG.llmApiKey) {
    console.error('❌ Error: LLM API key not configured\n');
    console.error('Please set your API key:');
    console.error('  For OpenAI: export LLM_PROVIDER=openai && export LLM_API_KEY=sk-...');
    console.error('  For Claude:  export LLM_PROVIDER=anthropic && export LLM_API_KEY=sk-ant-...\n');
    console.error('Or use Ollama (free, local):');
    console.error('  export LLM_PROVIDER=ollama');
    console.error('  ollama serve  # Start Ollama first\n');
    process.exit(1);
  }

  const agent = new InteractiveLLMAgent(CONFIG);
  await agent.start();
}

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1])) {
  main().catch(console.error);
}

export { InteractiveLLMAgent };
