/**
 * Unit tests for AI Service
 */

import { AIService, AIServiceError } from '../../src/frontend/js/ai/ai-service.js';
import { PuterIntegration } from '../../src/frontend/js/core/puter.js';

// Mock Puter.js
global.puter = {
    ai: {
        chat: jest.fn(),
        complete: jest.fn()
    }
};

describe('AIService', () => {
    let aiService;
    let mockPuter;

    beforeEach(() => {
        mockPuter = {
            writeFile: jest.fn(),
            readJSONFile: jest.fn(),
            listDirectory: jest.fn(),
            delete: jest.fn()
        };

        aiService = new AIService({
            puter: mockPuter,
            defaultModel: 'gpt-3.5-turbo',
            debugMode: true
        });

        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should create instance with config', () => {
            expect(aiService.config.defaultModel).toBe('gpt-3.5-turbo');
            expect(aiService.config.maxTokens).toBe(2000);
            expect(aiService.config.temperature).toBe(0.7);
        });

        test('should throw error without Puter instance', () => {
            expect(() => {
                new AIService({});
            }).toThrow('MISSING_CONFIG');
        });

        test('should list available models', () => {
            const models = aiService.listModels();
            
            expect(models).toHaveLength(3);
            expect(models[0].id).toBe('gpt-3.5-turbo');
        });

        test('should get model info', () => {
            const info = aiService.getModelInfo('gpt-3.5-turbo');
            
            expect(info.name).toBe('GPT-3.5 Turbo');
            expect(info.contextWindow).toBe(4096);
        });
    });

    describe('Chat Operations', () => {
        test('should send chat message', async () => {
            const mockResponse = {
                message: { content: 'Hello!' },
                model: 'gpt-3.5-turbo',
                usage: { total_tokens: 10 }
            };
            global.puter.ai.chat.mockResolvedValue(mockResponse);

            const result = await aiService.chat('Hello');
            
            expect(result.content).toBe('Hello!');
            expect(global.puter.ai.chat).toHaveBeenCalledWith({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 2000,
                temperature: 0.7,
                stream: false
            });
        });

        test('should handle chat error', async () => {
            global.puter.ai.chat.mockRejectedValue(new Error('API Error'));
            
            await expect(aiService.chat('test')).rejects.toThrow('CHAT_FAILED');
        });
    });

    describe('Completion Operations', () => {
        test('should generate text completion', async () => {
            const mockResponse = {
                choices: [{ text: 'Completed text', finish_reason: 'stop' }],
                model: 'text-davinci-003',
                usage: { total_tokens: 15 }
            };
            global.puter.ai.complete.mockResolvedValue(mockResponse);

            const result = await aiService.complete('Complete this');
            
            expect(result.content).toBe('Completed text');
            expect(global.puter.ai.complete).toHaveBeenCalled();
        });

        test('should generate code', async () => {
            const mockResponse = {
                choices: [{ text: 'function test() {}', finish_reason: 'stop' }],
                model: 'code-davinci-002',
                usage: { total_tokens: 20 }
            };
            global.puter.ai.complete.mockResolvedValue(mockResponse);

            const result = await aiService.generateCode('Write a test function');
            
            expect(result.content).toBe('function test() {}');
        });
    });

    describe('Conversation Management', () => {
        test('should create conversation', () => {
            const conv = aiService.getConversation('conv-1');
            
            expect(conv.id).toBe('conv-1');
            expect(conv.messages).toEqual([]);
        });

        test('should reuse existing conversation', () => {
            const conv1 = aiService.getConversation('conv-1');
            const conv2 = aiService.getConversation('conv-1');
            
            expect(conv1).toBe(conv2);
        });

        test('should chat in conversation context', async () => {
            const mockResponse = {
                message: { content: 'Response' },
                model: 'gpt-3.5-turbo',
                usage: { total_tokens: 10 }
            };
            global.puter.ai.chat.mockResolvedValue(mockResponse);

            const result = await aiService.chatInConversation('conv-1', 'Hello');
            
            expect(result.content).toBe('Response');
            
            const conv = aiService.getConversation('conv-1');
            expect(conv.messages).toHaveLength(2); // user + assistant
        });

        test('should clear conversation', () => {
            aiService.getConversation('conv-1');
            const result = aiService.clearConversation('conv-1');
            
            expect(result).toBe(true);
            expect(aiService.getConversation('conv-1').messages).toEqual([]);
        });

        test('should delete conversation', () => {
            aiService.getConversation('conv-1');
            const result = aiService.deleteConversation('conv-1');
            
            expect(result).toBe(true);
            expect(aiService.conversations.has('conv-1')).toBe(false);
        });
    });

    describe('Prompt Templates', () => {
        test('should create prompt template', () => {
            const template = aiService.createPromptTemplate(
                'greeting',
                'Hello, {{name}}!',
                { description: 'Greeting template' }
            );
            
            expect(template.name).toBe('greeting');
            expect(template.variables).toContain('name');
        });

        test('should render template with variables', () => {
            aiService.createPromptTemplate('greeting', 'Hello, {{name}}!');
            const rendered = aiService.renderTemplate('greeting', { name: 'World' });
            
            expect(rendered).toBe('Hello, World!');
        });

        test('should throw error for missing template', () => {
            expect(() => {
                aiService.renderTemplate('nonexistent', {});
            }).toThrow('TEMPLATE_NOT_FOUND');
        });

        test('should extract variables from template', () => {
            const vars = aiService._extractVariables('Hello {{name}}, your {{item}} is ready.');
            
            expect(vars).toEqual(['name', 'item']);
        });
    });

    describe('Token Management', () => {
        test('should estimate tokens', () => {
            const estimate = aiService.estimateTokens('This is a test');
            
            expect(estimate).toBeGreaterThan(0);
        });

        test('should check if prompt fits in context window', () => {
            const fits = aiService.fitsInContextWindow('gpt-3.5-turbo', 'Short text');
            
            expect(fits).toBe(true);
        });

        test('should truncate long prompt', () => {
            const longText = 'a'.repeat(100000);
            const truncated = aiService.truncateToFit('gpt-3.5-turbo', longText);
            
            expect(truncated.length).toBeLessThan(longText.length);
        });
    });

    describe('Response Validation', () => {
        test('should validate response with min/max length', () => {
            const response = { content: 'Valid response' };
            const result = aiService.validateResponse(response, {
                minLength: 5,
                maxLength: 100
            });
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should detect invalid response', () => {
            const result = aiService.validateResponse(null, {});
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Response is null or undefined');
        });

        test('should use custom validator', () => {
            const response = { content: 'test' };
            const customValidator = jest.fn(() => ({ valid: false, errors: ['Custom error'] }));
            
            const result = aiService.validateResponse(response, {
                custom: customValidator
            });
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Custom error');
        });
    });

    describe('Conversation Persistence', () => {
        test('should save conversation', async () => {
            aiService.getConversation('conv-1');
            mockPuter.writeFile.mockResolvedValue(undefined);
            
            const result = await aiService.saveConversation('conv-1');
            
            expect(result).toBe(true);
            expect(mockPuter.writeFile).toHaveBeenCalled();
        });

        test('should load conversation', async () => {
            const mockConv = {
                id: 'conv-1',
                messages: [{ role: 'user', content: 'Hello' }]
            };
            mockPuter.readJSONFile.mockResolvedValue(mockConv);
            
            const result = await aiService.loadConversation('conv-1');
            
            expect(result).toEqual(mockConv);
            expect(aiService.conversations.has('conv-1')).toBe(true);
        });

        test('should list saved conversations', async () => {
            mockPuter.listDirectory.mockResolvedValue([
                { name: 'conv-1.json', path: '/conv-1.json', modified: '2025-01-01' },
                { name: 'conv-2.json', path: '/conv-2.json', modified: '2025-01-02' }
            ]);
            
            const result = await aiService.listConversations();
            
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('conv-1');
        });

        test('should delete saved conversation', async () => {
            aiService.getConversation('conv-1');
            mockPuter.delete.mockResolvedValue(undefined);
            
            const result = await aiService.deleteSavedConversation('conv-1');
            
            expect(result).toBe(true);
            expect(mockPuter.delete).toHaveBeenCalled();
            expect(aiService.conversations.has('conv-1')).toBe(false);
        });
    });

    describe('Response Parsing', () => {
        test('should parse chat response', () => {
            const mockResponse = {
                message: { content: 'Hello' },
                model: 'gpt-3.5-turbo',
                usage: {
                    prompt_tokens: 5,
                    completion_tokens: 3,
                    total_tokens: 8
                },
                finish_reason: 'stop'
            };

            const parsed = aiService._parseChatResponse(mockResponse);
            
            expect(parsed.content).toBe('Hello');
            expect(parsed.usage.totalTokens).toBe(8);
        });

        test('should parse completion response', () => {
            const mockResponse = {
                choices: [{ text: 'Generated text', finish_reason: 'length' }],
                model: 'text-davinci-003',
                usage: { total_tokens: 10 }
            };

            const parsed = aiService._parseCompletionResponse(mockResponse);
            
            expect(parsed.content).toBe('Generated text');
            expect(parsed.finishReason).toBe('length');
        });
    });
});
