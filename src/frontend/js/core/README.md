# Jobsprint Frontend Core Modules

This directory contains the core JavaScript modules for the Jobsprint frontend application.

## Modules

### PuterIntegration (`puter.js`)

The main Puter.js integration layer providing:

- **SDK Initialization**: Automatic setup and configuration of Puter.js SDK
- **Authentication**: User sign-in/sign-out management
- **Cloud Storage**: File and directory operations (read, write, delete, move, copy)
- **Key-Value Store**: Simple data persistence
- **Error Handling**: Automatic retry logic with exponential backoff
- **Event System**: Subscribe to Puter.js events

#### Usage Example

```javascript
import { PuterIntegration } from './core/puter.js';

// Initialize
const puter = new PuterIntegration({
    appName: 'Jobsprint',
    debugMode: true
});

await puter.initialize();

// Sign in
await puter.signIn();

// File operations
await puter.writeFile('data.json', JSON.stringify({ test: 'data' }));
const content = await puter.readJSONFile('data.json');

// Key-value operations
await puter.setKV('counter', 1);
const value = await puter.getKV('counter');
```

### ConfigManager (`config.js`)

Centralized configuration management with:

- Environment-based configuration (dev/staging/prod)
- Runtime configuration updates
- Configuration validation
- Persistence via Puter.js
- Watch system for configuration changes

#### Usage Example

```javascript
import { ConfigManager } from './core/config.js';

const config = new ConfigManager({
    puter: puterInstance,
    env: 'development'
});

await config.initialize();

// Get configuration
const maxTokens = config.get('ai.maxTokens', 2000);

// Set configuration
config.set('ai.temperature', 0.8);

// Watch for changes
config.watch('ai.temperature', (newValue, oldValue) => {
    console.log(`Temperature changed from ${oldValue} to ${newValue}`);
});

// Save configuration
await config.save();
```

## Features

### Error Handling

All modules include comprehensive error handling:

```javascript
try {
    await puter.readFile('nonexistent.txt');
} catch (error) {
    if (error.code === 'MAX_RETRIES_EXCEEDED') {
        console.error('Operation failed after retries');
    }
}
```

### Event System

Subscribe to events for reactive programming:

```javascript
puter.on('fs:write', (data) => {
    console.log(`File written: ${data.path}`);
});

puter.on('auth:signIn', (user) => {
    console.log(`User signed in: ${user.username}`);
});
```

### Automatic Retry Logic

Network operations automatically retry with exponential backoff:

```javascript
const puter = new PuterIntegration({
    maxRetries: 3,
    retryDelay: 1000
});
```

## API Reference

### PuterIntegration

#### Methods

- `initialize()` - Initialize Puter.js SDK
- `signIn(onSuccess, onError)` - Sign in user
- `signOut()` - Sign out current user
- `isAuthenticated()` - Check authentication status
- `writeFile(path, data, options)` - Write file to cloud storage
- `readFile(path, options)` - Read file from cloud storage
- `readTextFile(path)` - Read file as text
- `readJSONFile(path)` - Read and parse JSON file
- `createDirectory(path, options)` - Create directory
- `listDirectory(path)` - List directory contents
- `getMetadata(path)` - Get file/directory metadata
- `delete(path)` - Delete file or directory
- `rename(oldPath, newPath)` - Rename file or directory
- `copy(sourcePath, targetPath)` - Copy file or directory
- `move(sourcePath, targetPath)` - Move file or directory
- `uploadFiles(files, path)` - Upload files from local system
- `getReadURL(path)` - Get read URL for file
- `setKV(key, value)` - Set key-value store item
- `getKV(key)` - Get key-value store item
- `deleteKV(key)` - Delete key-value store item
- `incrementKV(key, amount)` - Increment counter
- `on(event, callback)` - Add event listener
- `off(event, callback)` - Remove event listener

### ConfigManager

#### Methods

- `initialize()` - Initialize configuration manager
- `get(path, defaultValue)` - Get configuration value
- `set(path, value)` - Set configuration value
- `getAll()` - Get all configuration
- `setMany(updates)` - Set multiple values
- `reset()` - Reset to defaults
- `validate(config)` - Validate configuration
- `save()` - Save to storage
- `load()` - Load from storage
- `export()` - Export as JSON string
- `import(jsonConfig)` - Import from JSON string
- `watch(path, callback)` - Watch for changes

## Testing

Unit tests are located in `/tests/unit/`:

```bash
# Run all tests
npm test

# Run specific test file
npm test puter.test.js

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Development

### Project Structure

```
src/frontend/js/
├── core/
│   ├── puter.js           # Puter.js integration
│   ├── config.js          # Configuration management
│   └── README.md          # This file
├── ai/
│   ├── ai-service.js      # AI service abstraction
│   └── README.md          # AI service documentation
└── integrations/
    ├── zapier.js          # Zapier MCP integration
    └── n8n.js             # n8n workflow integration
```

### Code Style

- ES6+ modules
- Async/await for async operations
- Comprehensive error handling
- JSDoc comments for documentation
- Consistent naming conventions

### Best Practices

1. Always handle errors with try-catch
2. Use descriptive variable names
3. Add JSDoc comments for public methods
4. Write unit tests for new functionality
5. Use configuration instead of hardcoded values

## Troubleshooting

### Puter.js Not Loading

If you see "SDK_NOT_LOADED" error:

```html
<!-- Include Puter.js SDK in your HTML -->
<script src="https://js.puter.com/v2/"></script>
```

### Authentication Issues

If authentication fails:

1. Check browser console for errors
2. Ensure Puter.js script is loaded
3. Verify popup blocker is disabled
4. Check network connection

### File Operation Failures

Most file operations include automatic retry. If they still fail:

1. Check authentication status
2. Verify file paths are correct
3. Ensure sufficient permissions
4. Check available storage space

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Implement the feature
3. Add JSDoc documentation
4. Update this README
5. Ensure all tests pass

## License

MIT License - See project root for details
