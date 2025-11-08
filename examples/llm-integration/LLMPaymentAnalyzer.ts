/**
 * LLM Payment Analyzer (TypeScript)
 * Uses real AI language models to analyze payment requests and make decisions
 */

import axios, { AxiosResponse } from 'axios';

// Type Definitions
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  model?: string;
  baseURL?: string;
  temperature?: number;
}

interface PaymentRequest {
  amount: string;
  sourceCurrency: string;
  destinationCurrency: string;
  recipientAgentId: string;
  recipientAddress: string;
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

interface LLMAnalysis {
  decision: 'APPROVED' | 'REJECTED';
  confidence: number;
  risk_score: number;
  reasoning: string;
  concerns: string[];
  recommendations: string[];
}

interface Analysis {
  approved: boolean;
  confidence: number;
  riskScore: number;
  reasoning: string;
  concerns: string[];
  recommendations: string[];
  provider: string;
  model: string;
  responseTime: number;
  error?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
}

interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
}

/**
 * LLM Provider Integration
 * Supports OpenAI, Anthropic Claude, and local models (Ollama)
 */
class LLMPaymentAnalyzer {
  private provider: 'openai' | 'anthropic' | 'ollama';
  private apiKey?: string;
  private model: string;
  private baseURL: string;
  private temperature: number;

  constructor(config: LLMConfig) {
    this.provider = config.provider || 'openai';
    this.apiKey = config.apiKey;
    this.model = config.model || this.getDefaultModel();
    this.baseURL = config.baseURL || this.getDefaultBaseURL();
    this.temperature = config.temperature || 0.3; // Lower for more consistent decisions
  }

  private getDefaultModel(): string {
    const models: Record<string, string> = {
      openai: 'gpt-4',
      anthropic: 'claude-3-5-sonnet-20241022',
      ollama: 'llama3.1',
    };
    return models[this.provider];
  }

