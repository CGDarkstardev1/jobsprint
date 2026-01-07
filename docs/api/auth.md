# Authentication API

Manage user authentication and API tokens.

## Authentication Overview

Jobsprint uses JWT (JSON Web Token) based authentication. All API requests (except authentication endpoints) require a valid JWT token in the `Authorization` header.

## Token Types

### Access Token

- Short-lived token (15 minutes)
- Used for API requests
- Cannot be revoked
- Automatically refreshed by refresh token

### Refresh Token

- Long-lived token (30 days)
- Used to obtain new access tokens
- Can be revoked
- Should be stored securely

### API Token

- Long-lived token (configurable expiration)
- Used for server-to-server authentication
- Can be managed and revoked
- Associated with specific scopes

## Login

Authenticate with email and password.

```http
POST /v1/auth/login
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### Request Example

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "your-password"
     }' \
     https://api.jobsprint.io/v1/auth/login
```

### Response Example

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

## Register

Create a new user account.

```http
POST /v1/auth/register
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Request Example

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "SecureP@ssw0rd",
       "name": "John Doe"
     }' \
     https://api.jobsprint.io/v1/auth/register
```

### Response Example

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_new123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-06T00:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

## Refresh Token

Obtain a new access token using a refresh token.

```http
POST /v1/auth/refresh
```

### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Request Example

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }' \
     https://api.jobsprint.io/v1/auth/refresh
```

### Response Example

```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

## Logout

Invalidate the current refresh token.

```http
POST /v1/auth/logout
```

### Request Headers

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.jobsprint.io/v1/auth/logout
```

### Response Example

```json
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```

## Forgot Password

Initiate password reset process.

```http
POST /v1/auth/forgot-password
```

### Request Body

```json
{
  "email": "user@example.com"
}
```

### Request Example

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com"
     }' \
     https://api.jobsprint.io/v1/auth/forgot-password
```

### Response Example

```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

## Reset Password

Reset password using a reset token.

```http
POST /v1/auth/reset-password
```

### Request Body

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecureP@ssw0rd"
}
```

### Request Example

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "token": "reset_token_from_email",
       "password": "NewSecureP@ssw0rd"
     }' \
     https://api.jobsprint.io/v1/auth/reset-password
```

### Response Example

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

## Change Password

Change password for authenticated user.

```http
POST /v1/auth/change-password
```

### Request Headers

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Request Body

```json
{
  "currentPassword": "old-password",
  "newPassword": "NewSecureP@ssw0rd"
}
```

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "currentPassword": "old-password",
       "newPassword": "NewSecureP@ssw0rd"
     }' \
     https://api.jobsprint.io/v1/auth/change-password
```

### Response Example

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

## Get Current User

Get information about the authenticated user.

```http
GET /v1/auth/me
```

### Request Headers

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.jobsprint.io/v1/auth/me
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "pro",
    "createdAt": "2025-01-01T00:00:00Z",
    "settings": {
      "timezone": "UTC",
      "dateFormat": "YYYY-MM-DD"
    }
  }
}
```

## API Tokens

### List API Tokens

Get all API tokens for the authenticated user.

```http
GET /v1/auth/tokens
```

### Request Headers

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Request Example

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.jobsprint.io/v1/auth/tokens
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": "tok_abc123",
      "name": "Production API Token",
      "token": "jps_live_abc123...",
      "scopes": [
        "read:workflows",
        "write:workflows",
        "execute:workflows"
      ],
      "lastUsed": "2025-01-06T12:00:00Z",
      "expiresAt": "2025-02-06T00:00:00Z",
      "createdAt": "2025-01-06T00:00:00Z"
    }
  ]
}
```

### Create API Token

Create a new API token.

```http
POST /v1/auth/tokens
```

### Request Body

```json
{
  "name": "Development Token",
  "scopes": [
    "read:workflows",
    "write:workflows"
  ],
  "expiresIn": 2592000
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Token name |
| scopes | array | Yes | Array of scope strings |
| expiresIn | integer | No | Expiration time in seconds (default: 30 days) |

### Available Scopes

- `read:workflows` - Read workflow definitions
- `write:workflows` - Create and modify workflows
- `execute:workflows` - Execute workflows
- `read:executions` - Read execution history
- `manage:integrations` - Manage third-party integrations
- `admin:all` - Full administrative access

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Development Token",
       "scopes": ["read:workflows", "write:workflows"],
       "expiresIn": 2592000
     }' \
     https://api.jobsprint.io/v1/auth/tokens
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "tok_new123",
    "name": "Development Token",
    "token": "jps_live_xyz789...",
    "scopes": [
      "read:workflows",
      "write:workflows"
    ],
    "expiresAt": "2025-02-06T00:00:00Z",
    "createdAt": "2025-01-06T00:00:00Z"
  }
}
```

### Revoke API Token

Revoke an API token.

```http
DELETE /v1/auth/tokens/:tokenId
```

### Request Headers

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Request Example

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.jobsprint.io/v1/auth/tokens/tok_abc123
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "tok_abc123",
    "revoked": true
  }
}
```
