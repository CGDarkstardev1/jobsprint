import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { JobsprintZapier } from '../nodes/JobsprintZapier.node';
import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	NodeOperationError,
	NodeApiError,
} from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
}));

describe('JobsprintZapier Node', () => {
	let node: JobsprintZapier;
	let mockContext: Partial<IExecuteFunctions>;

	beforeEach(() => {
		node = new JobsprintZapier();

		mockContext = {
			getInputData: jest.fn().mockReturnValue([
				{ json: { data: 'test' } },
			] as INodeExecutionData[]),
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiUrl: 'https://api.jobsprint.ai',
				apiKey: 'test-api-key',
			}),
			getCurrentNodeParameter: jest.fn(),
			helpers: {
				httpRequest: jest.fn(),
			},
			continueOnFail: jest.fn().mockReturnValue(false),
			getNode: jest.fn().mockReturnValue({ id: 'test-node' }),
		};
	});

	describe('Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('Jobsprint Zapier');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('jobsprintZapier');
		});

		it('should support action, trigger, and webhook resources', () => {
			const resourceOptions = node.description.properties.find(
				(prop: any) => prop.name === 'resource',
			);
			expect(resourceOptions).toBeDefined();
			expect(resourceOptions.options).toHaveLength(3);
		});
	});

	describe('Action Operations', () => {
		it('should execute Zapier action successfully', async () => {
			const mockResponse = {
				success: true,
				result: {
					id: 'action-result-123',
					status: 'completed',
				},
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'action',
					app: 'slack',
					action: 'sendMessage',
					parameters: {
						parameters: [
							{ name: 'channel', value: '#general' },
							{ name: 'text', value: 'Hello from Jobsprint!' },
						],
					},
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result[0][0].json.resource).toBe('action');
			expect(result[0][0].json.app).toBe('slack');
			expect(result[0][0].json.action).toBe('sendMessage');
			expect(result[0][0].json.result).toEqual(mockResponse);

			expect(mockContext.helpers?.httpRequest).toHaveBeenCalledWith({
				method: 'POST',
				url: 'https://api.jobsprint.ai/zapier/actions',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer test-api-key',
				},
				body: {
					app: 'slack',
					action: 'sendMessage',
					parameters: {
						channel: '#general',
						text: 'Hello from Jobsprint!',
					},
					inputData: { data: 'test' },
				},
				json: true,
			});
		});

		it('should throw error if app is empty', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'action',
					app: '',
					action: 'sendMessage',
					parameters: { parameters: [] },
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('App is required');
		});

		it('should throw error if action is empty', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'action',
					app: 'slack',
					action: '',
					parameters: { parameters: [] },
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('Action is required');
		});

		it('should handle empty parameters array', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'action',
					app: 'gmail',
					action: 'sendEmail',
					parameters: { parameters: [] },
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue({ success: true });

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			await executeWithContext();

			expect(mockContext.helpers?.httpRequest).toHaveBeenCalledWith({
				body: expect.objectContaining({
					parameters: {},
				}),
			});
		});
	});

	describe('Trigger Operations', () => {
		it('should execute Zapier trigger successfully', async () => {
			const mockResponse = {
				success: true,
				results: [
					{ id: 1, data: 'result1' },
					{ id: 2, data: 'result2' },
				],
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'trigger',
					app: 'gmail',
					trigger: 'newEmail',
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result[0][0].json.resource).toBe('trigger');
			expect(result[0][0].json.app).toBe('gmail');
			expect(result[0][0].json.trigger).toBe('newEmail');
		});

		it('should throw error if app is missing for trigger', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'trigger',
					app: '',
					trigger: 'newEmail',
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
		});

		it('should throw error if trigger is missing', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'trigger',
					app: 'gmail',
					trigger: '',
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('Trigger is required');
		});
	});

	describe('Webhook Operations', () => {
		it('should handle webhook successfully', async () => {
			const mockResponse = {
				success: true,
				message: 'Webhook processed',
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'webhook',
					webhookUrl: 'https://example.com/webhook',
					webhookEvent: 'user.created',
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result[0][0].json.resource).toBe('webhook');
			expect(result[0][0].json.webhookUrl).toBe('https://example.com/webhook');
			expect(result[0][0].json.event).toBe('user.created');
		});

		it('should throw error if webhook URL is empty', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'webhook',
					webhookUrl: '',
					webhookEvent: 'test.event',
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('Webhook URL is required');
		});

		it('should throw error if webhook event is empty', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'webhook',
					webhookUrl: 'https://example.com/webhook',
					webhookEvent: '',
				};
				return params[name];
			});

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

			await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
			await expect(executeWithContext()).rejects.toThrow('Webhook event is required');
		});
	});

	describe('Load Options Methods', () => {
		let mockLoadContext: Partial<ILoadOptionsFunctions>;

		beforeEach(() => {
			mockLoadContext = {
				getCredentials: jest.fn().mockResolvedValue({
					apiUrl: 'https://api.jobsprint.ai',
					apiKey: 'test-api-key',
				}),
				getCurrentNodeParameter: jest.fn(),
				helpers: {
					httpRequest: jest.fn(),
				},
				getNode: jest.fn().mockReturnValue({ id: 'test-node' }),
			};
		});

		describe('getApps', () => {
			it('should load apps successfully', async () => {
				const mockResponse = {
					apps: [
						{ key: 'slack', name: 'Slack', description: 'Team communication' },
						{ key: 'gmail', name: 'Gmail', description: 'Email service' },
					],
				};

				(mockLoadContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const getAppsBound = node.getApps.bind(mockLoadContext as ILoadOptionsFunctions);
				const result = await getAppsBound();

				expect(result).toHaveLength(2);
				expect(result[0]).toEqual({
					name: 'Slack',
					value: 'slack',
					description: 'Team communication',
				});
			});

			it('should handle API errors', async () => {
				(mockLoadContext.helpers?.httpRequest as jest.Mock).mockRejectedValue(
					new Error('API Error'),
				);

				const getAppsBound = node.getApps.bind(mockLoadContext as ILoadOptionsFunctions);

				await expect(getAppsBound()).rejects.toThrow(NodeApiError);
			});
		});

		describe('getActions', () => {
			it('should load actions for selected app', async () => {
				(mockLoadContext.getCurrentNodeParameter as jest.Mock).mockReturnValue('slack');

				const mockResponse = {
					actions: [
						{ key: 'sendMessage', name: 'Send Message', description: 'Send message to channel' },
						{ key: 'createChannel', name: 'Create Channel', description: 'Create new channel' },
					],
				};

				(mockLoadContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const getActionsBound = node.getActions.bind(mockLoadContext as ILoadOptionsFunctions);
				const result = await getActionsBound();

				expect(result).toHaveLength(2);
				expect(result[0].name).toBe('Send Message');
				expect(mockLoadContext.helpers?.httpRequest).toHaveBeenCalledWith({
					method: 'GET',
					url: 'https://api.jobsprint.ai/zapier/apps/slack/actions',
					headers: {
						Authorization: 'Bearer test-api-key',
					},
					json: true,
				});
			});
		});

		describe('getTriggers', () => {
			it('should load triggers for selected app', async () => {
				(mockLoadContext.getCurrentNodeParameter as jest.Mock).mockReturnValue('gmail');

				const mockResponse = {
					triggers: [
						{ key: 'newEmail', name: 'New Email', description: 'Triggered on new email' },
						{ key: 'newAttachment', name: 'New Attachment', description: 'Triggered on new attachment' },
					],
				};

				(mockLoadContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const getTriggersBound = node.getTriggers.bind(mockLoadContext as ILoadOptionsFunctions);
				const result = await getTriggersBound();

				expect(result).toHaveLength(2);
				expect(result[0].name).toBe('New Email');
				expect(mockLoadContext.helpers?.httpRequest).toHaveBeenCalledWith({
					method: 'GET',
					url: 'https://api.jobsprint.ai/zapier/apps/gmail/triggers',
					headers: {
						Authorization: 'Bearer test-api-key',
					},
					json: true,
				});
			});
		});
	});

	describe('Error Handling', () => {
		it('should handle API errors with continueOnFail', async () => {
			const apiError = {
				message: 'Zapier API Error',
				httpCode: '500',
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'action',
					app: 'slack',
					action: 'sendMessage',
					parameters: { parameters: [] },
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockRejectedValue(apiError);
			(mockContext.continueOnFail as jest.Mock).mockReturnValue(true);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result[0][0].json.error).toBe('Zapier API Error');
		});

		it('should throw NodeApiError for HTTP errors', async () => {
			const apiError = {
				message: 'Unauthorized',
				httpCode: '401',
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'action',
					app: 'slack',
					action: 'sendMessage',
					parameters: { parameters: [] },
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
