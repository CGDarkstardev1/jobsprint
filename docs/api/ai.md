# AI Services API

Interact with AI models for natural language processing, code generation, and other AI capabilities.

## AI Models Overview

Jobsprint provides access to several free AI models through Puter.js:

### Available Models

| Model | Type | Max Tokens | Best For |
|-------|------|------------|----------|
| `gpt-3.5-turbo-free` | Chat | 4,096 | General conversations, text generation |
| `code-davinci-free` | Code | 8,192 | Code generation, debugging |
| `text-davinci-free-002` | Text | 4,096 | Text completion, summarization |

## Chat Completion

Generate chat-style responses using conversation context.

```http
POST /v1/ai/chat
```

### Request Body

```json
{
  "model": "gpt-3.5-turbo-free",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 500
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | AI model to use |
| messages | array | Yes | Conversation messages |
| temperature | number | No | Sampling temperature (0-2, default: 0.7) |
| maxTokens | integer | No | Maximum tokens to generate (default: 500) |
| stop | array | No | Sequences where generation should stop |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "gpt-3.5-turbo-free",
       "messages": [
         {
           "role": "system",
           "content": "You are a helpful assistant specializing in workflow automation."
         },
         {
           "role": "user",
           "content": "How do I create a workflow that sends an email when a webhook is received?"
         }
       ],
       "temperature": 0.7,
       "maxTokens": 500
     }' \
     https://api.jobsprint.io/v1/ai/chat
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "chatcmpl_abc123",
    "model": "gpt-3.5-turbo-free",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "To create a workflow that sends an email when a webhook is received, follow these steps:\n\n1. Create a new workflow\n2. Add a Webhook trigger node\n3. Add an Email action node\n4. Connect the webhook trigger to the email action\n5. Configure the email template\n6. Activate the workflow\n\nWould you like me to provide more details on any of these steps?"
        },
        "finishReason": "stop"
      }
    ],
    "usage": {
      "promptTokens": 45,
      "completionTokens": 87,
      "totalTokens": 132
    }
  }
}
```

## Text Completion

Generate text completions based on a prompt.

```http
POST /v1/ai/completions
```

### Request Body

```json
{
  "model": "text-davinci-free-002",
  "prompt": "Write a professional email to a client about a delay in delivery:",
  "temperature": 0.7,
  "maxTokens": 300,
  "n": 1
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | AI model to use |
| prompt | string | Yes | Text prompt |
| temperature | number | No | Sampling temperature (0-2, default: 0.7) |
| maxTokens | integer | No | Maximum tokens to generate (default: 300) |
| n | integer | No | Number of completions to generate (default: 1) |
| stop | array | No | Sequences where generation should stop |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "text-davinci-free-002",
       "prompt": "Write a professional email to a client about a delay in delivery:",
       "temperature": 0.7,
       "maxTokens": 300
     }' \
     https://api.jobsprint.io/v1/ai/completions
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "cmpl_abc123",
    "model": "text-davinci-free-002",
    "choices": [
      {
        "index": 0,
        "text": "\n\nDear [Client Name],\n\nI hope this email finds you well. I am writing to inform you about an unexpected delay in the delivery of your order.\n\nDue to unforeseen circumstances in our supply chain, your shipment will be delayed by approximately 3-5 business days. We sincerely apologize for this inconvenience and want to assure you that we are doing everything possible to expedite your order.\n\nWe value your business and appreciate your understanding. If you have any questions or concerns, please don't hesitate to reach out.\n\nBest regards,\n[Your Name]",
        "finishReason": "stop"
      }
    ],
    "usage": {
      "promptTokens": 15,
      "completionTokens": 132,
      "totalTokens": 147
    }
  }
}
```

## Code Generation

Generate or complete code snippets.

```http
POST /v1/ai/code
```

### Request Body

```json
{
  "model": "code-davinci-free",
  "prompt": "Write a JavaScript function to validate email addresses:",
  "language": "javascript",
  "temperature": 0.3,
  "maxTokens": 500
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | AI model to use |
| prompt | string | Yes | Code prompt or incomplete code |
| language | string | No | Programming language for syntax highlighting |
| temperature | number | No | Sampling temperature (0-2, default: 0.3) |
| maxTokens | integer | No | Maximum tokens to generate (default: 500) |

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "code-davinci-free",
       "prompt": "Write a JavaScript function to validate email addresses using regex:",
       "language": "javascript",
       "temperature": 0.3,
       "maxTokens": 500
     }' \
     https://api.jobsprint.io/v1/ai/code
```

