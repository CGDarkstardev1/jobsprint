/**
 * LLM Abstraction Layer
 * Multi-provider AI service supporting OpenAI, Claude, Ollama, Gemini, HuggingFace, Perplexity
 * Implements cost tracking, structured prompting, and performance optimization
 */

export interface LLMProvider {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  costPerToken: {
    input: number;
    output: number;
  };
}

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  structuredOutput?: boolean;
  jsonSchema?: any;
}

export interface LLMResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    provider: string;
    model: string;
    responseTime: number;
    timestamp: Date;
  };
}

export interface StructuredPrompt {
  systemPrompt: string;
  userPrompt: string;
  examples?: Array<{
    input: string;
    output: string;
  }>;
  constraints?: string[];
  outputFormat?: 'json' | 'markdown' | 'text';
}

export class LLMAbstractionLayer {
  private providers: Map<string, LLMProvider> = new Map();
  private costTracker = new CostTracker();
  private performanceMonitor = new PerformanceMonitor();

  constructor(private readonly httpService?: any) {
    this.initializeProviders();
  }

  /**
   * Initialize supported LLM providers
   */
  private initializeProviders() {
    // OpenAI
    this.providers.set('openai', {
      name: 'OpenAI',
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      costPerToken: {
        input: 0.0000025, // $2.50 per 1M tokens for GPT-4o
        output: 0.00001, // $10 per 1M tokens for GPT-4o
      },
    });

    // Anthropic Claude
    this.providers.set('claude', {
      name: 'Anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
      costPerToken: {
        input: 0.000003, // $3 per 1M tokens for Sonnet
        output: 0.000015, // $15 per 1M tokens for Sonnet
      },
    });

    // Ollama (local models)
    this.providers.set('ollama', {
      name: 'Ollama',
      baseUrl: 'http://localhost:11434/api',
      models: ['llama3.2:3b', 'llama3.1:8b', 'mistral:7b', 'codellama:13b'],
      costPerToken: {
        input: 0, // Free for local models
        output: 0,
      },
    });

    // Google Gemini
    this.providers.set('gemini', {
      name: 'Google Gemini',
      apiKey: process.env.GOOGLE_API_KEY,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      costPerToken: {
        input: 0.000000125, // $0.125 per 1M tokens
        output: 0.0000005, // $0.5 per 1M tokens
      },
    });

    // HuggingFace
    this.providers.set('huggingface', {
      name: 'HuggingFace',
      apiKey: process.env.HUGGINGFACE_API_KEY,
      baseUrl: 'https://api-inference.huggingface.co/models',
      models: ['microsoft/DialoGPT-large', 'facebook/blenderbot-400M-distill'],
      costPerToken: {
        input: 0, // Free tier available
        output: 0,
      },
    });

    // Perplexity
    this.providers.set('perplexity', {
      name: 'Perplexity',
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseUrl: 'https://api.perplexity.ai',
      models: ['sonar-pro', 'sonar'],
      costPerToken: {
        input: 0.000005, // $5 per 1M tokens
        output: 0.000028, // $28 per 1M tokens
      },
    });
  }

  /**
   * Generate response using specified provider and model
   */
  async generate(
    request: LLMRequest,
    providerName?: string,
    modelName?: string
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    // Auto-select provider if not specified
    const provider = providerName
      ? this.providers.get(providerName)
      : this.selectOptimalProvider(request);

    if (!provider) {
      throw new Error(`Provider ${providerName} not available`);
    }

    // Auto-select model if not specified
    const model = modelName || this.selectOptimalModel(provider, request);

    try {
      const response = await this.callProvider(provider, model, request);
      const responseTime = Date.now() - startTime;

      const llmResponse: LLMResponse = {
        content: response.content,
        usage: {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          totalTokens: response.usage.inputTokens + response.usage.outputTokens,
          cost: this.calculateCost(
            provider,
            response.usage.inputTokens,
            response.usage.outputTokens
          ),
        },
        metadata: {
          provider: provider.name,
          model,
          responseTime,
          timestamp: new Date(),
        },
      };

      // Track costs and performance
      await this.costTracker.trackUsage(llmResponse);
      await this.performanceMonitor.recordMetrics(llmResponse);

      return llmResponse;
    } catch (error) {
      console.error(`LLM generation failed for ${provider.name}/${model}:`, error);
      throw new Error(`Failed to generate response: ${(error as Error).message}`);
    }
  }

  /**
   * Generate with structured prompting
   */
  async generateStructured(prompt: StructuredPrompt, providerName?: string): Promise<LLMResponse> {
    const systemPrompt = this.buildStructuredSystemPrompt(prompt);
    const userPrompt = this.buildStructuredUserPrompt(prompt);

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      structuredOutput: prompt.outputFormat === 'json',
      jsonSchema: prompt.outputFormat === 'json' ? this.generateJsonSchema(prompt) : undefined,
    };