  private getDefaultBaseURL(): string {
    const urls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      ollama: 'http://localhost:11434/api',
    };
    return urls[this.provider];
  }

  /**
   * Create the system prompt for payment analysis
   */
  private getSystemPrompt(): string {
    return `You are an expert AI payment analyst specialized in blockchain transactions and risk assessment.

Your role is to analyze payment requests and make autonomous decisions about whether to approve or reject them.

You must evaluate:
1. Transaction amounts (flag if > $1000 USD equivalent)
2. Exchange rates (reject if unfavorable > 5% loss)
3. Network fees (flag if unusually high)
4. Payment path efficiency (prefer direct paths)
5. Recipient verification (check for known merchants)
6. Metadata validity (ensure proper documentation)

You MUST respond with a JSON object in this exact format:
{
  "decision": "APPROVED" or "REJECTED",
  "confidence": 0-100,
  "risk_score": 0-100,
  "reasoning": "Detailed explanation of your decision",
  "concerns": ["list", "of", "concerns"],
  "recommendations": ["list", "of", "recommendations"]
}

Be conservative with high-value transactions and strict about security.`;
  }

  /**
   * Build the analysis prompt with payment details
   */
  private buildAnalysisPrompt(paymentRequest: PaymentRequest, quote: Quote): string {
    return `Analyze this payment request and make a decision:

PAYMENT REQUEST:
- Amount: ${paymentRequest.amount} ${paymentRequest.sourceCurrency}
- Destination Currency: ${paymentRequest.destinationCurrency}
- Recipient: ${paymentRequest.recipientAgentId}
- Purpose: ${paymentRequest.metadata?.purpose || 'Not specified'}
- Metadata: ${JSON.stringify(paymentRequest.metadata, null, 2)}

MARKET DATA:
- Source Amount: ${quote.source_amount} ${quote.source_currency}
- Estimated Destination: ${quote.estimated_destination_amount} ${quote.destination_currency}
- Exchange Rate: 1 ${quote.source_currency} = ${quote.exchange_rate} ${quote.destination_currency}
- Network Fee: ${quote.estimated_fee} XLM
- Path Length: ${quote.path_length} hops through DEX

CALCULATIONS:
- Effective Rate: ${(parseFloat(quote.estimated_destination_amount) / parseFloat(quote.source_amount)).toFixed(4)}
- Fee Percentage: ${((parseFloat(quote.estimated_fee) / parseFloat(quote.source_amount)) * 100).toFixed(4)}%
- Cross-currency: ${quote.source_currency !== quote.destination_currency}

Analyze this payment and provide your decision in JSON format.`;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<LLMAnalysis> {
    const response: AxiosResponse<OpenAIResponse> = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  }

  /**
   * Call Anthropic Claude API
   */
  private async callAnthropic(prompt: string): Promise<LLMAnalysis> {
    const response: AxiosResponse<AnthropicResponse> = await axios.post(
      `${this.baseURL}/messages`,
      {
        model: this.model,
        max_tokens: 1024,
        temperature: this.temperature,
        system: this.getSystemPrompt(),
        messages: [
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          'x-api-key': this.apiKey!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.content[0].text;

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }

    return JSON.parse(content);
  }

  /**
   * Call Ollama (local LLM)
   */
  private async callOllama(prompt: string): Promise<LLMAnalysis> {
    const response: AxiosResponse = await axios.post(
      `${this.baseURL}/chat`,
      {
        model: this.model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt },
        ],
        stream: false,
        format: 'json',
        options: {
          temperature: this.temperature,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return JSON.parse(response.data.message.content);
  }

  /**
   * Main analysis method - routes to appropriate LLM provider
   */
  async analyzePayment(paymentRequest: PaymentRequest, quote: Quote): Promise<Analysis> {
    console.log(`\n🤖 Calling ${this.provider.toUpperCase()} LLM (${this.model})...`);
    console.log('━'.repeat(70));

    const prompt = this.buildAnalysisPrompt(paymentRequest, quote);

    try {
      let analysis: LLMAnalysis;
      const startTime = Date.now();

      switch (this.provider) {
        case 'openai':
          analysis = await this.callOpenAI(prompt);
          break;
        case 'anthropic':
          analysis = await this.callAnthropic(prompt);
          break;
        case 'ollama':
          analysis = await this.callOllama(prompt);
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${this.provider}`);
      }

      const responseTime = Date.now() - startTime;

      console.log(`\n⚡ LLM Response Time: ${responseTime}ms`);
      console.log(`\n🧠 AI ANALYSIS FROM ${this.provider.toUpperCase()}:`);
      console.log('━'.repeat(70));
      console.log(`\n📊 Decision: ${analysis.decision}`);
      console.log(`   Confidence: ${analysis.confidence}%`);
      console.log(`   Risk Score: ${analysis.risk_score}%`);

      console.log(`\n💭 AI Reasoning:`);
      console.log(`   ${analysis.reasoning}`);

      if (analysis.concerns && analysis.concerns.length > 0) {
        console.log(`\n⚠️  Concerns:`);
        analysis.concerns.forEach(c => console.log(`   - ${c}`));
      }

      if (analysis.recommendations && analysis.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`);
        analysis.recommendations.forEach(r => console.log(`   - ${r}`));
      }

      return {
        approved: analysis.decision === 'APPROVED',
        confidence: analysis.confidence,
        riskScore: analysis.risk_score,
        reasoning: analysis.reasoning,
        concerns: analysis.concerns || [],
        recommendations: analysis.recommendations || [],
        provider: this.provider,
        model: this.model,
        responseTime,
      };

    } catch (error: any) {
      console.error(`\n❌ LLM Error: ${error.message}`);

      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
      }

      // Fallback to conservative decision
      return {
        approved: false,
        confidence: 0,
        riskScore: 100,
        reasoning: `LLM analysis failed: ${error.message}. Defaulting to rejection for safety.`,
        concerns: ['LLM service unavailable', 'Unable to perform AI analysis'],
        recommendations: ['Retry with different LLM provider', 'Use manual review'],
        provider: this.provider,
        model: this.model,
        responseTime: 0,
        error: error.message,
      };
    }
  }

  /**
   * Test LLM connection
   */
  async testConnection(): Promise<boolean> {
    console.log(`\n🔌 Testing ${this.provider.toUpperCase()} connection...`);

    const testPrompt = 'Respond with a JSON object: {"status": "connected", "model": "your-model-name"}';

    try {
      switch (this.provider) {
        case 'openai':
          await this.callOpenAI(testPrompt);
          break;
        case 'anthropic':
          await this.callAnthropic(testPrompt);
          break;
        case 'ollama':
          await this.callOllama(testPrompt);
          break;
      }

      console.log(`✅ ${this.provider.toUpperCase()} connection successful!`);
      console.log(`   Model: ${this.model}`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.provider.toUpperCase()} connection failed: ${(error as Error).message}`);
      return false;
    }
  }
}

export { LLMPaymentAnalyzer, LLMConfig, PaymentRequest, Quote, Analysis };
