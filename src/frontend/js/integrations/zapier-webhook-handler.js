/**
 * Zapier Webhook Handler
 *
 * Manages webhook receiving, validation, and routing.
 * Provides secure webhook endpoints for Zapier triggers.
 *
 * @module ZapierWebhookHandler
 */

class ZapierWebhookHandler {
  /**
   * Initialize webhook handler
   *
   * @param {ZapierMCPClient} client - Zapier MCP client instance
   * @param {Object} config - Configuration options
   */
  constructor(client, config = {}) {
    this.client = client;
    this.webhooks = new Map();
    this.webhookLogs = [];
    this.maxLogs = 1000;

    this.config = {
      secret: config.secret || process.env.ZAPIER_WEBHOOK_SECRET,
      verifySignature: config.verifySignature !== false,
      timeout: config.timeout || 30000,
      maxPayloadSize: config.maxPayloadSize || 1024 * 1024, // 1MB
    };
  }

  /**
   * Register a webhook endpoint
   *
   * @param {string} webhookId - Unique webhook identifier
   * @param {Object} config - Webhook configuration
   * @param {Function} handler - Webhook handler function
   * @returns {Object} Registration result
   */
  registerWebhook(webhookId, config, handler) {
    try {
      // Validate webhook ID
      if (!webhookId || typeof webhookId !== 'string') {
        throw new Error('Webhook ID must be a non-empty string');
      }

      // Check if webhook already exists
      if (this.webhooks.has(webhookId)) {
        throw new Error(`Webhook ${webhookId} is already registered`);
      }

      // Validate handler
      if (typeof handler !== 'function') {
        throw new Error('Webhook handler must be a function');
      }

      // Create webhook object
      const webhook = {
        id: webhookId,
        path: config.path || `/webhooks/${webhookId}`,
        method: config.method || 'POST',
        handler,
        config: {
          appId: config.appId,
          eventType: config.eventType,
          allowedIps: config.allowedIps || [],
          requireAuth: config.requireAuth !== false,
          transformPayload: config.transformPayload || null,
          validatePayload: config.validatePayload || null,
        },
        registeredAt: new Date().toISOString(),
        callCount: 0,
        lastCalled: null,
        status: 'active',
      };

      // Store webhook
      this.webhooks.set(webhookId, webhook);

      return {
        success: true,
        webhookId,
        webhook,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Unregister a webhook
   *
   * @param {string} webhookId - Webhook identifier
   * @returns {boolean} Success status
   */
  unregisterWebhook(webhookId) {
    return this.webhooks.delete(webhookId);
  }

  /**
   * Handle incoming webhook request
   *
   * @param {string} webhookId - Webhook identifier
   * @param {Object} request - Webhook request object
   * @returns {Promise<Object>} Handler result
   */
  async handleWebhook(webhookId, request) {
    const startTime = Date.now();

    try {
      // Get webhook
      const webhook = this.webhooks.get(webhookId);
      if (!webhook) {
        throw new Error(`Webhook ${webhookId} not found`);
      }

      // Check webhook status
      if (webhook.status !== 'active') {
        throw new Error(`Webhook ${webhookId} is not active`);
      }

      // Validate request
      await this._validateRequest(webhook, request);

      // Verify signature if enabled
      if (this.config.verifySignature && request.signature) {
        this._verifySignature(request.payload, request.signature);
      }

      // Transform payload if configured
      let payload = request.payload;
      if (webhook.config.transformPayload) {
        payload = await webhook.config.transformPayload(payload);
      }

      // Validate payload if configured
      if (webhook.config.validatePayload) {
        const isValid = await webhook.config.validatePayload(payload);
        if (!isValid) {
          throw new Error('Payload validation failed');
        }
      }

      // Execute handler
      const result = await webhook.handler(payload);

      // Update webhook stats
      webhook.callCount++;
      webhook.lastCalled = new Date().toISOString();

      // Log webhook call
      this._logWebhookCall({
        webhookId,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // Log failed webhook call
      this._logWebhookCall({
        webhookId,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Validate webhook request
   * @private
   */
  async _validateRequest(webhook, request) {
    // Check payload size
    const payloadSize = JSON.stringify(request.payload).length;
    if (payloadSize > this.config.maxPayloadSize) {
      throw new Error('Payload size exceeds maximum allowed');
    }

    // Check method
    if (request.method && request.method !== webhook.method) {
      throw new Error(`Invalid method: ${request.method}`);
    }

    // Check IP whitelist
    if (webhook.config.allowedIps.length > 0 && request.ip) {
      if (!webhook.config.allowedIps.includes(request.ip)) {
        throw new Error(`IP ${request.ip} not allowed`);
      }
    }

    // Check authentication
    if (webhook.config.requireAuth && !request.auth) {
      throw new Error('Authentication required');
    }
  }

  /**
   * Verify webhook signature
   * @private
   */
  _verifySignature(payload, signature) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.secret);
    hmac.update(JSON.stringify(payload));
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
  }

  /**
   * Generate signature for payload
   *
   * @param {Object} payload - Payload to sign
   * @returns {string} Signature
   */
  generateSignature(payload) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Get webhook information
   *
   * @param {string} webhookId - Webhook identifier
   * @returns {Object|null} Webhook information
   */
  getWebhook(webhookId) {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * Get all webhooks
   *
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of webhooks
   */
  getAllWebhooks(filters = {}) {
    let webhooks = Array.from(this.webhooks.values());

    // Apply filters
    if (filters.status) {
      webhooks = webhooks.filter(w => w.status === filters.status);
    }

    if (filters.appId) {
      webhooks = webhooks.filter(w => w.config.appId === filters.appId);
    }

    return webhooks;
  }

  /**
   * Activate webhook
   *
   * @param {string} webhookId - Webhook identifier
   * @returns {boolean} Success status
   */
  activateWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return false;
    }

    webhook.status = 'active';
    return true;
  }

  /**
   * Deactivate webhook
   *
   * @param {string} webhookId - Webhook identifier
   * @returns {boolean} Success status
   */
  deactivateWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return false;
    }

    webhook.status = 'inactive';
    return true;
  }

  /**
   * Get webhook logs
   *
   * @param {Object} filters - Optional filters
   * @returns {Array} Webhook logs
   */
  getLogs(filters = {}) {
    let logs = [...this.webhookLogs];

    // Apply filters
    if (filters.webhookId) {
      logs = logs.filter(l => l.webhookId === filters.webhookId);
    }

    if (filters.success !== undefined) {
      logs = logs.filter(l => l.success === filters.success);
    }

    if (filters.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  /**
   * Log webhook call
   * @private
   */
  _logWebhookCall(log) {
    this.webhookLogs.unshift(log);

    // Trim logs if too large
    if (this.webhookLogs.length > this.maxLogs) {
      this.webhookLogs = this.webhookLogs.slice(0, this.maxLogs);
    }
  }

  /**
   * Clear webhook logs
   */
  clearLogs() {
    this.webhookLogs = [];
  }

  /**
   * Get webhook statistics
   *
   * @param {string} webhookId - Webhook identifier
   * @returns {Object} Webhook statistics
   */
  getWebhookStats(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return null;
    }

    const logs = this.webhookLogs.filter(l => l.webhookId === webhookId);
    const successful = logs.filter(l => l.success).length;
    const failed = logs.filter(l => !l.success).length;
    const avgDuration =
      logs.length > 0
        ? logs.reduce((sum, l) => sum + l.duration, 0) / logs.length
        : 0;

    return {
      webhookId,
      status: webhook.status,
      callCount: webhook.callCount,
      lastCalled: webhook.lastCalled,
      registeredAt: webhook.registeredAt,
      successfulCalls: successful,
      failedCalls: failed,
      successRate: logs.length > 0 ? (successful / logs.length) * 100 : 0,
      averageDuration: avgDuration,
    };
  }

  /**
   * Cleanup handler
   */
  destroy() {
    this.webhooks.clear();
    this.webhookLogs = [];
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZapierWebhookHandler };
}
