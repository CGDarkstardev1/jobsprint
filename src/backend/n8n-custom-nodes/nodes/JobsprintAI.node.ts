import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeApiError,
} from 'n8n-workflow';

/**
 * Jobsprint AI Node - AI Model Access
 *
 * Provides access to free AI models through Puter.js integration
 * Supports GPT-3.5-turbo, Code-Davinci, and Text-Davinci
 */
export class JobsprintAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jobsprint AI',
		name: 'jobsprintAI',
		icon: 'file:jobsprint.svg',
		group: ['transform'],
		version: 1,
		description: 'Access AI models through Jobsprint platform',
		defaults: {
			name: 'Jobsprint AI',
			color: '#FF6D5A',
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
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat Completion',
						value: 'chat',
						description: 'Generate chat completions',
					},
					{
						name: 'Code Completion',
						value: 'code',
						description: 'Generate code completions',
					},
					{
						name: 'Text Completion',
						value: 'text',
						description: 'Generate text completions',
					},
				],
				default: 'chat',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['chat', 'code', 'text'],
					},
				},
				options: [
					{
						name: 'GPT-3.5-Turbo',
						value: 'gpt-3.5-turbo',
					},
					{
						name: 'Code-Davinci-002',
						value: 'code-davinci-002',
					},
					{
						name: 'Text-Davinci-003',
						value: 'text-davinci-003',
					},
				],
				default: 'gpt-3.5-turbo',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						operation: ['text', 'code'],
					},
				},
				default: '',
				placeholder: 'Enter your prompt here...',
				description: 'The prompt to generate completion from',
			},
			{
				displayName: 'Messages',
				name: 'messages',
				placeholder: 'Add Message',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['chat'],
					},
				},
				description: 'Chat messages for conversation',
				default: '',
				options: [
					{
						name: 'messages',
						displayName: 'Messages',
						values: [
							{
								displayName: 'Role',
								name: 'role',
								type: 'options',
								options: [
									{
										name: 'System',
										value: 'system',
									},
									{
										name: 'User',
										value: 'user',
									},
									{
										name: 'Assistant',
										value: 'assistant',
									},
								],
								default: 'user',
							},
							{
								displayName: 'Content',
								name: 'content',
								type: 'string',
								typeOptions: {
									rows: 2,
								},
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Max Tokens',
				name: 'maxTokens',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['chat', 'code', 'text'],
					},
				},
				default: 1000,
				description: 'Maximum number of tokens to generate',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['chat', 'code', 'text'],
					},
				},
				default: 0.7,
				description: 'Controls randomness (0-2)',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['chat', 'code', 'text'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						default: 1,
						description: 'Nucleus sampling parameter',
					},
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						type: 'number',
						default: 0,
						description: 'Decrease likelihood of repetition',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						type: 'number',
						default: 0,
						description: 'Encourage new topics',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const operation = this.getNodeParameter('operation', 0) as string;
		const model = this.getNodeParameter('model', 0) as string;
		const maxTokens = this.getNodeParameter('maxTokens', 0) as number;
		const temperature = this.getNodeParameter('temperature', 0) as number;

		// Validate parameters
		if (maxTokens < 1 || maxTokens > 4096) {
			throw new NodeOperationError(
				this.getNode(),
				'Max tokens must be between 1 and 4096',
			);
		}

		if (temperature < 0 || temperature > 2) {
			throw new NodeOperationError(
				this.getNode(),
				'Temperature must be between 0 and 2',
			);
		}

		// Get credentials
		const credentials = await this.getCredentials('jobsprintApi');
		const apiUrl = credentials.apiUrl as string;
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				if (operation === 'chat') {
					const messages = this.getNodeParameter('messages', i) as {
						messages: Array<{ role: string; content: string }>;
					};

					if (!messages.messages || messages.messages.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'At least one message is required for chat completion',
							{ itemIndex: i },
						);
					}

					responseData = await this.helpers.httpRequest({
						method: 'POST',
						url: `${apiUrl}/ai/chat`,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`,
						},
						body: {
							model,
							messages: messages.messages,
							max_tokens: maxTokens,
							temperature,
						},
						json: true,
					});

				} else if (operation === 'code' || operation === 'text') {
					const prompt = this.getNodeParameter('prompt', i) as string;

					if (!prompt || prompt.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Prompt is required for completion',
							{ itemIndex: i },
						);
					}

					responseData = await this.helpers.httpRequest({
						method: 'POST',
						url: `${apiUrl}/ai/completion`,
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${apiKey}`,
						},
						body: {
							model,
							prompt,
							max_tokens: maxTokens,
							temperature,
						},
						json: true,
					});
				}

				returnData.push({
					json: {
						model,
						operation,
						response: responseData.choices?.[0]?.message?.content ||
								responseData.choices?.[0]?.text ||
								responseData.text ||
								'',
						usage: responseData.usage || {},
						finishReason: responseData.choices?.[0]?.finish_reason || 'unknown',
						timestamp: new Date().toISOString(),
					},
					pairedItem: { item: i },
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							model,
							operation,
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
}
