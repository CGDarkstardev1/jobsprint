/**
 * Zapier MCP Mock
 *
 * Mock the Zapier MCP client for testing
 */

class ZapierMCPMock {
  constructor() {
    this.apps = [];
    this.actions = [];
    this.triggers = [];
    this.webhooks = new Map();
  }

  /**
   * Mock Zapier app list
   */
  async listApps() {
    return {
      success: true,
      apps: [
        { id: 'gmail', name: 'Gmail', connected: true },
        { id: 'slack', name: 'Slack', connected: true },
        { id: 'trello', name: 'Trello', connected: false },
      ],
    };
  }

  /**
   * Mock Zapier action execution
   */
  async executeAction(appId, actionKey, params) {
    return {
      success: true,
      data: {
        id: `action-${Date.now()}`,
        status: 'completed',
        result: { message: 'Action executed successfully' },
      },
    };
  }

  /**
   * Mock Zapier trigger subscription
   */
  async subscribeTrigger(appId, triggerKey, config) {
    return {
      success: true,
      subscription: {
        id: `sub-${Date.now()}`,
        appId,
        triggerKey,
        status: 'active',
        webhookUrl: `https://zapier.mock/webhook/${Date.now()}`,
      },
    };
  }

  /**
   * Mock Zapier webhook handler
   */
  async handleWebhook(subscriptionId, data) {
    return {
      success: true,
      processed: true,
      data,
    };
  }

  /**
   * Mock test connection
   */
  async testConnection(appId) {
    return {
      success: true,
      status: 'connected',
      app: { id: appId, name: 'Mock App' },
    };
  }

  /**
   * Set mock app
   */
  setMockApp(app) {
    this.apps.push(app);
  }

  /**
   * Set mock action
   */
  setMockAction(action) {
    this.actions.push(action);
  }

  /**
   * Set mock trigger
   */
  setMockTrigger(trigger) {
    this.triggers.push(trigger);
  }

  /**
   * Clear all mocks
   */
  clear() {
    this.apps = [];
    this.actions = [];
    this.triggers = [];
    this.webhooks.clear();
  }
}

export const zapierMock = new ZapierMCPMock();
export default zapierMock;
