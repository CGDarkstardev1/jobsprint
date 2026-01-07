import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	ITriggerFunctions,
	IDataObject,
	INodeTriggerResponse,
} from 'n8n-workflow';

/**
 * Jobsprint Workflow Trigger Node
 *
 * Triggers workflows based on various events:
 * - Cron/scheduled triggers
 * - Event-based triggers
 * - Manual triggers
 */
export class JobsprintWorkflowTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jobsprint Workflow Trigger',
		name: 'jobsprintWorkflowTrigger',
		icon: 'file:trigger.svg',
		group: ['trigger'],
		version: 1,
		description: 'Trigger workflows on various events',
		defaults: {
			name: 'Jobsprint Workflow Trigger',
			color: '#8B5CF6',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'jobsprintApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Schedule (Cron)',
						value: 'schedule',
						description: 'Trigger on a schedule',
					},
					{
						name: 'Event',
						value: 'event',
						description: 'Trigger on specific events',
					},
					{
						name: 'Webhook',
						value: 'webhook',
						description: 'Trigger via webhook call',
					},
					{
						name: 'Manual',
						value: 'manual',
						description: 'Manual trigger via API',
					},
				],
				default: 'schedule',
			},
			{
				displayName: 'Cron Expression',
				name: 'cronExpression',
				type: 'string',
				displayOptions: {
					show: {
						triggerType: ['schedule'],
					},
				},
				default: '0 * * * *',
				placeholder: '* * * * *',
				description: 'Cron expression (min hour day month weekday)',
				required: true,
			},
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				displayOptions: {
					show: {
						triggerType: ['event'],
					},
				},
				options: [
					{
						name: 'File Created',
						value: 'file.created',
					},
					{
						name: 'File Updated',
						value: 'file.updated',
					},
					{
						name: 'File Deleted',
						value: 'file.deleted',
					},
					{
						name: 'AI Job Completed',
						value: 'ai.completed',
					},
					{
						name: 'Workflow Completed',
						value: 'workflow.completed',
					},
					{
						name: 'Custom Event',
						value: 'custom',
					},
				],
				default: 'file.created',
				required: true,
			},
			{
				displayName: 'Custom Event Name',
				name: 'customEvent',
				type: 'string',
				displayOptions: {
					show: {
						triggerType: ['event'],
						eventType: ['custom'],
					},
				},
				default: '',
				placeholder: 'my.custom.event',
				description: 'Custom event name',
			},
			{
				displayName: 'Event Filter',
				name: 'eventFilter',
				type: 'json',
				displayOptions: {
					show: {
						triggerType: ['event'],
					},
				},
				default: '{}',
				description: 'Filter events by properties (JSON)',
			},
			{
				displayName: 'HTTP Method',
				name: 'httpMethod',
				type: 'options',
				displayOptions: {
					show: {
						triggerType: ['webhook'],
					},
				},
				options: [
					{
						name: 'GET',
						value: 'GET',
					},
					{
						name: 'POST',
						value: 'POST',
					},
					{
						name: 'PUT',
						value: 'PUT',
					},
					{
						name: 'PATCH',
						value: 'PATCH',
					},
					{
						name: 'DELETE',
						value: 'DELETE',
					},
				],
				default: 'POST',
			},
			{
				displayName: 'Path',
				name: 'webhookPath',
				type: 'string',
				displayOptions: {
					show: {
						triggerType: ['webhook'],
					},
				},
				default: 'jobsprint-webhook',
				placeholder: 'my-webhook',
				description: 'Webhook path',
				required: true,
			},
			{
				displayName: 'Response Mode',
				name: 'responseMode',
				type: 'options',
				displayOptions: {
					show: {
						triggerType: ['webhook'],
					},
				},
				options: [
					{
						name: 'Response Last Node',
						value: 'lastNode',
						description: 'Return response from the last node',
					},
					{
						name: 'On Received',
						value: 'onReceived',
						description: 'Return response immediately when webhook is received',
					},
				],
				default: 'lastNode',
			},
			{
				displayName: 'Response Code',
				name: 'responseCode',
				type: 'number',
				displayOptions: {
					show: {
						triggerType: ['webhook'],
						responseMode: ['onReceived'],
					},
				},
				default: 200,
				description: 'HTTP response code',
			},
			{
				displayName: 'Response Body',
				name: 'responseBody',
				type: 'string',
				displayOptions: {
					show: {
						triggerType: ['webhook'],
						responseMode: ['onReceived'],
					},
				},
				default: '{ "success": true }',
				description: 'Response body to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Trigger node doesn't process incoming data
		return [[]];
	}

	async poll(this: ITriggerFunctions): Promise<INodeTriggerResponse> {
		const triggerType = this.getNodeParameter('triggerType', 0) as string;

		// Get credentials
		const credentials = await this.getCredentials('jobsprintApi');
		const apiUrl = credentials.apiUrl as string;
		const apiKey = credentials.apiKey as string;

		if (triggerType === 'schedule') {
			// Schedule triggers are handled by n8n's internal scheduler
			// This is a fallback check
			return {
				[],
			};
		}

		if (triggerType === 'event') {
			const eventType = this.getNodeParameter('eventType', 0) as string;
			const eventFilter = this.getNodeParameter('eventFilter', 0) as string;

			// Check for events
			try {
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: `${apiUrl}/events`,
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
					qs: {
						type: eventType === 'custom' ? this.getNodeParameter('customEvent', 0) : eventType,
						filter: eventFilter,
						limit: 100,
					},
					json: true,
				});

				if (response.events && response.events.length > 0) {
					// Mark events as processed
					await this.helpers.httpRequest({
						method: 'POST',
						url: `${apiUrl}/events/acknowledge`,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`,
						},
						body: {
							eventIds: response.events.map((e: any) => e.id),
						},
						json: true,
					});

					return {
						 response.events.map((event: any) => ({
							json: {
								event: event.type,
								data: event.data,
								timestamp: event.timestamp,
								metadata: event.metadata,
							},
						})),
					};
				}
			} catch (error) {
				// Silently fail on poll errors
			}
		}

		return {
			[],
		};
	}
}
