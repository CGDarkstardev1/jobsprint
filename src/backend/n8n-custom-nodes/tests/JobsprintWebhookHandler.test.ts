import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { JobsprintWebhookHandler } from '../nodes/JobsprintWebhookHandler.node';
import {
	IWebhookFunctions,
	IWebhookResponseData,
	NodeOperationError,
} from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
}));

describe('JobsprintWebhookHandler Node', () => {
	let node: JobsprintWebhookHandler;
	let mockContext: Partial<IWebhookFunctions>;

	const mockBody = {
		message: 'Hello, webhook!',
		user: 'testuser',
	};

	const mockHeaders = {
		'content-type': 'application/json',
		'x-api-key': 'test-api-key',
	};

	const mockQuery = {
		source: 'external',
	};

	const mockRequest = {
		method: 'POST',
		path: '/webhook/test',
	};

	beforeEach(() => {
		node = new JobsprintWebhookHandler();

		mockContext = {
			getBodyData: jest.fn().mockReturnValue(mockBody),
			getBody: jest.fn().mockReturnValue(JSON.stringify(mockBody)),
			getHeaders: jest.fn().mockReturnValue(mockHeaders),
			getAllQueryParameters: jest.fn().mockReturnValue(mockQuery),
			getRequestObject: jest.fn().mockReturnValue(mockRequest),
			getNodeParameter: jest.fn(),
			getNode: jest.fn().mockReturnValue({ id: 'test-node' }),
		};
	});

	describe('Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('Jobsprint Webhook Handler');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('jobsprintWebhookHandler');
		});

		it('should support webhooks', () => {
			expect(node.description.webhooks).toBeDefined();
			expect(node.description.webhooks).toHaveLength(1);
		});

		it('should have correct webhook configuration', () => {
			const webhook = node.description.webhooks?.[0];
			expect(webhook?.name).toBe('default');
			expect(webhook?.httpMethod).toBe('POST');
			expect(webhook?.responseMode).toBe('onReceived');
			expect(webhook?.path).toBe('jobsprint-webhook');
		});

		it('should support multiple authentication methods', () => {
			const authOptions = node.description.properties.find(
				(prop: any) => prop.name === 'authentication',
			);
			expect(authOptions).toBeDefined();
			expect(authOptions.options).toHaveLength(5);
		});
	});

	describe('Execute', () => {
		it('should return input data unchanged', async () => {
			const mockInput = [
				{ json: { test: 'data' } },
			];

			const mockContextWithInput = {
				...mockContext,
				getInputData: jest.fn().mockReturnValue(mockInput),
			};

			const executeWithContext = node.execute.bind(mockContextWithInput as any);
			const result = await executeWithContext();

			expect(result).toEqual([mockInput]);
		});
	});

	describe('Webhook - No Authentication', () => {
		it('should process webhook without authentication', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'none',
					responseMode: 'lastNode',
					options: {
						parseBody: true,
						rawBody: false,
						includeHeaders: true,
						includeQueryParams: true,
					},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result).toHaveProperty('workflowData');
			expect(result.workflowData).toHaveLength(1);
			expect(result.workflowData[0].json).toMatchObject({
				method: 'POST',
				path: '/webhook/test',
				headers: mockHeaders,
				query: mockQuery,
				json: mockBody,
			});
		});
	});

	describe('Webhook - API Key Authentication', () => {
		it('should accept valid API key', async () => {
			const validHeaders = {
				...mockHeaders,
				'x-api-key': 'valid-api-key',
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(validHeaders);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'apiKey',
					apiKey: 'valid-api-key',
					responseMode: 'lastNode',
					options: {
						parseBody: true,
						includeHeaders: true,
						includeQueryParams: true,
					},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result).toHaveProperty('workflowData');
		});

		it('should reject invalid API key', async () => {
			const invalidHeaders = {
				...mockHeaders,
				'x-api-key': 'invalid-api-key',
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(invalidHeaders);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'apiKey',
					apiKey: 'valid-api-key',
					responseMode: 'lastNode',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);

			try {
				await webhookWithContext();
				expect(true).toBe(false); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(NodeOperationError);
				expect((error as NodeOperationError).message).toContain('Invalid API key');
			}
		});

		it('should reject missing API key', async () => {
			const headersWithoutKey = {
				'content-type': 'application/json',
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(headersWithoutKey);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'apiKey',
					apiKey: 'required-api-key',
					responseMode: 'lastNode',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);

			try {
				await webhookWithContext();
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(NodeOperationError);
			}
		});
	});

	describe('Webhook - Bearer Token Authentication', () => {
		it('should accept valid bearer token', async () => {
			const validHeaders = {
				...mockHeaders,
				authorization: 'Bearer valid-token',
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(validHeaders);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'bearerToken',
					token: 'valid-token',
					responseMode: 'lastNode',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result).toHaveProperty('workflowData');
		});

		it('should reject invalid bearer token', async () => {
			const invalidHeaders = {
				...mockHeaders,
				authorization: 'Bearer invalid-token',
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(invalidHeaders);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'bearerToken',
					token: 'valid-token',
					responseMode: 'lastNode',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);

			try {
				await webhookWithContext();
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(NodeOperationError);
				expect((error as NodeOperationError).message).toContain('Invalid bearer token');
			}
		});
	});

	describe('Webhook - Basic Auth Authentication', () => {
		it('should accept valid basic auth credentials', async () => {
			const credentials = Buffer.from('testuser:testpass').toString('base64');
			const validHeaders = {
				...mockHeaders,
				authorization: `Basic ${credentials}`,
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(validHeaders);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'basicAuth',
					username: 'testuser',
					password: 'testpass',
					responseMode: 'lastNode',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result).toHaveProperty('workflowData');
		});

		it('should reject invalid basic auth credentials', async () => {
			const credentials = Buffer.from('wronguser:wrongpass').toString('base64');
			const invalidHeaders = {
				...mockHeaders,
				authorization: `Basic ${credentials}`,
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(invalidHeaders);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'basicAuth',
					username: 'testuser',
					password: 'testpass',
					responseMode: 'lastNode',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);

			try {
				await webhookWithContext();
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(NodeOperationError);
			}
		});
	});

	describe('Webhook - Custom Header Authentication', () => {
		it('should accept valid custom header', async () => {
			const validHeaders = {
				...mockHeaders,
				'x-webhook-secret': 'secret-value',
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(validHeaders);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'customHeader',
					customHeaderName: 'X-Webhook-Secret',
					customHeaderValue: 'secret-value',
					responseMode: 'lastNode',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result).toHaveProperty('workflowData');
		});

		it('should reject invalid custom header value', async () => {
			const invalidHeaders = {
				...mockHeaders,
				'x-webhook-secret': 'wrong-value',
			};

			(mockContext.getHeaders as jest.Mock).mockReturnValue(invalidHeaders);

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'customHeader',
					customHeaderName: 'X-Webhook-Secret',
					customHeaderValue: 'correct-value',
					responseMode: 'lastNode',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);

			try {
				await webhookWithContext();
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(NodeOperationError);
			}
		});
	});

	describe('Webhook - Response Modes', () => {
		it('should return immediate response when responseMode is onReceived', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'none',
					responseMode: 'onReceived',
					responseCode: 200,
					responseBody: '{"success": true}',
					responseHeaders: '{"Content-Type": "application/json"}',
					options: {},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result).not.toHaveProperty('workflowData');
			expect(result).toHaveProperty('statusCode', 200);
			expect(result).toHaveProperty('body', { success: true });
			expect(result).toHaveProperty('headers', { 'Content-Type': 'application/json' });
		});

		it('should return workflow data when responseMode is lastNode', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'none',
					responseMode: 'lastNode',
					options: {
						parseBody: true,
						includeHeaders: false,
						includeQueryParams: false,
					},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result).toHaveProperty('workflowData');
			expect(result.workflowData).toHaveLength(1);
		});
	});

	describe('Webhook - Body Parsing', () => {
		it('should parse JSON body successfully', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'none',
					responseMode: 'lastNode',
					options: {
						parseBody: true,
						rawBody: false,
						includeHeaders: false,
						includeQueryParams: false,
					},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result.workflowData[0].json.json).toEqual(mockBody);
		});

		it('should include raw body when requested', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'none',
					responseMode: 'lastNode',
					options: {
						parseBody: true,
						rawBody: true,
						includeHeaders: false,
						includeQueryParams: false,
					},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result.workflowData[0].json.body).toBe(JSON.stringify(mockBody));
		});

		it('should handle non-JSON body', async () => {
			(mockContext.getBody as jest.Mock).mockReturnValue('plain text body');
			(mockContext.getBodyData as jest.Mock).mockReturnValue('plain text body');

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					authentication: 'none',
					responseMode: 'lastNode',
					options: {
						parseBody: true,
						includeHeaders: false,
						includeQueryParams: false,
					},
				};
				return params[name];
			});

			const webhookWithContext = node.webhook.bind(mockContext as IWebhookFunctions);
			const result = await webhookWithContext();

			expect(result.workflowData[0].json.body).toBe('plain text body');
		});
	});
});
