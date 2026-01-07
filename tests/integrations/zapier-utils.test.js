/**
 * Zapier Utilities Tests
 *
 * Tests for utility functions used in Zapier MCP integration.
 *
 * @module zapier-utils.test
 */

const {
  validateParams,
  transformParams,
  sanitizeData,
  calculateBackoff,
  isRetryableStatus,
  formatError,
  deepMerge,
  debounce,
  throttle,
  parseActionId,
  generateId,
  formatDuration,
  promiseWithTimeout,
  retry,
  createRateLimiter,
  batch,
  createLogger,
} = require('../../src/frontend/js/integrations/zapier-utils');

describe('validateParams', () => {
  const schema = {
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      email: { type: 'string', pattern: '^[\\w-\\.]+@[\\w-]+\\.[a-z]{2,4}$' },
      age: { type: 'number', minimum: 0, maximum: 150 },
      subscribed: { type: 'boolean' },
      tags: { type: 'array' },
    },
  };

  test('should validate valid params', () => {
    const params = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    };

    const result = validateParams(params, schema);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect missing required fields', () => {
    const params = { name: 'John' };

    const result = validateParams(params, schema);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: email');
  });

  test('should validate field types', () => {
    const params = {
      name: 'John',
      email: 'john@example.com',
      age: '30', // Should be number
    };

    const result = validateParams(params, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('must be a number'))).toBe(true);
  });

  test('should validate string length', () => {
    const params = {
      name: 'J', // Too short
      email: 'john@example.com',
    };

    const result = validateParams(params, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('must be >= 2 characters'))).toBe(true);
  });

  test('should validate number ranges', () => {
    const params = {
      name: 'John',
      email: 'john@example.com',
      age: 200, // Too large
    };

    const result = validateParams(params, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('must be <= 150'))).toBe(true);
  });

  test('should validate patterns', () => {
    const params = {
      name: 'John',
      email: 'invalid-email', // Invalid format
    };

    const result = validateParams(params, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('does not match pattern'))).toBe(true);
  });
});

describe('transformParams', () => {
  test('should replace template variables', () => {
    const params = {
      message: 'Hello {{name}}',
      count: '{{age}}',
    };

    const context = {
      name: 'John',
      age: 30,
    };

    const result = transformParams(params, context);

    expect(result.message).toBe('Hello John');
    expect(result.count).toBe(30);
  });

  test('should handle nested paths', () => {
    const params = {
      message: '{{user.name}} is {{user.age}} years old',
    };

    const context = {
      user: {
        name: 'John',
        age: 30,
      },
    };

    const result = transformParams(params, context);

    expect(result.message).toBe('John is 30 years old');
  });

  test('should keep unmatched variables', () => {
    const params = {
      message: 'Hello {{unknown}}',
    };

    const result = transformParams(params, {});

    expect(result.message).toBe('Hello {{unknown}}');
  });

  test('should transform nested objects', () => {
    const params = {
      user: {
        name: '{{name}}',
        email: '{{email}}',
      },
    };

    const context = {
      name: 'John',
      email: 'john@example.com',
    };

    const result = transformParams(params, context);

    expect(result.user.name).toBe('John');
    expect(result.user.email).toBe('john@example.com');
  });

  test('should transform arrays', () => {
    const params = {
      messages: ['Hello {{name}}', 'Goodbye {{name}}'],
    };

    const result = transformParams(params, { name: 'John' });

    expect(result.messages).toEqual(['Hello John', 'Goodbye John']);
  });
});

describe('sanitizeData', () => {
  test('should sanitize sensitive fields', () => {
    const data = {
      name: 'John',
      password: 'secret123',
      token: 'abc123',
    };

    const result = sanitizeData(data);

    expect(result.name).toBe('John');
    expect(result.password).toBe('***REDACTED***');
    expect(result.token).toBe('***REDACTED***');
  });

  test('should sanitize custom fields', () => {
    const data = {
      apiKey: 'key123',
      custom: 'value',
    };

    const result = sanitizeData(data, ['apiKey']);

    expect(result.apiKey).toBe('***REDACTED***');
    expect(result.custom).toBe('value');
  });

  test('should sanitize nested objects', () => {
    const data = {
      user: {
        name: 'John',
        credentials: {
          password: 'secret',
        },
      },
    };

    const result = sanitizeData(data);

    expect(result.user.name).toBe('John');
    expect(result.user.credentials.password).toBe('***REDACTED***');
  });
});

describe('calculateBackoff', () => {
  test('should calculate exponential backoff', () => {
    expect(calculateBackoff(0, 1000, 2, 10000)).toBe(1000);
    expect(calculateBackoff(1, 1000, 2, 10000)).toBe(2000);
    expect(calculateBackoff(2, 1000, 2, 10000)).toBe(4000);
    expect(calculateBackoff(3, 1000, 2, 10000)).toBe(8000);
  });

  test('should cap at max delay', () => {
    expect(calculateBackoff(10, 1000, 2, 10000)).toBe(10000);
  });
});

