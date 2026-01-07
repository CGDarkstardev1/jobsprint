import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeApiError,
	IWebhookFunctions,
	IWebhookResponseData,
	IHookFunctions,
} from 'n8n-workflow';

/**
 * Jobsprint Webhook Handler Node
 *
 * Handles incoming webhook requests and processes them
 * Supports authentication, validation, and response customization
 */
export class JobsprintWebhookHandler implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jobsprint Webhook Handler',
		name: 'jobsprintWebhookHandler',
		icon: 'file:webhook.svg',
		group: ['transform'],
		version: 1,
		description: 'Handle and process incoming webhook requests',
		defaults: {
			name: 'Jobsprint Webhook Handler',
			color: '#10B981',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'jobsprintApi',
				required: false,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'jobsprint-webhook',
			},
		],
		properties: [
			{
				displayName: 'HTTP Method',
				name: 'httpMethod',
				type: 'options',
				noDataExpression: true,
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
				name: 'path',
				type: 'string',
				default: 'webhook',
				placeholder: 'my-webhook',
				description: 'Webhook URL path',
				required: true,
			},
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'None',
						value: 'none',
					},
					{
						name: 'API Key',
						value: 'apiKey',
					},
					{
						name: 'Bearer Token',
						value: 'bearerToken',
					},
					{
						name: 'Basic Auth',
						value: 'basicAuth',
					},
					{
						name: 'Custom Header',
						value: 'customHeader',
					},
				],
				default: 'none',
			},
			{
				displayName: 'API Key',
				name: 'apiKey',
				type: 'string',
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
				default: '',
				placeholder: 'your-api-key',
				description: 'API key to validate',
			},
			{
				displayName: 'Token',
				name: 'token',
				type: 'string',
				displayOptions: {
					show: {
						authentication: ['bearerToken'],
					},
				},
				default: '',
				placeholder: 'your-bearer-token',
				description: 'Bearer token to validate',
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				displayOptions: {
					show: {
						authentication: ['basicAuth'],
					},
				},
				default: '',
				placeholder: 'username',
				description: 'Basic auth username',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				displayOptions: {
					show: {
						authentication: ['basicAuth'],
					},
				},
				default: '',
				placeholder: 'password',
				description: 'Basic auth password',
			},
			{
				displayName: 'Header Name',
				name: 'customHeaderName',
				type: 'string',
				displayOptions: {
					show: {
						authentication: ['customHeader'],
					},
				},
				default: 'X-Webhook-Secret',
				placeholder: 'X-Custom-Header',
				description: 'Custom header name',
			},
			{
				displayName: 'Header Value',
				name: 'customHeaderValue',
				type: 'string',
				displayOptions: {
					show: {
						authentication: ['customHeader'],
					},
				},
				default: '',
				placeholder: 'secret-value',
				description: 'Custom header value',
			},
			{
				displayName: 'Response Mode',
				name: 'responseMode',
				type: 'options',
				noDataExpression: true,
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
						responseMode: ['onReceived'],
					},
				},
				default: '{ "success": true }',
				description: 'Response body to return',
			},
			{
				displayName: 'Response Headers',
				name: 'responseHeaders',
				type: 'json',
				displayOptions: {
					show: {
						responseMode: ['onReceived'],
					},
				},
				default: '{ "Content-Type": "application/json" }',
				description: 'Response headers (JSON format)',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Parse Body',
						name: 'parseBody',
						type: 'boolean',
						default: true,
						description: 'Parse JSON body automatically',
					},
					{
						displayName: 'Raw Body',
						name: 'rawBody',
						type: 'boolean',
						default: false,
						description: 'Include raw body in output',
					},
					{
						displayName: 'Include Headers',
						name: 'includeHeaders',
						type: 'boolean',
						default: true,
						description: 'Include request headers in output',
					},
					{
						displayName: 'Include Query Params',
						name: 'includeQueryParams',
						type: 'boolean',
						default: true,
						description: 'Include query parameters in output',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// This node is primarily triggered by webhooks
		// Process data from previous nodes if connected
		const items = this.getInputData();
		return [items];
	}

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const headers = this.getHeaders();
		const query = this.getAllQueryParameters();
		const req = this.getRequestObject();

		const authentication = this.getNodeParameter('authentication', 0) as string;
		const responseMode = this.getNodeParameter('responseMode', 0) as string;
		const options = this.getNodeParameter('options', 0) as {
			parseBody?: boolean;
			rawBody?: boolean;
			includeHeaders?: boolean;
			includeQueryParams?: boolean;
		};

		// Validate authentication
		try {
			this.validateAuthentication(authentication, headers);
		} catch (error) {
			if (error instanceof NodeOperationError) {
				return {
					statusCode: 401,
					body: {
						success: false,
						error: 'Authentication failed',
					},
					headers: {
						'Content-Type': 'application/json',
					},
				};
			}
			throw error;
		}

		// Prepare output data
		const outputData: IDataObject = {
			method: req.method,
			path: req.path,
		};

		// Include headers
		if (options.includeHeaders !== false) {
			outputData.headers = headers;
		}

		// Include query parameters
		if (options.includeQueryParams !== false) {
			outputData.query = query;
		}

		// Parse body
		if (options.rawBody) {
			outputData.body = this.getBody();
		}

		if (options.parseBody !== false && body) {
			try {
				if (typeof body === 'string') {
					try {
						outputData.json = JSON.parse(body);
					} catch {
						outputData.body = body;
					}
				} else {
					outputData.json = body;
				}
			} catch (error) {
				outputData.body = body;
			}
		}

		// Return response
		if (responseMode === 'onReceived') {
			const responseCode = this.getNodeParameter('responseCode', 0) as number;
			const responseBody = this.getNodeParameter('responseBody', 0) as string;
			const responseHeaders = this.getNodeParameter('responseHeaders', 0) as string;

			let parsedBody: any = responseBody;
			try {
				parsedBody = JSON.parse(responseBody);
			} catch {
				// Keep as string
			}

			let parsedHeaders: any = { 'Content-Type': 'application/json' };
			try {
				parsedHeaders = JSON.parse(responseHeaders);
			} catch {
				// Keep default
			}

			return {
				statusCode: responseCode,
				body: parsedBody,
				headers: parsedHeaders,
			};
		}

		// Return data to be processed by workflow
		return {
			workflowData: [
				{
					json: outputData,
				},
			],
		};
	}

	private validateAuthentication(authentication: string, headers: IDataObject): void {
		switch (authentication) {
			case 'none':
				return;

			case 'apiKey': {
				const apiKey = this.getNodeParameter('apiKey', 0) as string;
				const requestApiKey = headers['x-api-key'] as string;

				if (!requestApiKey || requestApiKey !== apiKey) {
					throw new NodeOperationError(this.getNode(), 'Invalid API key');
				}
				break;
			}

			case 'bearerToken': {
				const token = this.getNodeParameter('token', 0) as string;
				const authHeader = headers['authorization'] as string;

				if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== token) {
					throw new NodeOperationError(this.getNode(), 'Invalid bearer token');
				}
				break;
			}

			case 'basicAuth': {
				const username = this.getNodeParameter('username', 0) as string;
				const password = this.getNodeParameter('password', 0) as string;
				const authHeader = headers['authorization'] as string;

				if (!authHeader || !authHeader.startsWith('Basic ')) {
					throw new NodeOperationError(this.getNode(), 'Missing basic auth header');
				}

				const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
				const [requestUsername, requestPassword] = credentials.split(':');

				if (requestUsername !== username || requestPassword !== password) {
					throw new NodeOperationError(this.getNode(), 'Invalid basic auth credentials');
				}
				break;
			}

			case 'customHeader': {
				const headerName = this.getNodeParameter('customHeaderName', 0) as string;
				const headerValue = this.getNodeParameter('customHeaderValue', 0) as string;
				const requestHeaderValue = headers[headerName.toLowerCase()] as string;

				if (!requestHeaderValue || requestHeaderValue !== headerValue) {
					throw new NodeOperationError(this.getNode(), `Invalid ${headerName} header`);
				}
				break;
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown authentication type: ${authentication}`);
		}
	}
}
