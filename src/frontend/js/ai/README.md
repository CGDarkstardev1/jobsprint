# AI Service Layer for Jobsprint

The AI service layer provides a unified interface for interacting with multiple AI models through Puter.js.

## Overview

The `AIService` class abstracts away the complexity of working with different AI models, providing:

- **Multiple Model Support**: GPT-3.5-turbo, Code-Davinci, Text-Davinci
- **Conversation Management**: Persistent conversation contexts
- **Prompt Templates**: Reusable prompt templates with variable substitution
- **Token Management**: Context window tracking and automatic truncation
- **Response Validation**: Flexible validation system for AI responses
- **Persistence**: Save and load conversations to cloud storage

## Installation

The AI service requires the PuterIntegration instance:

```javascript
import { AIService } from './ai/ai-service.js';
import { PuterIntegration } from './core/puter.js';

const puter = new PuterIntegration();
await puter.initialize();

const aiService = new AIService({
    puter: puter,
    defaultModel: 'gpt-3.5-turbo',
    maxTokens: 2000,
    temperature: 0.7,
    debugMode: true
});
```

## Usage

### Basic Chat

```javascript
// Simple chat message
const response = await aiService.chat('Hello, how are you?');
console.log(response.content);
// Response: {
//   content: "I'm doing well, thank you!",
//   model: 'gpt-3.5-turbo',
//   usage: { ... },
//   timestamp: '2025-01-06T...'
// }
```

### Conversation Context

```javascript
// Create conversation context
const conversationId = 'customer-support-123';

await aiService.chatInConversation(conversationId, 'My order is delayed');
const response1 = await aiService.chatInConversation(conversationId, 'When will it arrive?');

// Conversation history is maintained automatically
const conversation = aiService.getConversation(conversationId);
console.log(conversation.messages.length); // 4 messages (2 user + 2 assistant)

// Clear conversation when done
aiService.clearConversation(conversationId);
```

### Code Generation

```javascript
// Generate code using Code-Davinci model
const code = await aiService.generateCode('Write a function to validate email addresses in JavaScript');

console.log(code.content);
// function validateEmail(email) {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }
```

### Text Completion

```javascript
// Complete text using Text-Davinci
const completion = await aiService.complete('The quick brown fox');

console.log(completion.content);
// " jumps over the lazy dog."
```

### Prompt Templates

```javascript
// Create reusable prompt template
aiService.createPromptTemplate(
    'translation',
    'Translate the following text to {{language}}: "{{text}}"',
    {
        description: 'Translation template',
        category: 'translation'
    }
);

// Render template with variables
const prompt = aiService.renderTemplate('translation', {
    language: 'Spanish',
    text: 'Hello, world!'
});
// Output: "Translate the following text to Spanish: "Hello, world!""

// Use template in chat
const response = await aiService.chat(prompt);
```

### Token Management

```javascript
// Estimate tokens
const text = 'This is some text to estimate tokens for';
const estimate = aiService.estimateTokens(text);
console.log(`Estimated tokens: ${estimate}`);

// Check if prompt fits in context window
const fits = aiService.fitsInContextWindow('gpt-3.5-turbo', text);
console.log(`Fits in context: ${fits}`);

// Truncate if needed
const truncated = aiService.truncateToFit('gpt-3.5-turbo', longText, 1000);
```

### Response Validation

```javascript
// Validate response
const response = await aiService.chat('Generate a summary');

const validation = aiService.validateResponse(response, {
    minLength: 50,
    maxLength: 500,
    custom: (resp) => {
        // Custom validation logic
        if (!resp.content.includes('summary')) {
            return { valid: false, errors: ['Response must contain "summary"'] };
        }
        return { valid: true };
    }
});

if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
}
```

### Conversation Persistence

```javascript
// Save conversation to cloud storage
await aiService.saveConversation('customer-support-123');

// Load conversation
const loaded = await aiService.loadConversation('customer-support-123');

// List all saved conversations
const conversations = await aiService.listConversations();
console.log('Saved conversations:', conversations);

// Delete saved conversation
await aiService.deleteSavedConversation('customer-support-123');
```

## API Reference

### Configuration Options

```javascript
{
    puter: PuterIntegration,  // Required: PuterIntegration instance
    defaultModel: string,      // Default: 'gpt-3.5-turbo'
    maxTokens: number,         // Default: 2000
    temperature: number,       // Default: 0.7 (0-2)
    debugMode: boolean         // Default: false
}
```

### Available Models

#### gpt-3.5-turbo
- **Type**: Chat
- **Context Window**: 4096 tokens
- **Best For**: Conversations, general tasks
- **Speed**: Fast

#### code-davinci-002
- **Type**: Completion
- **Context Window**: 8000 tokens
- **Best For**: Code generation, programming
- **Speed**: Medium

#### text-davinci-003
- **Type**: Completion
- **Context Window**: 4000 tokens
- **Best For**: Text completion, writing
- **Speed**: Medium

### Methods

#### Chat Operations

- `chat(message, options)` - Send chat message
- `complete(prompt, options)` - Generate text completion
- `generateCode(prompt, options)` - Generate code

#### Conversation Management

- `getConversation(conversationId)` - Get or create conversation
- `chatInConversation(conversationId, message, options)` - Chat with context
- `clearConversation(conversationId)` - Clear conversation history
- `deleteConversation(conversationId)` - Delete conversation from memory
- `saveConversation(conversationId)` - Save to storage
- `loadConversation(conversationId)` - Load from storage
- `listConversations()` - List all saved conversations
- `deleteSavedConversation(conversationId)` - Delete from storage

