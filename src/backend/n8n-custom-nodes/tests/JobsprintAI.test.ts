import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { JobsprintAI } from '../nodes/JobsprintAI.node';
import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
	NodeApiError,
} from 'n8n-workflow';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
}));

describe('JobsprintAI Node', () => {
	let node: JobsprintAI;
	let mockContext: Partial<IExecuteFunctions>;

	beforeEach(() => {
		node = new JobsprintAI();

		mockContext = {
			getInputData: jest.fn().mockReturnValue([
				{ json: { test: 'data' } },
			] as INodeExecutionData[]),
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiUrl: 'https://api.jobsprint.ai',
				apiKey: 'test-api-key',
			}),
			helpers: {
				httpRequest: jest.fn(),
			},
			continueOnFail: jest.fn().mockReturnValue(false),
			getNode: jest.fn().mockReturnValue({ id: 'test-node' }),
		};
	});

	describe('Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('Jobsprint AI');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('jobsprintAI');
		});

		it('should require credentials', () => {
			expect(node.description.credentials).toBeDefined();
			expect(node.description.credentials?.[0].name).toBe('jobsprintApi');
		});

		it('should have correct inputs and outputs', () => {
			expect(node.description.inputs).toEqual(['main']);
			expect(node.description.outputs).toEqual(['main']);
		});
	});

	describe('Chat Completion', () => {
		it('should execute chat completion successfully', async () => {
			const mockResponse = {
				choices: [
					{
						message: {
							content: 'Hello! How can I help you today?',
						},
						finish_reason: 'stop',
					},
				],
				usage: {
					prompt_tokens: 10,
					completion_tokens: 20,
					total_tokens: 30,
				},
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'chat',
					model: 'gpt-3.5-turbo',
					maxTokens: 1000,
					temperature: 0.7,
					messages: {
						messages: [
							{
								role: 'user',
								content: 'Hello!',
							},
						],
					},
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

			// Bind context to execute function
			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result).toBeDefined();
			expect(result[0]).toBeDefined();
			expect(result[0][0]).toBeDefined();
			expect(result[0][0].json.operation).toBe('chat');
			expect(result[0][0].json.response).toBe('Hello! How can I help you today?');
			expect(result[0][0].json.usage).toEqual(mockResponse.usage);
			expect(result[0][0].json.finishReason).toBe('stop');

			expect(mockContext.helpers?.httpRequest).toHaveBeenCalledWith({
				method: 'POST',
				url: 'https://api.jobsprint.ai/ai/chat',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer test-api-key',
				},
				body: {
					model: 'gpt-3.5-turbo',
					messages: [
						{
							role: 'user',
							content: 'Hello!',
						},
					],
					max_tokens: 1000,
					temperature: 0.7,
				},
				json: true,
			});
		});

		it('should throw error if no messages provided', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'chat',
					model: 'gpt-3.5-turbo',
					maxTokens: 1000,
					temperature: 0.7,
					messages: { messages: [] },
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('At least one message is required');
		});
	});

	describe('Code Completion', () => {
		it('should execute code completion successfully', async () => {
			const mockResponse = {
				choices: [
					{
						text: 'function hello() {\n  console.log("Hello, world!");\n}',
						finish_reason: 'stop',
					},
				],
				usage: {
					prompt_tokens: 5,
					completion_tokens: 15,
					total_tokens: 20,
				},
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'code',
					model: 'code-davinci-002',
					prompt: 'Write a hello function',
					maxTokens: 500,
					temperature: 0.5,
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result[0][0].json.operation).toBe('code');
			expect(result[0][0].json.response).toContain('function hello');
		});
	});

	describe('Text Completion', () => {
		it('should execute text completion successfully', async () => {
			const mockResponse = {
				choices: [
					{
						text: 'This is a completion.',
						finish_reason: 'stop',
					},
				],
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'text',
					model: 'text-davinci-003',
					prompt: 'Complete this sentence',
					maxTokens: 100,
					temperature: 0.7,
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result[0][0].json.operation).toBe('text');
			expect(result[0][0].json.response).toBe('This is a completion.');
		});

		it('should throw error if prompt is empty', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'text',
					model: 'text-davinci-003',
					prompt: '',
					maxTokens: 100,
					temperature: 0.7,
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('Prompt is required');
		});
	});

	describe('Validation', () => {
		it('should validate max tokens range', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'text',
					model: 'gpt-3.5-turbo',
					prompt: 'test',
					maxTokens: 5000, // Invalid: > 4096
					temperature: 0.7,
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('Max tokens must be between 1 and 4096');
		});

		it('should validate temperature range', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'text',
					model: 'gpt-3.5-turbo',
					prompt: 'test',
					maxTokens: 100,
					temperature: 3, // Invalid: > 2
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('Temperature must be between 0 and 2');
		});
	});

	describe('Error Handling', () => {
		it('should handle API errors with continueOnFail', async () => {
			const apiError = {
				message: 'API Error',
				httpCode: '500',
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'text',
					model: 'gpt-3.5-turbo',
					prompt: 'test',
					maxTokens: 100,
					temperature: 0.7,
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockRejectedValue(apiError);
			(mockContext.continueOnFail as jest.Mock).mockReturnValue(true);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result[0][0].json.error).toBe('API Error');
		});

		it('should throw NodeApiError for HTTP errors', async () => {
			const apiError = {
				message: 'Unauthorized',
				httpCode: '401',
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					operation: 'text',
					model: 'gpt-3.5-turbo',
					prompt: 'test',
					maxTokens: 100,
					temperature: 0.7,
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockRejectedValue(apiError);
			(mockContext.continueOnFail as jest.Mock).mockReturnValue(false);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeApiError);
		});
	});
});
