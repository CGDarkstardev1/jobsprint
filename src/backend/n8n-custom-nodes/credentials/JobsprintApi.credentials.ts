import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class JobsprintApi implements ICredentialType {
	name = 'jobsprintApi';
	displayName = 'Jobsprint API';
	documentationUrl = 'https://jobsprint.ai/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://api.jobsprint.ai',
			required: true,
			description: 'Base URL for Jobsprint API',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Jobsprint API key for authentication',
		},
	];

	async authenticate(
		this: IAuthenticateGeneric,
		credentials: { apiUrl: string; apiKey: string },
	): Promise<void> {
		const requestOptions = {
			method: 'GET',
			uri: `${credentials.apiUrl}/auth/verify`,
			headers: {
				Authorization: `Bearer ${credentials.apiKey}`,
			},
			json: true,
		};

		await this.helpers.request(requestOptions);
	}

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{$credentials.apiUrl}}/auth/verify',
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}