#### Prompt Templates

- `createPromptTemplate(name, template, metadata)` - Create template
- `renderTemplate(name, variables)` - Render template with variables

#### Model Management

- `listModels()` - List all available models
- `getModelInfo(modelId)` - Get model information

#### Token Management

- `estimateTokens(text)` - Estimate token count
- `fitsInContextWindow(modelId, prompt)` - Check if fits
- `truncateToFit(modelId, prompt, reserveTokens)` - Truncate to fit

#### Validation

- `validateResponse(response, validators)` - Validate AI response

## Response Format

All AI operations return a response object:

```javascript
{
    content: string,           // Generated content
    model: string,             // Model used
    usage: {
        promptTokens: number,
        completionTokens: number,
        totalTokens: number
    },
    finishReason: string,      // 'stop', 'length', 'content_filter'
    timestamp: string          // ISO 8601 timestamp
}
```

## Error Handling

The AI service throws `AIServiceError` for various failure scenarios:

```javascript
try {
    const response = await aiService.chat('Hello');
} catch (error) {
    if (error.code === 'CHAT_FAILED') {
        console.error('Chat operation failed:', error.message);
    } else if (error.code === 'TEMPLATE_NOT_FOUND') {
        console.error('Prompt template not found');
    }
}
```

### Error Codes

- `MISSING_CONFIG` - Required configuration missing
- `CHAT_FAILED` - Chat operation failed
- `COMPLETION_FAILED` - Completion operation failed
- `CODE_GEN_FAILED` - Code generation failed
- `TEMPLATE_NOT_FOUND` - Prompt template not found
- `CONV_NOT_FOUND` - Conversation not found
- `SAVE_CONV_FAILED` - Failed to save conversation
- `LOAD_CONV_FAILED` - Failed to load conversation
- `DELETE_CONV_FAILED` - Failed to delete conversation

## Best Practices

### 1. Use Conversation Context

For multi-turn conversations, always use `chatInConversation`:

```javascript
// Good
await aiService.chatInConversation('conv-1', 'Hello');
await aiService.chatInConversation('conv-1', 'How are you?');

// Avoid - no context maintained
await aiService.chat('Hello');
await aiService.chat('How are you?');
```

### 2. Choose Appropriate Models

Select models based on task:

```javascript
// Conversations
aiService.chat('Hello', { model: 'gpt-3.5-turbo' });

// Code generation
aiService.generateCode('Write a function', { model: 'code-davinci-002' });

// Text completion
aiService.complete('The quick brown', { model: 'text-davinci-003' });
```

### 3. Set Appropriate Temperature

- **0.0 - 0.3**: Deterministic, factual responses
- **0.4 - 0.7**: Balanced creativity (default)
- **0.8 - 1.0**: High creativity, varied outputs
- **1.0 - 2.0**: Very creative, unpredictable

```javascript
aiService.chat('What is 2+2?', { temperature: 0.1 });
aiService.chat('Write a creative story', { temperature: 0.9 });
```

### 4. Validate Responses

Always validate critical responses:

```javascript
const response = await aiService.chat('Generate JSON config');

const validation = aiService.validateResponse(response, {
    custom: (resp) => {
        try {
            JSON.parse(resp.content);
            return { valid: true };
        } catch {
            return { valid: false, errors: ['Invalid JSON'] };
        }
    }
});
```

### 5. Monitor Token Usage

Track token usage for cost management:

```javascript
const response = await aiService.chat(prompt);
console.log(`Tokens used: ${response.usage.totalTokens}`);
```

## Examples

### Customer Support Bot

```javascript
const supportAI = new AIService({ puter, defaultModel: 'gpt-3.5-turbo' });

async function handleCustomerIssue(customerId, issue) {
    const conversationId = `support-${customerId}`;
    
    // Get or load conversation
    try {
        await supportAI.loadConversation(conversationId);
    } catch {
        // New conversation
    }
    
    // Generate response
    const response = await supportAI.chatInConversation(
        conversationId,
        `Customer issue: ${issue}`
    );
    
    // Save conversation
    await supportAI.saveConversation(conversationId);
    
    return response.content;
}
```

### Code Review Assistant

```javascript
const codeAI = new AIService({ 
    puter, 
    defaultModel: 'code-davinci-002',
    temperature: 0.2  // Lower for code
});

async function reviewCode(code) {
    const prompt = `Review this code for bugs and improvements:\n\n${code}`;
    const review = await codeAI.generateCode(prompt);
    return review.content;
}
```

### Content Generator

```javascript
const contentAI = new AIService({ 
    puter,
    defaultModel: 'text-davinci-003',
    temperature: 0.8  // Higher for creativity
});

// Create template
contentAI.createPromptTemplate(
    'blog-post',
    'Write a {{tone}} blog post about {{topic}} for {{audience}}'
);

// Generate content
const prompt = contentAI.renderTemplate('blog-post', {
    tone: 'engaging',
    topic: 'AI automation',
    audience: 'developers'
});

const post = await contentAI.complete(prompt);
```

## Testing

Unit tests are located in `/tests/unit/ai-service.test.js`:

```bash
npm test ai-service.test.js
```

## License

MIT License - See project root for details
