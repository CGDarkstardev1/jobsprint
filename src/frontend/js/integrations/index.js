/**
 * Zapier MCP Integration - Main Entry Point
 *
 * Exports all Zapier MCP integration modules and utilities.
 *
 * @module integrations
 */

// Core client
export { ZapierMCPClient, createZapierMCPClient } from './zapier';

// Connection management
export { ZapierConnectionManager } from './zapier-connection-manager';

// Trigger handling
export { ZapierTriggerRegistry } from './zapier-trigger-registry';

// Action dispatching
export { ZapierActionDispatcher } from './zapier-action-dispatcher';

// Webhook handling
export { ZapierWebhookHandler } from './zapier-webhook-handler';

// Error handling
export { ZapierErrorHandler } from './zapier-error-handler';

// Workflow templates
export { ZapierWorkflowTemplates } from './zapier-workflow-templates';

// Utilities
export {
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
} from './zapier-utils';

/**
 * Create a complete Zapier MCP integration setup
 *
 * @param {Object} config - Configuration object
 * @returns {Object} Integration instance with all components
 */
export function createZapierIntegration(config = {}) {
  // Create main client
  const client = createZapierMCPClient(config);

  // Create supporting components
  const connectionManager = new ZapierConnectionManager(client, config.connection);
  const triggerRegistry = new ZapierTriggerRegistry(client);
  const actionDispatcher = new ZapierActionDispatcher(client, config.dispatcher);
  const webhookHandler = new ZapierWebhookHandler(client, config.webhook);
  const errorHandler = new ZapierErrorHandler(config.errorHandling);

  return {
    client,
    connectionManager,
    triggerRegistry,
    actionDispatcher,
    webhookHandler,
    errorHandler,

    /**
     * Initialize all components
     */
    async initialize() {
      await client.initialize();
      return {
        client: client.getStatus(),
        connections: connectionManager.getAllConnections(),
      };
    },

    /**
     * Cleanup all components
     */
    async destroy() {
      await connectionManager.destroy();
      triggerRegistry.destroy();
      await actionDispatcher.destroy();
      webhookHandler.destroy();
      errorHandler.destroy();
      await client.destroy();
    },
  };
}

/**
 * Zapier MCP Integration class with high-level API
 *
 * Simplified API for common workflows.
 */
export class ZapierIntegration {
  constructor(config = {}) {
    const integration = createZapierIntegration(config);
    this.client = integration.client;
    this.connectionManager = integration.connectionManager;
    this.triggerRegistry = integration.triggerRegistry;
    this.actionDispatcher = integration.actionDispatcher;
    this.webhookHandler = integration.webhookHandler;
    this.errorHandler = integration.errorHandler;
  }

  /**
   * Initialize integration
   */
  async init() {
    return await this.client.initialize();
  }

  /**
   * Connect to app
   */
  async connect(appId, credentials = {}) {
    return await this.connectionManager.connect(appId, credentials);
  }

  /**
   * Disconnect from app
   */
  async disconnect(appId) {
    return await this.connectionManager.disconnect(appId);
  }

  /**
   * Execute action
   */
  async execute(actionId, params, options = {}) {
    return await this.actionDispatcher.dispatch(actionId, params, options);
  }

  /**
   * Execute batch actions
   */
  async executeBatch(actions, options = {}) {
    return await this.actionDispatcher.dispatchBatch(actions, options);
  }

  /**
   * Register trigger
   */
  onTrigger(triggerId, config, handler) {
    return this.triggerRegistry.registerTrigger(triggerId, config, handler);
  }

  /**
   * Register webhook
   */
  onWebhook(webhookId, config, handler) {
    return this.webhookHandler.registerWebhook(webhookId, config, handler);
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      client: this.client.getStatus(),
      connections: this.connectionManager.getAllConnections(),
      triggers: this.triggerRegistry.getAllTriggers(),
      webhooks: this.webhookHandler.getAllWebhooks(),
      dispatcher: this.actionDispatcher.getQueueStatus(),
    };
  }

  /**
   * Cleanup
   */
  async destroy() {
    await this.connectionManager.destroy();
    this.triggerRegistry.destroy();
    await this.actionDispatcher.destroy();
    this.webhookHandler.destroy();
    this.errorHandler.destroy();
    await this.client.destroy();
  }
}

// Default export
export default createZapierIntegration;
