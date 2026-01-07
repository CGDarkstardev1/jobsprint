import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeApiError,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

/**
 * Jobsprint Puter Storage Node - Cloud Storage Integration
 *
 * Provides cloud storage operations through Puter.js
 * Supports file upload, download, delete, list, and metadata operations
 */
export class JobsprintPuterStorage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jobsprint Puter Storage',
		name: 'jobsprintPuterStorage',
		icon: 'file:puter.svg',
		group: ['input'],
		version: 1,
		description: 'Interact with Puter.js cloud storage',
		defaults: {
			name: 'Jobsprint Puter Storage',
			color: '#5D9CEC',
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
						name: 'File',
						value: 'file',
					},
					{
						name: 'Folder',
						value: 'folder',
					},
				],
				default: 'file',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Upload',
						value: 'upload',
						description: 'Upload a file',
					},
					{
						name: 'Download',
						value: 'download',
						description: 'Download a file',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a file',
					},
					{
						name: 'Get Metadata',
						value: 'metadata',
						description: 'Get file metadata',
					},
				],
				default: 'upload',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['folder'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a folder',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List folder contents',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a folder',
					},
				],
				default: 'list',
			},
			{
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['upload', 'download', 'delete', 'metadata'],
					},
				},
				default: '',
				placeholder: '/path/to/file.txt',
				required: true,
				description: 'Path to the file in Puter storage',
			},
			{
				displayName: 'File Content',
				name: 'fileContent',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['upload'],
					},
				},
				default: '',
				placeholder: 'File content or binary data',
				description: 'Content to upload (can be text or base64)',
			},
			{
				displayName: 'Encoding',
				name: 'encoding',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['upload'],
					},
				},
				options: [
					{
						name: 'UTF-8 (Text)',
						value: 'utf8',
					},
					{
						name: 'Base64 (Binary)',
						value: 'base64',
					},
				],
				default: 'utf8',
			},
			{
				displayName: 'Folder Path',
				name: 'folderPath',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['create', 'delete', 'list'],
					},
				},
				default: '',
				placeholder: '/path/to/folder',
				required: true,
				description: 'Path to the folder in Puter storage',
			},
			{
				displayName: 'Recursive',
				name: 'recursive',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['list'],
					},
				},
				default: false,
				description: 'List files recursively',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Get credentials
		const credentials = await this.getCredentials('jobsprintApi');
		const apiUrl = credentials.apiUrl as string;
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				if (resource === 'file') {
					const filePath = this.getNodeParameter('filePath', i) as string;

					if (!filePath || filePath.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'File path is required',
							{ itemIndex: i },
						);
					}

					if (operation === 'upload') {
						const fileContent = this.getNodeParameter('fileContent', i) as string;
						const encoding = this.getNodeParameter('encoding', i) as string;

						if (!fileContent && fileContent !== '') {
							throw new NodeOperationError(
								this.getNode(),
								'File content is required for upload',
								{ itemIndex: i },
							);
						}

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${apiUrl}/storage/files`,
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${apiKey}`,
							},
							body: {
								path: filePath,
								content: fileContent,
								encoding,
							},
							json: true,
						});

					} else if (operation === 'download') {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${apiUrl}/storage/files`,
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs: {
								path: filePath,
							},
							json: true,
						});

					} else if (operation === 'delete') {
						responseData = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${apiUrl}/storage/files`,
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${apiKey}`,
							},
							body: {
								path: filePath,
							},
							json: true,
						});

					} else if (operation === 'metadata') {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${apiUrl}/storage/files/metadata`,
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs: {
								path: filePath,
							},
							json: true,
						});
					}

					returnData.push({
						json: {
							resource: 'file',
							operation,
							path: filePath,
							result: responseData,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});

				} else if (resource === 'folder') {
					const folderPath = this.getNodeParameter('folderPath', i) as string;

					if (!folderPath || folderPath.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Folder path is required',
							{ itemIndex: i },
						);
					}

					if (operation === 'create') {
						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${apiUrl}/storage/folders`,
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${apiKey}`,
							},
							body: {
								path: folderPath,
							},
							json: true,
						});

					} else if (operation === 'list') {
						const recursive = this.getNodeParameter('recursive', i) as boolean;

						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${apiUrl}/storage/folders`,
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs: {
								path: folderPath,
								recursive,
							},
							json: true,
						});

					} else if (operation === 'delete') {
						responseData = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${apiUrl}/storage/folders`,
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${apiKey}`,
							},
							body: {
								path: folderPath,
							},
							json: true,
						});
					}

					returnData.push({
						json: {
							resource: 'folder',
							operation,
							path: folderPath,
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
