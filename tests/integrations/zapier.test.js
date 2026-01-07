/**
 * Zapier MCP Integration Tests
 *
 * Comprehensive test suite for Zapier MCP client and utilities.
 * Uses mocks for external API calls.
 *
 * @module zapier.test
 */

// Mock fetch globally
global.fetch = jest.fn();

// Import modules to test
const {
  ZapierMCPClient,
  createZapierMCPClient,
} = require('../../src/frontend/js/integrations/zapier');

const { ZapierConnectionManager } = require('../../src/frontend/js/integrations/zapier-connection-manager');
const { ZapierTriggerRegistry } = require('../../src/frontend/js/integrations/zapier-trigger-registry');
const { ZapierActionDispatcher } = require('../../src/frontend/js/integrations/zapier-action-dispatcher');
const { ZapierWebhookHandler } = require('../../src/frontend/js/integrations/zapier-webhook-handler');
const { ZapierErrorHandler } = require('../../src/frontend/js/integrations/zapier-error-handler');
const { ZapierWorkflowTemplates } = require('../../src/frontend/js/integrations/zapier-workflow-templates');

describe('ZapierMCPClient', () => {
  let client;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      endpointUrl: 'https://mcp.zapier.app/test',
      apiKey: 'test-api-key',
      maxRetries: 3,
      retryDelay: 1000,
    };

    // Reset fetch mock
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, actions: [] }),
    });

    client = new ZapierMCPClient(mockConfig);
  });

  afterEach(async () => {
    if (client) {
      await client.destroy();
    }
  });

  describe('Constructor', () => {
    test('should initialize with valid config', () => {
      expect(client.endpointUrl).toBe(mockConfig.endpointUrl);
      expect(client.apiKey).toBe(mockConfig.apiKey);
      expect(client.maxRetries).toBe(mockConfig.maxRetries);
    });

    test('should throw error without endpoint URL', () => {
      expect(() => {
        new ZapierMCPClient({ apiKey: 'test' });
      }).toThrow('endpoint URL is required');
    });

    test('should throw error without API key', () => {
      expect(() => {
        new ZapierMCPClient({ endpointUrl: 'https://test.com' });
      }).toThrow('API key is required');
    });

    test('should throw error for non-HTTPS endpoint', () => {
      expect(() => {
        new ZapierMCPClient({
          endpointUrl: 'http://insecure.com',
          apiKey: 'test',
        });
      }).toThrow('must use HTTPS');
    });
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          actions: [
            { id: 'action-1', name: 'Test Action 1' },
            { id: 'action-2', name: 'Test Action 2' },
          ],
        }),
      });

      const result = await client.initialize();

      expect(result.success).toBe(true);
      expect(result.actionsCount).toBe(2);
      expect(client.activeActions.size).toBe(2);
    });

    test('should handle initialization errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.initialize()).rejects.toThrow('initialization failed');
    });
  });

  describe('App Connections', () => {
    test('should connect to app successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          connectionId: 'conn-123',
        }),
      });

      const result = await client.connectApp('slack', {});

      expect(result.success).toBe(true);
      expect(result.appId).toBe('slack');
      expect(client.connections.has('slack')).toBe(true);
    });

    test('should disconnect from app', async () => {
      client.connections.set('slack', { id: 'conn-123' });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await client.disconnectApp('slack');

      expect(result.success).toBe(true);
      expect(client.connections.has('slack')).toBe(false);
    });

    test('should handle connection errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(client.connectApp('slack', {})).rejects.toThrow();
    });
  });

  describe('Action Execution', () => {
    beforeEach(async () => {
      // Initialize client with actions
      client.activeActions.set('test-action', {
        id: 'test-action',
        inputSchema: {
          required: ['message'],
          properties: {
            message: { type: 'string' },
          },
        },
      });
    });

    test('should execute action successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: { status: 'completed' },
        }),
      });

      const result = await client.executeAction('test-action', {
        message: 'Hello',
      });

      expect(result.success).toBe(true);
      expect(result.result.status).toBe('completed');
    });

    test('should validate required parameters', async () => {
      await expect(client.executeAction('test-action', {})).rejects.toThrow(
        'Missing required parameters'
      );
    });

    test('should retry on retryable errors', async () => {
      // Fail twice, then succeed
      fetch
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, result: {} }),
        });

      const result = await client.executeAction('test-action', {
        message: 'Hello',
      });

      expect(result.success).toBe(true);
      expect(fetch.mock.calls.length).toBe(3);
    });

    test('should not retry on non-retryable errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(
        client.executeAction('test-action', { message: 'Hello' })
      ).rejects.toThrow('Invalid credentials');

      expect(fetch.mock.calls.length).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      client.rateLimits.maxRequests = 2;
      client.rateLimits.currentRequests = 2;

      const sleepSpy = jest.spyOn(client, '_sleep');

      await client.executeAction('test-action', { message: 'Hello' });

      expect(sleepSpy).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    test('should emit events', () => {
      const mockCallback = jest.fn();
      client.on('actionExecuted', mockCallback);

      client._emit('actionExecuted', { actionId: 'test' });

      expect(mockCallback).toHaveBeenCalledWith({ actionId: 'test' });
    });

    test('should remove event listeners', () => {
      const mockCallback = jest.fn();
      client.on('test', mockCallback);
      client.off('test', mockCallback);

      client._emit('test', {});

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Status', () => {
    test('should return status information', () => {
      client.connections.set('slack', { id: 'conn-1' });
      client.webhooks.set('webhook-1', { handler: () => {} });

      const status = client.getStatus();

      expect(status.connectedApps).toEqual(['slack']);
      expect(status.availableActions).toBe(0);
      expect(status.registeredTriggers).toBe(1);
    });
  });
});

