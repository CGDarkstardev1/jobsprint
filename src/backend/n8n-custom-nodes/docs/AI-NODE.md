# Jobsprint AI Node Documentation

## Overview

The Jobsprint AI node provides access to free AI models through Puter.js integration, supporting GPT-3.5-turbo, Code-Davinci, and Text-Davinci models.

## Features

- **Multiple Operations**: Chat completions, code completions, and text completions
- **Model Selection**: Choose from GPT-3.5-turbo, Code-Davinci-002, or Text-Davinci-003
- **Configurable Parameters**: Control max tokens, temperature, and more
- **Error Handling**: Robust error handling with continue-on-fail support
- **Streaming Support**: Built-in response parsing and validation

## Operations

### 1. Chat Completion

Generate conversational responses using chat models.

**Parameters:**
- `model`: `gpt-3.5-turbo` (recommended for chat)
- `messages`: Array of message objects with `role` and `content`
  - Roles: `system`, `user`, `assistant`
- `maxTokens`: 1-4096 (default: 1000)
- `temperature`: 0.0-2.0 (default: 0.7)

**Example:**

```json
{
  "operation": "chat",
  "model": "gpt-3.5-turbo",
  "messages": {
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant specializing in data analysis."
      },
      {
        "role": "user",
        "content": "Analyze this sales data and provide insights."
      }
    ]
  },
  "maxTokens": 1500,
  "temperature": 0.7
}
```

**Response:**