describe('isRetryableStatus', () => {
  test('should identify retryable status codes', () => {
    expect(isRetryableStatus(408)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
  });

  test('should not retry non-retryable status codes', () => {
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });
});

describe('formatError', () => {
  test('should format error with status code', () => {
    const error = {
      statusCode: 404,
      message: 'Not found',
    };

    const formatted = formatError(error);

    expect(formatted).toBe('HTTP 404: Not found');
  });

  test('should format error with code', () => {
    const error = {
      code: 'ECONNREFUSED',
      message: 'Connection refused',
    };

    const formatted = formatError(error);

    expect(formatted).toBe('ECONNREFUSED: Connection refused');
  });

  test('should handle unknown errors', () => {
    const formatted = formatError(null);

    expect(formatted).toBe('Unknown error');
  });
});

describe('deepMerge', () => {
  test('should merge objects deeply', () => {
    const target = {
      a: 1,
      b: {
        c: 2,
        d: 3,
      },
    };

    const source = {
      b: {
        d: 4,
        e: 5,
      },
      f: 6,
    };

    const result = deepMerge(target, source);

    expect(result).toEqual({
      a: 1,
      b: {
        c: 2,
        d: 4,
        e: 5,
      },
      f: 6,
    });
  });
});

describe('parseActionId', () => {
  test('should parse dot-separated action ID', () => {
    const parsed = parseActionId('slack.sendMessage');

    expect(parsed.app).toBe('slack');
    expect(parsed.action).toBe('sendMessage');
  });

  test('should parse colon-separated action ID', () => {
    const parsed = parseActionId('slack:sendMessage');

    expect(parsed.app).toBe('slack');
    expect(parsed.action).toBe('sendMessage');
  });

  test('should parse underscore-separated action ID', () => {
    const parsed = parseActionId('slack_sendMessage');

    expect(parsed.app).toBe('slack');
    expect(parsed.action).toBe('sendMessage');
  });

  test('should handle action ID without separator', () => {
    const parsed = parseActionId('sendMessage');

    expect(parsed.app).toBeNull();
    expect(parsed.action).toBe('sendMessage');
  });
});

describe('generateId', () => {
  test('should generate unique IDs', () => {
    const id1 = generateId('test');
    const id2 = generateId('test');

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^test_/);
  });
});

describe('formatDuration', () => {
  test('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  test('should format seconds', () => {
    expect(formatDuration(5000)).toBe('5.0s');
  });

  test('should format minutes', () => {
    expect(formatDuration(90000)).toBe('1.5m');
  });

  test('should format hours', () => {
    expect(formatDuration(7200000)).toBe('2.0h');
  });
});

describe('promiseWithTimeout', () => {
  test('should resolve promise before timeout', async () => {
    const promise = Promise.resolve('success');

    const result = await promiseWithTimeout(promise, 1000, 'Timeout');

    expect(result).toBe('success');
  });

  test('should timeout slow promise', async () => {
    const promise = new Promise(resolve => setTimeout(() => resolve('success'), 2000));

    await expect(promiseWithTimeout(promise, 100, 'Timeout')).rejects.toThrow('Timeout');
  });
});

describe('retry', () => {
  test('should retry on failure', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValue('success');

    const result = await retry(fn, { maxAttempts: 3, initialDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('should give up after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Error'));

    await expect(retry(fn, { maxAttempts: 2, initialDelay: 10 })).rejects.toThrow('Error');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('createRateLimiter', () => {
  test('should allow requests within limit', () => {
    const limiter = createRateLimiter(5, 1000);

    expect(() => {
      limiter();
      limiter();
      limiter();
    }).not.toThrow();
  });

  test('should block requests over limit', () => {
    const limiter = createRateLimiter(2, 1000);

    limiter();
    limiter();

    expect(() => limiter()).toThrow('Rate limit exceeded');
  });
});

describe('batch', () => {
  test('should batch array into chunks', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const batches = batch(array, 3);

    expect(batches).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [10],
    ]);
  });

  test('should handle empty array', () => {
    const batches = batch([], 3);

    expect(batches).toEqual([]);
  });

  test('should handle array smaller than batch size', () => {
    const batches = batch([1, 2], 5);

    expect(batches).toEqual([[1, 2]]);
  });
});

describe('createLogger', () => {
  test('should create logger with context', () => {
    const logger = createLogger('test-context');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('test message', { data: 'value' });

    expect(consoleSpy).toHaveBeenCalledWith('[test-context] INFO:', 'test message', { data: 'value' });

    consoleSpy.mockRestore();
  });
});