describe('ZapierConnectionManager', () => {
  let manager;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      connectApp: jest.fn().mockResolvedValue({
        success: true,
        connectionId: 'conn-123',
      }),
      disconnectApp: jest.fn().mockResolvedValue({ success: true }),
      _makeRequest: jest.fn().mockResolvedValue({ status: 'ok' }),
    };

    manager = new ZapierConnectionManager(mockClient, {
      autoReconnect: false,
    });
  });

  afterEach(async () => {
    await manager.destroy();
  });

  test('should connect to app', async () => {
    const result = await manager.connect('slack', {});

    expect(result.appId).toBe('slack');
    expect(result.status).toBe('connected');
    expect(mockClient.connectApp).toHaveBeenCalledWith('slack', {});
  });

  test('should test connection health', async () => {
    manager.connections.set('slack', {
      id: 'conn-123',
      credentials: {},
      healthStatus: 'healthy',
    });

    const isHealthy = await manager.testConnection('slack');

    expect(isHealthy).toBe(true);
    expect(mockClient._makeRequest).toHaveBeenCalled();
  });

  test('should handle unhealthy connections', async () => {
    manager.connections.set('slack', {
      id: 'conn-123',
      credentials: {},
      healthStatus: 'healthy',
    });

    mockClient._makeRequest.mockRejectedValue(new Error('Connection failed'));

    const isHealthy = await manager.testConnection('slack');

    expect(isHealthy).toBe(false);
  });
});

describe('ZapierTriggerRegistry', () => {
  let registry;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      registerTrigger: jest.fn(),
      handleTrigger: jest.fn().mockResolvedValue({ result: 'ok' }),
    };

    registry = new ZapierTriggerRegistry(mockClient);
  });

  test('should register trigger', () => {
    const handler = jest.fn();
    const result = registry.registerTrigger('trigger-1', {
      appId: 'slack',
      eventType: 'message',
    }, handler);

    expect(result.success).toBe(true);
    expect(registry.triggers.has('trigger-1')).toBe(true);
  });

  test('should validate trigger config', () => {
    const handler = jest.fn();
    const result = registry.registerTrigger('trigger-2', {}, handler);

    expect(result.success).toBe(false);
    expect(result.error).toContain('appId');
  });

  test('should execute trigger', async () => {
    const handler = jest.fn();
    registry.registerTrigger('trigger-1', {
      appId: 'slack',
      eventType: 'message',
    }, handler);

    const result = await registry.executeTrigger('trigger-1', {
      text: 'Hello',
    });

    expect(result.success).toBe(true);
    expect(mockClient.handleTrigger).toHaveBeenCalled();
  });

  test('should get trigger stats', () => {
    const handler = jest.fn();
    registry.registerTrigger('trigger-1', {
      appId: 'slack',
      eventType: 'message',
    }, handler);

    const stats = registry.getTriggerStats('trigger-1');

    expect(stats).not.toBeNull();
    expect(stats.triggerId).toBe('trigger-1');
    expect(stats.executionCount).toBe(0);
  });
});

