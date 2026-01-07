/**
 * Zapier Integration Unit Tests
 *
 * Test Zapier MCP integration
 */

import ZapierIntegration from '@/integrations/zapier';
import { zapierMock } from '@mocks/zapier.mock';

describe('ZapierIntegration', () => {
  let zapier;

  beforeEach(() => {
    zapier = new ZapierIntegration('mock-api-key');
    zapier.client = zapierMock;
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with API key', () => {
      expect(zapier.apiKey).toBe('mock-api-key');
      expect(zapier.client).toBeDefined();
    });

    it('should throw error without API key', () => {
      expect(() => new ZapierIntegration()).toThrow('API key is required');
    });
  });

  describe('App Management', () => {
    it('should list available apps', async () => {
      const response = await zapier.listApps();

      expect(response.success).toBe(true);
      expect(response.apps).toBeDefined();
      expect(Array.isArray(response.apps)).toBe(true);
      expect(response.apps.length).toBeGreaterThan(0);
    });

    it('should filter apps by connection status', async () => {
      const response = await zapier.listApps({ connected: true });

      expect(response.apps.every(app => app.connected)).toBe(true);
    });

    it('should get app details', async () => {
      const app = await zapier.getApp('gmail');

      expect(app).toBeDefined();
      expect(app.id).toBe('gmail');
    });
  });

  describe('Action Execution', () => {
    it('should execute action with parameters', async () => {
      const params = {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test'
      };

      const response = await zapier.executeAction('gmail', 'send_email', params);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.status).toBe('completed');
    });

    it('should handle action execution errors', async () => {
      zapierMock.executeAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Invalid parameters'
      });

      const response = await zapier.executeAction('gmail', 'send_email', {});

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should validate action parameters before execution', () => {
      const params = { to: 'test@example.com' }; // Missing subject

      expect(() => zapier.validateActionParams('gmail', 'send_email', params))
        .toThrow('Missing required parameter: subject');
    });
  });

  describe('Trigger Management', () => {
    it('should subscribe to trigger', async () => {
      const config = {
        event: 'new_email',
        filters: { from: 'important@example.com' }
      };

      const response = await zapier.subscribeTrigger('gmail', 'new_email', config);

      expect(response.success).toBe(true);
      expect(response.subscription).toBeDefined();
      expect(response.subscription.status).toBe('active');
      expect(response.subscription.webhookUrl).toBeDefined();
    });

    it('should unsubscribe from trigger', async () => {
      const subscribeResponse = await zapier.subscribeTrigger('gmail', 'new_email', {});
      const unsubscribeResponse = await zapier.unsubscribeTrigger(
        subscribeResponse.subscription.id
      );

      expect(unsubscribeResponse.success).toBe(true);
    });

    it('should list active subscriptions', async () => {
      await zapier.subscribeTrigger('gmail', 'new_email', {});
      await zapier.subscribeTrigger('slack', 'new_message', {});

      const subscriptions = await zapier.listSubscriptions();

      expect(subscriptions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Webhook Handling', () => {
    it('should handle incoming webhook', async () => {
      const webhookData = {
        event: 'new_email',
        data: {
          from: 'sender@example.com',
          subject: 'Hello',
          body: 'Test email'
        }
      };

      const response = await zapier.handleWebhook('webhook-123', webhookData);

      expect(response.success).toBe(true);
      expect(response.processed).toBe(true);
    });

    it('should validate webhook payload', () => {
      const invalidPayload = { event: 'new_email' }; // Missing data

      expect(() => zapier.validateWebhookPayload(invalidPayload))
        .toThrow('Invalid webhook payload');
    });
  });

  describe('Connection Management', () => {
    it('should test connection to app', async () => {
      const response = await zapier.testConnection('gmail');

      expect(response.success).toBe(true);
      expect(response.status).toBe('connected');
    });

    it('should handle failed connection test', async () => {
      zapierMock.testConnection = jest.fn().mockResolvedValue({
        success: false,
        error: 'Connection failed'
      });

      const response = await zapier.testConnection('invalid-app');

      expect(response.success).toBe(false);
    });

    it('should connect to app with credentials', async () => {
      const credentials = {
        username: 'test@example.com',
        password: 'password123'
      };

      const response = await zapier.connectApp('gmail', credentials);

      expect(response.success).toBe(true);
    });

    it('should disconnect from app', async () => {
      const response = await zapier.disconnectApp('gmail');

      expect(response.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      zapierMock.executeAction = jest.fn()
        .mockResolvedValue({ success: false, error: 'Rate limit exceeded' });

      const response = await zapier.executeAction('gmail', 'send_email', {});

      expect(response.success).toBe(false);
      expect(zapier.shouldRetry(response)).toBe(true);
    });

    it('should implement exponential backoff', async () => {
      const delays = [];
      zapier.sleep = (ms) => delays.push(ms);

      await zapier.backoffRetry(() => zapier.executeAction('gmail', 'send_email', {}), 3);

      expect(delays).toEqual([1000, 2000, 4000]);
    });
  });

  describe('Rate Limiting', () => {
    it('should track API usage', () => {
      zapier.trackRequest();
      zapier.trackRequest();

      expect(zapier.getRequestCount()).toBe(2);
    });

    it('should enforce rate limits', async () => {
      // Set low rate limit for testing
      zapier.rateLimit = 2;

      await zapier.executeAction('gmail', 'send_email', {});
      await zapier.executeAction('slack', 'send_message', {});

      await expect(zapier.executeAction('gmail', 'send_email', {}))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('should reset rate limit window', () => {
      zapier.trackRequest();
      zapier.trackRequest();
      zapier.resetRateLimit();

      expect(zapier.getRequestCount()).toBe(0);
    });
  });
});