### Response Example

```json
{
  "success": true,
  "data": {
    "id": "codecmpl_abc123",
    "model": "code-davinci-free",
    "choices": [
      {
        "index": 0,
        "code": "function validateEmail(email) {\n  const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  return regex.test(email);\n}\n\n// Usage examples:\nconsole.log(validateEmail('user@example.com')); // true\nconsole.log(validateEmail('invalid.email')); // false\nconsole.log(validateEmail('user@')); // false",
        "language": "javascript",
        "finishReason": "stop"
      }
    ],
    "usage": {
      "promptTokens": 22,
      "completionTokens": 89,
      "totalTokens": 111
    }
  }
}
```

## Text Embedding

Generate vector embeddings for text semantic search.

```http
POST /v1/ai/embeddings
```

### Request Body

```json
{
  "text": "The quick brown fox jumps over the lazy dog"
}
```

### Request Example

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "text": "Workflow automation saves time and reduces errors"
     }' \
     https://api.jobsprint.io/v1/ai/embeddings
```

### Response Example

```json
{
  "success": true,
  "data": {
    "embedding": [
      0.0023,
      -0.0234,
      0.1234,
      // ... more values (total: 1536 dimensions)
    ],
    "model": "text-embedding-ada-002",
    "usage": {
      "promptTokens": 8,
      "totalTokens": 8
    }
  }
}
```

## Image Generation (Future)

Generate images from text descriptions (coming soon).

```http
POST /v1/ai/images/generations
```

### Request Body

```json
{
  "prompt": "A futuristic city at sunset",
  "n": 1,
  "size": "1024x1024"
}
```

## Voice to Text (Future)

Convert audio recordings to text (coming soon).

```http
POST /v1/ai/audio/transcriptions
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | file | Yes | Audio file to transcribe |
| language | string | No | Language code (default: en) |
| model | string | No | Model to use (default: whisper-free) |

## Best Practices

### 1. Prompt Engineering

Use clear, specific prompts to get better results:

```json
{
  "prompt": "You are a workflow automation expert. Explain how to create a workflow that:\n1. Triggers on a schedule\n2. Fetches data from an API\n3. Processes the data with AI\n4. Sends results via email\n\nProvide step-by-step instructions."
}
```

### 2. Temperature Settings

- **0.0-0.3**: More deterministic, factual responses
- **0.4-0.7**: Balanced creativity and coherence
- **0.8-2.0**: More creative, random responses

### 3. Token Management

Monitor token usage to avoid exceeding limits:

```json
{
  "maxTokens": 500,
  "messages": [
    {
      "role": "user",
      "content": "Keep your response under 500 tokens."
    }
  ]
}
```

### 4. Error Handling

Implement proper error handling:

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-3.5-turbo-free","messages":[]}' \
     https://api.jobsprint.io/v1/ai/chat
```

Error Response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Messages array cannot be empty"
  }
}
```

### 5. Cost Optimization

- Use appropriate maxTokens limits
- Cache responses when possible
- Choose the right model for your use case
- Implement request batching for similar prompts

## Rate Limits

AI endpoints have specific rate limits:

- **Free Plan**: 100 requests/day, 10,000 tokens/day
- **Pro Plan**: 1,000 requests/day, 100,000 tokens/day
- **Enterprise**: 10,000 requests/day, 1,000,000 tokens/day

## Code Examples

### JavaScript/Node.js

```javascript
const response = await fetch('https://api.jobsprint.io/v1/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo-free',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ]
  })
});

const data = await response.json();
console.log(data.data.choices[0].message.content);
```

### Python

```python
import requests

response = requests.post(
    'https://api.jobsprint.io/v1/ai/chat',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'gpt-3.5-turbo-free',
        'messages': [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': 'Hello!'}
        ]
    }
)

data = response.json()
print(data['data']['choices'][0]['message']['content'])
```