```json
{
  "model": "gpt-3.5-turbo",
  "operation": "chat",
  "response": "Based on the sales data analysis...",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 200,
    "total_tokens": 250
  },
  "finishReason": "stop",
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

### 2. Code Completion

Generate code completions and suggestions.

**Parameters:**
- `model`: `code-davinci-002` (recommended for code)
- `prompt`: Code context or description
- `maxTokens`: 1-4096 (default: 1000)
- `temperature`: 0.0-2.0 (default: 0.5, lower for more deterministic code)

**Example:**

```json
{
  "operation": "code",
  "model": "code-davinci-002",
  "prompt": "// Write a function to calculate fibonacci numbers\nfunction fibonacci(n) {\n",
  "maxTokens": 500,
  "temperature": 0.3
}
```

**Response:**

```json
{
  "model": "code-davinci-002",
  "operation": "code",
  "response": "  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}",
  "usage": {
    "prompt_tokens": 30,
    "completion_tokens": 50,
    "total_tokens": 80
  },
  "finishReason": "stop"
}
```

### 3. Text Completion

Generate text completions for various use cases.

**Parameters:**
- `model`: `text-davinci-003` (recommended for text)
- `prompt`: Text prompt or context
- `maxTokens`: 1-4096 (default: 1000)
- `temperature`: 0.0-2.0 (default: 0.7)

**Example:**

```json
{
  "operation": "text",
  "model": "text-davinci-003",
  "prompt": "Write a product description for an AI-powered automation platform:",
  "maxTokens": 500,
  "temperature": 0.8
}
```

**Advanced Options**

Additional parameters available under the `options` field:

- `topP`: 0.0-1.0 (default: 1) - Nucleus sampling
- `frequencyPenalty`: -2.0 to 2.0 (default: 0) - Decrease repetition
- `presencePenalty`: -2.0 to 2.0 (default: 0) - Encourage new topics

**Example with Advanced Options:**

```json
{
  "operation": "chat",
  "model": "gpt-3.5-turbo",
  "messages": {
    "messages": [
      {
        "role": "user",
        "content": "Generate creative marketing copy"
      }
    ]
  },
  "maxTokens": 1000,
  "temperature": 0.9,
  "options": {
    "topP": 0.9,
    "frequencyPenalty": 0.5,
    "presencePenalty": 0.5
  }
}
```

## Workflow Examples

### Example 1: AI Content Generation Pipeline

```
Webhook Handler → Jobsprint AI → Puter Storage (Save)
```

1. Receive content request via webhook
2. Generate content using AI
3. Save to cloud storage

**Webhook Payload:**
```json
{
  "topic": "artificial intelligence",
  "format": "blog post",
  "length": "1000 words"
}
```

**AI Node Configuration:**
```json
{
  "operation": "text",
  "model": "text-davinci-003",
  "prompt": "=Write a {{ $json.format }} about {{ $json.topic }}",
  "maxTokens": 2000,
  "temperature": 0.7
}
```

### Example 2: Code Review Assistant

```
Git Webhook → Jobsprint AI → Slack Notification
```

1. Receive push event from Git
2. Analyze code changes with AI
3. Post review summary to Slack

**AI Node Configuration:**
```json
{
  "operation": "code",
  "model": "code-davinci-002",
  "prompt": "=Review this code for bugs and improvements:\n\n{{ $json.diff }}",
  "maxTokens": 1000,
  "temperature": 0.3
}
```

### Example 3: Customer Support Chatbot

```
Webhook (User Message) → Jobsprint AI (Chat) → Zapier (Send Response)
```

1. Receive customer message
2. Generate AI response
3. Send via communication channel

**AI Node Configuration:**
```json
{
  "operation": "chat",
  "model": "gpt-3.5-turbo",
  "messages": {
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful customer support agent for Jobsprint. Be friendly and professional."
      },
      {
        "role": "user",
        "content": "={{ $json.message }}"
      }
    ]
  },
  "maxTokens": 500,
  "temperature": 0.7
}
```

## Best Practices

### Temperature Settings

- **0.0 - 0.3**: Deterministic, factual responses (code, data extraction)
- **0.4 - 0.7**: Balanced creativity and coherence (general use)
- **0.8 - 1.0**: Highly creative (creative writing, brainstming)
- **1.1 - 2.0**: Very experimental (rarely needed)

### Token Management

- Reserve ~100 tokens for system overhead
- Calculate: `prompt_tokens + max_tokens ≤ 4096`
- Monitor `usage` field in response to track consumption

### Prompt Engineering

**System Prompts:**
```
Good: "You are a helpful assistant specializing in technical documentation."
Bad: "Be helpful."
```

**User Prompts:**
```
Good: "Summarize this data in 3 bullet points: {{ $json.data }}"
Bad: "Summarize this"
```

### Error Handling

Enable **Continue On Fail** in workflow settings to handle API errors gracefully:

```json
{
  "error": "API rate limit exceeded",
  "model": "gpt-3.5-turbo",
  "operation": "chat",
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

## Limitations

- **Max Tokens**: 4096 per request
- **Rate Limits**: Applies per API key
- **Model Availability**: Free models may have queue times
- **Context Window**: Shared across all messages in chat

## Troubleshooting

### "Max tokens must be between 1 and 4096"

Reduce `maxTokens` value or split into multiple requests.

### "Temperature must be between 0 and 2"

Ensure temperature is within valid range (0.0-2.0).

### "At least one message is required for chat completion"

Provide at least one message in the `messages` array.

### Empty Responses

- Check if `finishReason` is `length` (need more tokens)
- Increase `maxTokens` parameter
- Verify prompt is not empty

## API Reference

### Endpoints

- `POST /ai/chat` - Chat completions
- `POST /ai/completion` - Text/code completions

### Authentication

Include Jobsprint API credentials in node configuration:

```
API URL: https://api.jobsprint.ai
API Key: Your API key
```

### Response Format

```typescript
interface AIResponse {
  model: string;
  operation: string;
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter';
  timestamp: string;
}
```

## See Also

- [Jobsprint Puter Storage Node](./PUTER-STORAGE-NODE.md)
- [Jobsprint Zapier Node](./ZAPIER-NODE.md)
- [Jobsprint Documentation](https://jobsprint.ai/docs)
