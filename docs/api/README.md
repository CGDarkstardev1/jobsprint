# Jobsprint API Reference

Welcome to the Jobsprint API documentation. This section provides comprehensive information about all available APIs, endpoints, request/response schemas, authentication methods, and error handling.

## API Overview

Jobsprint provides a RESTful API for managing AI-powered automation workflows. The API is built on top of Puter.js and integrates with Zapier MCP and n8n for workflow execution.

### Base URL

```
Production: https://api.jobsprint.io/v1
Development: http://localhost:5678/v1
```

### API Versioning

The API is versioned using the URL path. The current version is `v1`. Major versions may be introduced in the future with backward-incompatible changes.

## Authentication

Jobsprint uses JWT (JSON Web Token) based authentication. Include your API token in the `Authorization` header of your requests.

### Getting an API Token

1. Sign up for a Jobsprint account
2. Navigate to Settings > API Tokens
3. Generate a new token
4. Store it securely - you won't be able to see it again

### Using the API Token

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.jobsprint.io/v1/workflows
```

### Token Scopes

Tokens can be created with specific scopes:

- `read:workflows` - Read workflow definitions
- `write:workflows` - Create and modify workflows
- `execute:workflows` - Execute workflows
- `read:executions` - Read execution history
- `manage:integrations` - Manage third-party integrations
- `admin:all` - Full administrative access

## API Response Format

All API responses follow a consistent JSON format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "requestId": "req_1234567890",
    "timestamp": "2025-01-06T00:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  },
  "meta": {
    "requestId": "req_1234567890",
    "timestamp": "2025-01-06T00:00:00Z"
  }
}
```

## Common Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions for the requested operation |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | API rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

API requests are rate limited based on your plan:

- **Free**: 100 requests/hour
- **Pro**: 1,000 requests/hour
- **Enterprise**: 10,000 requests/hour

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641436800
```

## Pagination

List endpoints support pagination using cursor-based pagination:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api.jobsprint.io/v1/workflows?limit=20&after=cursor_abc123"
```

### Pagination Parameters

- `limit` (optional, default: 20, max: 100) - Number of items per page
- `after` (optional) - Cursor for the next page
- `before` (optional) - Cursor for the previous page

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "nextCursor": "cursor_xyz789",
    "previousCursor": "cursor_abc123",
    "hasMore": true
  }
}
```

## SDKs and Libraries

Official SDKs are available for:

- **JavaScript/TypeScript** - `@jobsprint/sdk`
- **Python** - `jobsprint-python`
- **Go** - `github.com/jobsprint/go-sdk`

See the [SDK Documentation](./sdk.md) for detailed usage examples.

## Webhooks

Jobsprint can send webhook notifications when events occur. See the [Webhook Documentation](./webhooks.md) for details on setting up and managing webhooks.

## API Endpoints

- [Authentication](./auth.md) - User authentication and token management
- [Workflows](./workflows.md) - Workflow CRUD operations
- [Executions](./executions.md) - Workflow execution management
- [Integrations](./integrations.md) - Third-party integrations
- [AI Services](./ai.md) - AI model endpoints
- [Webhooks](./webhooks.md) - Webhook management

## Support

For API support and questions:

- Documentation: https://docs.jobsprint.io
- GitHub Issues: https://github.com/jobsprint/jobsprint/issues
- Email: api-support@jobsprint.io
- Community Discord: https://discord.gg/jobsprint