    return this.generate(request, providerName);
  }

  /**
   * Generate multiple responses in parallel
   */
  async generateParallel(requests: LLMRequest[], providerName?: string): Promise<LLMResponse[]> {
    const promises = requests.map((request) => this.generate(request, providerName));
    return Promise.all(promises);
  }

  /**
   * Get cost and usage statistics
   */
  async getUsageStats(timeframe: 'day' | 'week' | 'month' = 'month') {
    return this.costTracker.getStats(timeframe);
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  // Private helper methods

  private selectOptimalProvider(request: LLMRequest): LLMProvider {
    // Priority: Ollama (free) > OpenAI (fast) > Claude (quality) > Others
    const priority = ['ollama', 'openai', 'claude', 'gemini', 'perplexity', 'huggingface'];

    for (const providerName of priority) {
      const provider = this.providers.get(providerName);
      if (provider && this.isProviderAvailable(provider)) {
        return provider;
      }
    }

    throw new Error('No available LLM providers');
  }

  private selectOptimalModel(provider: LLMProvider, request: LLMRequest): string {
    // Select based on request complexity and cost
    const maxTokens = request.maxTokens || 1000;

    if (maxTokens > 4000) {
      // Use larger models for complex requests
      return (
        provider.models.find((m) => m.includes('large') || m.includes('pro')) || provider.models[0]
      );
    } else {
      // Use efficient models for simple requests
      return (
        provider.models.find((m) => m.includes('mini') || m.includes('flash')) || provider.models[0]
      );
    }
  }

  private async callProvider(
    provider: LLMProvider,
    model: string,
    request: LLMRequest
  ): Promise<any> {
    switch (provider.name.toLowerCase()) {
      case 'openai':
        return this.callOpenAI(provider, model, request);
      case 'claude':
        return this.callClaude(provider, model, request);
      case 'ollama':
        return this.callOllama(provider, model, request);
      case 'gemini':
        return this.callGemini(provider, model, request);
      case 'huggingface':
        return this.callHuggingFace(provider, model, request);
      case 'perplexity':
        return this.callPerplexity(provider, model, request);
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }

  private async callOpenAI(
    provider: LLMProvider,
    model: string,
    request: LLMRequest
  ): Promise<any> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
        response_format: request.structuredOutput ? { type: 'json_object' } : undefined,
      }),
    });

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }

  private async callClaude(
    provider: LLMProvider,
    model: string,
    request: LLMRequest
  ): Promise<any> {
    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: request.messages.filter((m) => m.role !== 'system'),
        system: request.messages.find((m) => m.role === 'system')?.content,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
      }),
    });

    const data = await response.json();

    return {
      content: data.content[0].text,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  }

  private async callOllama(
    provider: LLMProvider,
    model: string,
    request: LLMRequest
  ): Promise<any> {
    const response = await fetch(`${provider.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 1000,
        },
      }),
    });

    const data = await response.json();

    return {
      content: data.message.content,
      usage: {
        inputTokens: this.estimateTokens(JSON.stringify(request.messages)),
        outputTokens: this.estimateTokens(data.message.content),
      },
    };
  }

  private async callGemini(
    provider: LLMProvider,
    model: string,
    request: LLMRequest
  ): Promise<any> {
    const contents = request.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `${provider.baseUrl}/models/${model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.maxTokens || 1000,
          },
        }),
      }
    );

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

    return {
      content,
      usage: {
        inputTokens: this.estimateTokens(JSON.stringify(request.messages)),
        outputTokens: this.estimateTokens(content),
      },
    };
  }

  private async callHuggingFace(
    provider: LLMProvider,
    model: string,
    request: LLMRequest
  ): Promise<any> {
    const response = await fetch(`${provider.baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: request.messages.map((m) => m.content).join('\n'),
        parameters: {
          max_new_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
        },
      }),
    });

    const data = await response.json();

    return {
      content: data[0].generated_text,
      usage: {
        inputTokens: this.estimateTokens(JSON.stringify(request.messages)),
        outputTokens: this.estimateTokens(data[0].generated_text),
      },
    };
  }

  private async callPerplexity(
    provider: LLMProvider,
    model: string,
    request: LLMRequest
  ): Promise<any> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
      }),
    });

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens:
          data.usage?.prompt_tokens || this.estimateTokens(JSON.stringify(request.messages)),
        outputTokens:
          data.usage?.completion_tokens || this.estimateTokens(data.choices[0].message.content),
      },
    };
  }

  private calculateCost(provider: LLMProvider, inputTokens: number, outputTokens: number): number {
    return inputTokens * provider.costPerToken.input + outputTokens * provider.costPerToken.output;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  private isProviderAvailable(provider: LLMProvider): boolean {
    if (provider.name === 'Ollama') {
      return true; // Assume local Ollama is running
    }
    return !!provider.apiKey;
  }

  private buildStructuredSystemPrompt(prompt: StructuredPrompt): string {
    let systemPrompt = prompt.systemPrompt;

    if (prompt.constraints && prompt.constraints.length > 0) {
      systemPrompt += '\n\nConstraints:\n' + prompt.constraints.map((c) => `- ${c}`).join('\n');
    }

    if (prompt.examples && prompt.examples.length > 0) {
      systemPrompt +=
        '\n\nExamples:\n' +
        prompt.examples.map((ex) => `Input: ${ex.input}\nOutput: ${ex.output}`).join('\n\n');
    }

    if (prompt.outputFormat === 'json') {
      systemPrompt += '\n\nOutput must be valid JSON.';
    } else if (prompt.outputFormat === 'markdown') {
      systemPrompt += '\n\nOutput must be in Markdown format.';
    }

    return systemPrompt;
  }

  private buildStructuredUserPrompt(prompt: StructuredPrompt): string {
    return prompt.userPrompt;
  }

  private generateJsonSchema(prompt: StructuredPrompt): any {
    // Generate a basic JSON schema based on the prompt structure
    return {
      type: 'object',
      properties: {
        content: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['content'],
    };
  }
}

/**
 * Cost tracking service
 */
class CostTracker {
  private usage: Array<{
    timestamp: Date;
    provider: string;
    cost: number;
    tokens: number;
  }> = [];

  async trackUsage(response: LLMResponse) {
    this.usage.push({
      timestamp: response.metadata.timestamp,
      provider: response.metadata.provider,
      cost: response.usage.cost,
      tokens: response.usage.totalTokens,
    });

    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.usage = this.usage.filter((u) => u.timestamp > thirtyDaysAgo);
  }

  async getStats(timeframe: 'day' | 'week' | 'month') {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const relevant = this.usage.filter((u) => u.timestamp > startDate);

    return {
      totalCost: relevant.reduce((sum, u) => sum + u.cost, 0),
      totalTokens: relevant.reduce((sum, u) => sum + u.tokens, 0),
      requests: relevant.length,
      averageCostPerRequest:
        relevant.length > 0 ? relevant.reduce((sum, u) => sum + u.cost, 0) / relevant.length : 0,
      byProvider: this.groupByProvider(relevant),
    };
  }

  private groupByProvider(usage: any[]) {
    const grouped = usage.reduce((acc, u) => {
      if (!acc[u.provider]) {
        acc[u.provider] = { cost: 0, tokens: 0, requests: 0 };
      }
      acc[u.provider].cost += u.cost;
      acc[u.provider].tokens += u.tokens;
      acc[u.provider].requests += 1;
      return acc;
    }, {});

    return grouped;
  }
}

/**
 * Performance monitoring service
 */
class PerformanceMonitor {
  private metrics: Array<{
    timestamp: Date;
    provider: string;
    model: string;
    responseTime: number;
    tokensPerSecond: number;
  }> = [];

  async recordMetrics(response: LLMResponse) {
    const tokensPerSecond = response.usage.outputTokens / (response.metadata.responseTime / 1000);

    this.metrics.push({
      timestamp: response.metadata.timestamp,
      provider: response.metadata.provider,
      model: response.metadata.model,
      responseTime: response.metadata.responseTime,
      tokensPerSecond,
    });

    // Keep only last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    this.metrics = this.metrics.filter((m) => m.timestamp > sevenDaysAgo);
  }

  async getMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recent = this.metrics.filter((m) => m.timestamp > oneHourAgo);

    return {
      averageResponseTime:
        recent.length > 0 ? recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length : 0,
      averageTokensPerSecond:
        recent.length > 0
          ? recent.reduce((sum, m) => sum + m.tokensPerSecond, 0) / recent.length
          : 0,
      totalRequests: recent.length,
      byProvider: this.groupByProvider(recent),
    };
  }

  private groupByProvider(metrics: any[]) {
    const grouped = metrics.reduce((acc, m) => {
      if (!acc[m.provider]) {
        acc[m.provider] = {
          responseTime: [],
          tokensPerSecond: [],
          requests: 0,
        };
      }
      acc[m.provider].responseTime.push(m.responseTime);
      acc[m.provider].tokensPerSecond.push(m.tokensPerSecond);
      acc[m.provider].requests += 1;
      return acc;
    }, {});

    // Calculate averages
    Object.keys(grouped).forEach((provider) => {
      const data = grouped[provider];
      data.avgResponseTime =
        data.responseTime.reduce((a: number, b: number) => a + b, 0) / data.responseTime.length;
      data.avgTokensPerSecond =
        data.tokensPerSecond.reduce((a: number, b: number) => a + b, 0) /
        data.tokensPerSecond.length;
    });

    return grouped;
  }
}
