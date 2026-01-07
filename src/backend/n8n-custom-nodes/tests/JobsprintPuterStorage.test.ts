import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { JobsprintPuterStorage } from '../nodes/JobsprintPuterStorage.node';
import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
	NodeApiError,
} from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
}));

describe('JobsprintPuterStorage Node', () => {
	let node: JobsprintPuterStorage;
	let mockContext: Partial<IExecuteFunctions>;

	beforeEach(() => {
		node = new JobsprintPuterStorage();

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
			expect(node.description.displayName).toBe('Jobsprint Puter Storage');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('jobsprintPuterStorage');
		});

		it('should support file and folder resources', () => {
			const resourceOptions = node.description.properties.find(
				(prop: any) => prop.name === 'resource',
			);
			expect(resourceOptions).toBeDefined();
			expect(resourceOptions.options).toHaveLength(2);
		});
	});

	describe('File Operations', () => {
		describe('Upload File', () => {
			it('should upload file successfully with UTF-8 encoding', async () => {
				const mockResponse = {
					success: true,
					fileId: 'file-123',
					path: '/test.txt',
				};

				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'file',
						operation: 'upload',
						filePath: '/test.txt',
						fileContent: 'Hello, World!',
						encoding: 'utf8',
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				const result = await executeWithContext();

				expect(result[0][0].json.resource).toBe('file');
				expect(result[0][0].json.operation).toBe('upload');
				expect(result[0][0].json.result).toEqual(mockResponse);

				expect(mockContext.helpers?.httpRequest).toHaveBeenCalledWith({
					method: 'POST',
					url: 'https://api.jobsprint.ai/storage/files',
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer test-api-key',
					},
					body: {
						path: '/test.txt',
						content: 'Hello, World!',
						encoding: 'utf8',
					},
					json: true,
				});
			});

			it('should upload file with base64 encoding', async () => {
				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'file',
						operation: 'upload',
						filePath: '/image.png',
						fileContent: 'base64encodeddata',
						encoding: 'base64',
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue({ success: true });

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				await executeWithContext();

				expect(mockContext.helpers?.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						body: expect.objectContaining({
							encoding: 'base64',
						}),
					}),
				);
			});

			it('should throw error if file path is empty', async () => {
				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'file',
						operation: 'upload',
						filePath: '',
						fileContent: 'content',
						encoding: 'utf8',
					};
					return params[name];
				});

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

				await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
				await expect(executeWithContext()).rejects.toThrow('File path is required');
			});
		});

		describe('Download File', () => {
			it('should download file successfully', async () => {
				const mockResponse = {
					content: 'file content here',
					metadata: {
						size: 1024,
						contentType: 'text/plain',
					},
				};

				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'file',
						operation: 'download',
						filePath: '/test.txt',
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				const result = await executeWithContext();

				expect(result[0][0].json.operation).toBe('download');
				expect(result[0][0].json.result).toEqual(mockResponse);
			});
		});

		describe('Delete File', () => {
			it('should delete file successfully', async () => {
				const mockResponse = {
					success: true,
					message: 'File deleted',
				};

				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'file',
						operation: 'delete',
						filePath: '/test.txt',
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				const result = await executeWithContext();

				expect(result[0][0].json.operation).toBe('delete');
				expect(mockContext.helpers?.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'DELETE',
					}),
				);
			});
		});

		describe('Get File Metadata', () => {
			it('should get file metadata successfully', async () => {
				const mockResponse = {
					name: 'test.txt',
					size: 1024,
					contentType: 'text/plain',
					createdAt: '2024-01-06T00:00:00Z',
				};

				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'file',
						operation: 'metadata',
						filePath: '/test.txt',
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				const result = await executeWithContext();

				expect(result[0][0].json.operation).toBe('metadata');
				expect(result[0][0].json.result).toEqual(mockResponse);
			});
		});
	});

	describe('Folder Operations', () => {
		describe('Create Folder', () => {
			it('should create folder successfully', async () => {
				const mockResponse = {
					success: true,
					folderId: 'folder-123',
					path: '/new-folder',
				};

				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'folder',
						operation: 'create',
						folderPath: '/new-folder',
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				const result = await executeWithContext();

				expect(result[0][0].json.resource).toBe('folder');
				expect(result[0][0].json.operation).toBe('create');
			});

			it('should throw error if folder path is empty', async () => {
				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'folder',
						operation: 'create',
						folderPath: '',
					};
					return params[name];
				});

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);

				await expect(executeWithContext()).rejects.toThrow(NodeOperationError);
				await expect(executeWithContext()).rejects.toThrow('Folder path is required');
			});
		});

		describe('List Folder', () => {
			it('should list folder contents non-recursively', async () => {
				const mockResponse = {
					files: [
						{ name: 'file1.txt', size: 100 },
						{ name: 'file2.txt', size: 200 },
					],
					folders: [
						{ name: 'subfolder', itemCount: 5 },
					],
				};

				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'folder',
						operation: 'list',
						folderPath: '/my-folder',
						recursive: false,
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				const result = await executeWithContext();

				expect(result[0][0].json.operation).toBe('list');
				expect(result[0][0].json.result).toEqual(mockResponse);
			});

			it('should list folder contents recursively', async () => {
				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'folder',
						operation: 'list',
						folderPath: '/my-folder',
						recursive: true,
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue({ files: [] });

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				await executeWithContext();

				expect(mockContext.helpers?.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						qs: expect.objectContaining({
							recursive: true,
						}),
					}),
				);
			});
		});

		describe('Delete Folder', () => {
			it('should delete folder successfully', async () => {
				const mockResponse = {
					success: true,
					message: 'Folder deleted',
				};

				(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
					const params: Record<string, any> = {
						resource: 'folder',
						operation: 'delete',
						folderPath: '/old-folder',
					};
					return params[name];
				});

				(mockContext.helpers?.httpRequest as jest.Mock).mockResolvedValue(mockResponse);

				const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
				const result = await executeWithContext();

				expect(result[0][0].json.operation).toBe('delete');
			});
		});
	});

	describe('Error Handling', () => {
		it('should handle API errors with continueOnFail', async () => {
			const apiError = {
				message: 'Storage API Error',
				httpCode: '500',
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'file',
					operation: 'upload',
					filePath: '/test.txt',
					fileContent: 'content',
					encoding: 'utf8',
				};
				return params[name];
			});

			(mockContext.helpers?.httpRequest as jest.Mock).mockRejectedValue(apiError);
			(mockContext.continueOnFail as jest.Mock).mockReturnValue(true);

			const executeWithContext = node.execute.bind(mockContext as IExecuteFunctions);
			const result = await executeWithContext();

			expect(result[0][0].json.error).toBe('Storage API Error');
		});

		it('should throw NodeApiError for HTTP errors', async () => {
			const apiError = {
				message: 'Not Found',
				httpCode: '404',
			};

			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				const params: Record<string, any> = {
					resource: 'file',
					operation: 'download',
					filePath: '/nonexistent.txt',
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
