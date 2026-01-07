/**
 * AI Service Unit Tests
 *
 * Test AI service layer with model abstraction
 */

import AIService from '@/ai/service';
import { puterMock } from '@mocks/puter.mock';

describe('AIService', () => {
  let aiService;

  beforeEach(() => {
    aiService = new AIService(puterMock.ai);
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('should send chat message and receive response', async () => {
      const messages = [
        { role: 'user', content: 'Hello, AI!' }
      ];

      puterMock.ai.setMockResponse('chat', {
        role: 'assistant',
        content: 'Hello! How can I help you today?'
      });

      const response = await aiService.chat(messages);

      expect(response).toBeDefined();
      expect(response.message.role).toBe('assistant');
      expect(response.message.content).toBe('Hello! How can I help you today?');
      expect(response.usage).toBeDefined();
      expect(response.usage.total_tokens).toBeGreaterThan(0);
    });

    it('should handle multiple chat messages in conversation', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '2+2 equals 4.' },
        { role: 'user', content: 'What about 3+3?' }
      ];

      puterMock.ai.setMockResponse('chat', {
        role: 'assistant',
        content: '3+3 equals 6.'
      });

      const response = await aiService.chat(messages);

      expect(response.message.content).toBe('3+3 equals 6.');
    });

    it('should handle empty messages array', async () => {
      await expect(aiService.chat([])).rejects.toThrow('Messages array cannot be empty');
    });

    it('should handle AI service errors gracefully', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      puterMock.ai.chat = jest.fn().mockRejectedValue(new Error('AI service unavailable'));

      await expect(aiService.chat(messages)).rejects.toThrow('AI service unavailable');
    });

    it('should respect custom model options', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const options = {
        model: 'gpt-3.5-turbo-free',
        temperature: 0.7,
        maxTokens: 100
      };

      puterMock.ai.setMockResponse('chat', {
        role: 'assistant',
        content: 'Response'
      });

      await aiService.chat(messages, options);

      expect(puterMock.ai.chat).toHaveBeenCalledWith(
        expect.arrayContaining(messages),
        expect.objectContaining(options)
      );
    });
  });

  describe('complete', () => {
    it('should complete text prompt', async () => {
      const prompt = 'Once upon a time';

      puterMock.ai.setMockResponse('complete', ' in a land far away...');

      const response = await aiService.complete(prompt);

      expect(response.text).toBe(' in a land far away...');
      expect(response.usage).toBeDefined();
    });

    it('should handle empty prompt', async () => {
      await expect(aiService.complete('')).rejects.toThrow('Prompt cannot be empty');
    });

    it('should handle completion errors', async () => {
      puterMock.ai.complete = jest.fn().mockRejectedValue(new Error('Completion failed'));

      await expect(aiService.complete('test')).rejects.toThrow('Completion failed');
    });
  });

  describe('Model Management', () => {
    it('should switch between available models', () => {
      aiService.setModel('gpt-3.5-turbo-free');
      expect(aiService.currentModel).toBe('gpt-3.5-turbo-free');

      aiService.setModel('code-davinci-free');
      expect(aiService.currentModel).toBe('code-davinci-free');
    });

    it('should validate available models', () => {
      expect(aiService.isModelAvailable('gpt-3.5-turbo-free')).toBe(true);
      expect(aiService.isModelAvailable('invalid-model')).toBe(false);
    });

    it('should get list of available models', () => {
      const models = aiService.getAvailableModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain('gpt-3.5-turbo-free');
    });
  });

  describe('Token Management', () => {
    it('should estimate token count for text', () => {
      const text = 'Hello, world!';
      const tokens = aiService.estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    it('should track token usage', () => {
      aiService.trackUsage(100, 50);
      const usage = aiService.getTotalUsage();

      expect(usage.promptTokens).toBe(100);
      expect(usage.completionTokens).toBe(50);
      expect(usage.totalTokens).toBe(150);
    });

    it('should reset token usage', () => {
      aiService.trackUsage(100, 50);
      aiService.resetUsage();
      const usage = aiService.getTotalUsage();

      expect(usage.totalTokens).toBe(0);
    });
  });

  describe('Prompt Templates', () => {
    it('should use prompt templates', () => {
      const template = 'Summarize this: {{content}}';
      const variables = { content: 'Long text here' };

      const prompt = aiService.applyTemplate(template, variables);

      expect(prompt).toBe('Summarize this: Long text here');
    });

    it('should handle missing template variables', () => {
      const template = 'Hello {{name}}, welcome to {{place}}';
      const variables = { name: 'Chris' };

      const prompt = aiService.applyTemplate(template, variables);

      expect(prompt).toBe('Hello Chris, welcome to {{place}}');
    });

    it('should load predefined templates', () => {
      const template = aiService.getTemplate('summary');

      expect(template).toBeDefined();
      expect(typeof template).toBe('string');
    });
  });

  describe('Context Management', () => {
    it('should manage conversation context', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];

      aiService.setContext(messages);
      const context = aiService.getContext();

      expect(context).toEqual(messages);
    });

    it('should limit context window size', () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        role: 'user',
        content: `Message ${i}`
      }));

      aiService.setContext(messages, { maxTokens: 1000 });
      const context = aiService.getContext();

      expect(context.length).toBeLessThan(100);
    });

    it('should clear conversation context', () => {
      aiService.setContext([{ role: 'user', content: 'Test' }]);
      aiService.clearContext();
      const context = aiService.getContext();

      expect(context).toEqual([]);
    });
  });
});