describe('ZapierActionDispatcher', () => {
  let dispatcher;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      executeAction: jest.fn().mockResolvedValue({
        success: true,
        result: {},
      }),
    };

    dispatcher = new ZapierActionDispatcher(mockClient, {
      maxConcurrent: 2,
    });
  });

  afterEach(async () => {
    await dispatcher.destroy();
  });

  test('should dispatch action', async () => {
    const result = await dispatcher.dispatch('test-action', {});

    expect(result.success).toBe(true);
    expect(mockClient.executeAction).toHaveBeenCalledWith('test-action', {}, expect.any(Object));
  });

  test('should dispatch batch actions', async () => {
    const actions = [
      { actionId: 'action-1', params: {} },
      { actionId: 'action-2', params: {} },
    ];

    const result = await dispatcher.dispatchBatch(actions);

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });

  test('should enforce concurrency limits', async () => {
    const actions = Array.from({ length: 5 }, (_, i) => ({
      actionId: `action-${i}`,
      params: {},
    }));

    const results = await dispatcher.dispatchParallel(actions, 2);

    expect(results).toHaveLength(5);
  });

  test('should cancel queued jobs', () => {
    dispatcher.actionQueue.push({
      actionId: 'test-action',
      params: {},
      cancelled: false,
      reject: jest.fn(),
    });

    const cancelled = dispatcher.cancelQueued('test-action');

    expect(cancelled).toBe(1);
  });
});

describe('ZapierErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ZapierErrorHandler({
      maxRetries: 3,
      circuitBreakerThreshold: 5,
    });
  });

  test('should retry retryable errors', async () => {
    const retryFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValue('success');

    const result = await errorHandler.handleError(
      new Error('ECONNRESET'),
      retryFn,
      { operationId: 'test-op' }
    );

    expect(result).toBe('success');
    expect(retryFn).toHaveBeenCalledTimes(2);
  });

  test('should not retry non-retryable errors', async () => {
    const retryFn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      errorHandler.handleError(
        new Error('Invalid credentials'),
        retryFn,
        { operationId: 'test-op' }
      )
    ).rejects.toThrow('Invalid credentials');

    expect(retryFn).toHaveBeenCalledTimes(1);
  });

  test('should open circuit breaker after threshold', async () => {
    const retryFn = jest.fn().mockRejectedValue(new Error('Server error'));

    // Trigger errors to open circuit breaker
    for (let i = 0; i < 6; i++) {
      try {
        await errorHandler.handleError(new Error('Server error'), retryFn, {
          operationId: 'test-op',
        });
      } catch (e) {
        // Expected
      }
    }

    const stats = errorHandler.getErrorStats('test-op');
    expect(stats.circuitBreakerOpen).toBe(true);
  });

  test('should add to dead letter queue', async () => {
    const retryFn = jest.fn().mockRejectedValue(new Error('Server error'));

    try {
      await errorHandler.handleError(new Error('Server error'), retryFn, {
        operationId: 'test-op',
        attempt: 10,
      });
    } catch (e) {
      // Expected
    }

    const queue = errorHandler.getDeadLetterQueue();
    expect(queue.length).toBeGreaterThan(0);
  });
});

describe('ZapierWorkflowTemplates', () => {
  test('should return all templates', () => {
    const templates = ZapierWorkflowTemplates.getAllTemplates();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty('id');
    expect(templates[0]).toHaveProperty('name');
    expect(templates[0]).toHaveProperty('triggers');
    expect(templates[0]).toHaveProperty('actions');
  });

  test('should get template by ID', () => {
    const template = ZapierWorkflowTemplates.getTemplate('slack-notification');

    expect(template).not.toBeNull();
    expect(template.id).toBe('slack-notification');
  });

  test('should return null for non-existent template', () => {
    const template = ZapierWorkflowTemplates.getTemplate('non-existent');

    expect(template).toBeNull();
  });
});
