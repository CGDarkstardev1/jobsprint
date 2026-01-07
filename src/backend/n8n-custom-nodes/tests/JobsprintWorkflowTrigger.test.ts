import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { JobsprintWorkflowTrigger } from '../nodes/JobsprintWorkflowTrigger.node';
import { ITriggerFunctions, INodeTriggerResponse } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
}));

describe('JobsprintWorkflowTrigger Node', () => {
	let node: JobsprintWorkflowTrigger;
	let mockContext: Partial<ITriggerFunctions>;

	beforeEach(() => {
		node = new JobsprintWorkflowTrigger();

		mockContext = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiUrl: 'https://api.jobsprint.ai',
				apiKey: 'test-api-key',
			}),
			helpers: {
				httpRequest: jest.fn(),
			},
			getNode: jest.fn().mockReturnValue({ id: 'test-node' }),
		};
	});

	describe('Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('Jobsprint Workflow Trigger');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('jobsprintWorkflowTrigger');
		});

		it('should have no inputs', () => {
			expect(node.description.inputs).toEqual([]);
		});

		it('should have one output', () => {
			expect(node.description.outputs).toEqual(['main']);
		});

		it('should support multiple trigger types', () => {
			const triggerTypeOptions = node.description.properties.find(
				(prop: any) => prop.name === 'triggerType',
			);
			expect(triggerTypeOptions).toBeDefined();
			expect(triggerTypeOptions.options).toHaveLength(4);
		});
	});

	describe('Execute', () => {
		it('should return empty array for trigger node', async () => {
			const executeWithContext = node.execute.bind(mockContext as ITriggerFunctions);
			const result = await executeWithContext();

			expect(result).toEqual([[]]);
		});
	});

	describe('Poll - Schedule Trigger', () => {
		it('should handle schedule trigger type', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					triggerType: 'schedule',
					cronExpression: '0 * * * *',
				};
				return params[name];
			});

			const pollWithContext = node.poll.bind(mockContext as ITriggerFunctions);
			const result = await pollWithContext();

			expect(result).toEqual({
				[],
			});
		});
	});

	describe('Poll - Event Trigger', () => {
		it('should poll and return events successfully', async () => {
			const mockResponse = {
				events: [
					{
						id: 'event-1',
						type: 'file.created',
						data: { file: 'test.txt' },
						timestamp: '2024-01-06T00:00:00Z',
						metadata: { source: 'puter' },
					},
					{
						id: 'event-2',
						type: 'file.created',
						data: { file: 'test2.txt' },
						timestamp: '2024-01-06T01:00:00Z',
						metadata: { source: 'puter' },
					},
				],
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					triggerType: 'event',
					eventType: 'file.created',
					eventFilter: '{}',
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse)
				.mockResolvedValueOnce({ success: true }); // Acknowledge response

			const pollWithContext = node.poll.bind(mockContext as ITriggerFunctions);
			const result = await pollWithContext();

			expect(result).toEqual({
					{
						json: {
							event: 'file.created',
							data: { file: 'test.txt' },
							timestamp: '2024-01-06T00:00:00Z',
							metadata: { source: 'puter' },
						},
					},
					{
						json: {
							event: 'file.created',
							data: { file: 'test2.txt' },
							timestamp: '2024-01-06T01:00:00Z',
							metadata: { source: 'puter' },
						},
					},
				],
			});

			// Verify acknowledge call
			expect(mockContext.helpers?.httpRequest).toHaveBeenCalledTimes(2);
			expect(mockContext.helpers?.httpRequest).toHaveBeenNthCalledWith(2, {
				method: 'POST',
				url: 'https://api.jobsprint.ai/events/acknowledge',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer test-api-key',
				},
				body: {
					eventIds: ['event-1', 'event-2'],
				},
				json: true,
			});
		});

		it('should handle custom event type', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					triggerType: 'event',
					eventType: 'custom',
					customEvent: 'my.custom.event',
					eventFilter: '{}',
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue({
				events: [
					{
						id: 'event-3',
						type: 'my.custom.event',
						data: { message: 'Custom event occurred' },
						timestamp: '2024-01-06T02:00:00Z',
					},
				],
			});

			const pollWithContext = node.poll.bind(mockContext as ITriggerFunctions);
			await pollWithContext();

			expect(mockContext.helpers?.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						type: 'my.custom.event',
					}),
				}),
			);
		});

		it('should return empty array when no events', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					triggerType: 'event',
					eventType: 'file.created',
					eventFilter: '{}',
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue({
				events: [],
			});

			const pollWithContext = node.poll.bind(mockContext as ITriggerFunctions);
			const result = await pollWithContext();

			expect(result).toEqual({
				[],
			});
		});

		it('should handle API errors gracefully', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					triggerType: 'event',
					eventType: 'file.created',
					eventFilter: '{}',
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockRejectedValue(
				new Error('API Error'),
			);

			const pollWithContext = node.poll.bind(mockContext as ITriggerFunctions);
			const result = await pollWithContext();

			// Should return empty array on error
			expect(result).toEqual({
				[],
			});
		});
	});

	describe('Supported Event Types', () => {
		it('should support file.created event', () => {
			const eventTypeOptions = node.description.properties.find(
				(prop: any) => prop.name === 'eventType',
			);
			expect(eventTypeOptions.options[0].value).toBe('file.created');
		});

		it('should support file.updated event', () => {
			const eventTypeOptions = node.description.properties.find(
				(prop: any) => prop.name === 'eventType',
			);
			expect(eventTypeOptions.options[1].value).toBe('file.updated');
		});

		it('should support file.deleted event', () => {
			const eventTypeOptions = node.description.properties.find(
				(prop: any) => prop.name === 'eventType',
			);
			expect(eventTypeOptions.options[2].value).toBe('file.deleted');
		});

		it('should support ai.completed event', () => {
			const eventTypeOptions = node.description.properties.find(
				(prop: any) => prop.name === 'eventType',
			);
			expect(eventTypeOptions.options[3].value).toBe('ai.completed');
		});

		it('should support workflow.completed event', () => {
			const eventTypeOptions = node.description.properties.find(
				(prop: any) => prop.name === 'eventType',
			);
			expect(eventTypeOptions.options[4].value).toBe('workflow.completed');
		});

		it('should support custom event type', () => {
			const eventTypeOptions = node.description.properties.find(
				(prop: any) => prop.name === 'eventType',
			);
			expect(eventTypeOptions.options[5].value).toBe('custom');
		});
	});

	describe('Webhook Trigger Configuration', () => {
		it('should support webhook trigger type', () => {
			const triggerTypeOptions = node.description.properties.find(
				(prop: any) => prop.name === 'triggerType',
			);
			const webhookOption = triggerTypeOptions.options.find(
				(opt: any) => opt.value === 'webhook',
			);
			expect(webhookOption).toBeDefined();
		});

		it('should have webhook path parameter', () => {
			const webhookPath = node.description.properties.find(
				(prop: any) => prop.name === 'webhookPath',
			);
			expect(webhookPath).toBeDefined();
			expect(webhookPath.default).toBe('jobsprint-webhook');
		});

		it('should support HTTP method selection', () => {
			const httpMethod = node.description.properties.find(
				(prop: any) => prop.name === 'httpMethod',
			);
			expect(httpMethod).toBeDefined();
			expect(httpMethod.options).toHaveLength(5);
		});

		it('should support response mode configuration', () => {
			const responseMode = node.description.properties.find(
				(prop: any) => prop.name === 'responseMode',
			);
			expect(responseMode).toBeDefined();
			expect(responseMode.options).toHaveLength(2);
		});
	});

	describe('Cron Expression Validation', () => {
		it('should have default cron expression', () => {
			const cronExpression = node.description.properties.find(
				(prop: any) => prop.name === 'cronExpression',
			);
			expect(cronExpression).toBeDefined();
			expect(cronExpression.default).toBe('0 * * * *');
		});
	});
});
