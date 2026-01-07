import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeApiError,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

/**
 * Jobsprint Zapier Node - Zapier MCP Integration
 *
 * Provides access to 30,000+ Zapier app integrations through MCP
 * Supports triggers, actions, and webhook handling
 */
export class JobsprintZapier implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jobsprint Zapier',
		name: 'jobsprintZapier',
		icon: 'file:zapier.svg',
		group: ['transform'],
		version: 1,
		description: 'Access Zapier integrations through Jobsprint',
		defaults: {
			name: 'Jobsprint Zapier',
			color: '#FF4A00',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'jobsprintApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Action',
						value: 'action',
						description: 'Perform an action in an app',
					},
					{
						name: 'Trigger',
						value: 'trigger',
						description: 'Subscribe to app events',
					},
					{
						name: 'Webhook',
						value: 'webhook',
						description: 'Handle webhook events',
					},
				],
				default: 'action',
			},
			{
				displayName: 'App',
				name: 'app',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['action', 'trigger'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getApps',
				},
				default: '',
				required: true,
				description: 'Select the Zapier app to use',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['action'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getActions',
				},
				default: '',
				required: true,
				description: 'Select the action to perform',
			},
			{
				displayName: 'Trigger',
				name: 'trigger',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['trigger'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getTriggers',
				},
				default: '',
				required: true,
				description: 'Select the trigger event',
			},
			{
				displayName: 'Parameters',
				name: 'parameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['action'],
					},
				},
				description: 'Action parameters',
				default: '',
				options: [
					{
						name: 'parameters',
						displayName: 'Parameters',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['webhook'],
					},
				},
				default: '',
				required: true,
				description: 'The webhook URL to handle events from',
			},
			{
				displayName: 'Webhook Event',
				name: 'webhookEvent',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['webhook'],
					},
				},
				default: '',
				required: true,
				description: 'The event type to handle',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;

		// Get credentials
		const credentials = await this.getCredentials('jobsprintApi');
		const apiUrl = credentials.apiUrl as string;
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				if (resource === 'action') {
					const app = this.getNodeParameter('app', i) as string;
					const action = this.getNodeParameter('action', i) as string;
					const parameters = this.getNodeParameter('parameters', i) as {
						parameters: Array<{ name: string; value: string }>;
					};

					if (!app || app.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'App is required',
							{ itemIndex: i },
						);
					}

					if (!action || action.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Action is required',
							{ itemIndex: i },
						);
					}

					// Build parameters object
					const paramsObj: { [key: string]: string } = {};
					if (parameters.parameters) {
						parameters.parameters.forEach((param) => {
							if (param.name && param.value !== undefined) {
								paramsObj[param.name] = param.value;
							}
						});
					}

					responseData = await this.helpers.httpRequest({
						method: 'POST',
						url: `${apiUrl}/zapier/actions`,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`,
						},
						body: {
							app,
							action,
							parameters: paramsObj,
							inputData: items[i].json,
						},
						json: true,
					});

					returnData.push({
						json: {
							resource: 'action',
							app,
							action,
							parameters: paramsObj,
							result: responseData,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});

				} else if (resource === 'trigger') {
					const app = this.getNodeParameter('app', i) as string;
					const trigger = this.getNodeParameter('trigger', i) as string;

					if (!app || app.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'App is required',
							{ itemIndex: i },
						);
					}

					if (!trigger || trigger.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Trigger is required',
							{ itemIndex: i },
						);
					}

					responseData = await this.helpers.httpRequest({
						method: 'POST',
						url: `${apiUrl}/zapier/triggers`,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`,
						},
						body: {
							app,
							trigger,
							inputData: items[i].json,
						},
						json: true,
					});

					returnData.push({
						json: {
							resource: 'trigger',
							app,
							trigger,
							result: responseData,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});

				} else if (resource === 'webhook') {
					const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
					const webhookEvent = this.getNodeParameter('webhookEvent', i) as string;

					if (!webhookUrl || webhookUrl.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Webhook URL is required',
							{ itemIndex: i },
						);
					}

					if (!webhookEvent || webhookEvent.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Webhook event is required',
							{ itemIndex: i },
						);
					}

					// Forward webhook data to Zapier integration
					responseData = await this.helpers.httpRequest({
						method: 'POST',
						url: `${apiUrl}/zapier/webhooks`,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`,
						},
						body: {
							webhookUrl,
							event: webhookEvent,
							payload: items[i].json,
						},
						json: true,
					});

					returnData.push({
						json: {
							resource: 'webhook',
							webhookUrl,
							event: webhookEvent,
							result: responseData,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							resource,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});
				} else {
					if (error.httpCode) {
						throw new NodeApiError(this.getNode(), error as any);
					}
					throw error;
				}
			}
		}

		return [returnData];
	}

	/**
	 * Load available Zapier apps
	 */
	async getApps(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		const credentials = await this.getCredentials('jobsprintApi');
		const apiUrl = credentials.apiUrl as string;
		const apiKey = credentials.apiKey as string;

		try {
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${apiUrl}/zapier/apps`,
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				json: true,
			});

			return response.apps.map((app: any) => ({
				name: app.name,
				value: app.key,
				description: app.description,
			}));
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as any);
		}
	}

	/**
	 * Load available actions for selected app
	 */
	async getActions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		const app = this.getCurrentNodeParameter('app') as string;
		const credentials = await this.getCredentials('jobsprintApi');
		const apiUrl = credentials.apiUrl as string;
		const apiKey = credentials.apiKey as string;

		try {
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${apiUrl}/zapier/apps/${app}/actions`,
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				json: true,
			});

			return response.actions.map((action: any) => ({
				name: action.name,
				value: action.key,
				description: action.description,
			}));
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as any);
		}
	}

	/**
	 * Load available triggers for selected app
	 */
	async getTriggers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		const app = this.getCurrentNodeParameter('app') as string;
		const credentials = await this.getCredentials('jobsprintApi');
		const apiUrl = credentials.apiUrl as string;
		const apiKey = credentials.apiKey as string;

		try {
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${apiUrl}/zapier/apps/${app}/triggers`,
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				json: true,
			});

			return response.triggers.map((trigger: any) => ({
				name: trigger.name,
				value: trigger.key,
				description: trigger.description,
			}));
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as any);
		}
	}
}
