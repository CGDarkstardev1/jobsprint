/**
 * Zapier MCP Integration Client for Jobsprint
 *
 * Production-ready client for integrating with Zapier's Model Context Protocol (MCP)
 * Provides access to 8,000+ app integrations and 30,000+ pre-authenticated actions.
 *
 * @module ZapierMCP
 * @version 1.0.0
 * @author Jobsprint AI Platform
 *
 * Features:
 * - Pre-authenticated app connections
 * - Trigger and action execution
 * - Webhook handling
 * - Rate limiting and throttling
 * - Automatic retries with exponential backoff
 * - Comprehensive error handling
 * - Event-driven architecture
 */

/**
 * Zapier MCP Client Class
 *
 * Main client for interacting with Zapier's MCP endpoints.
 * Handles authentication, connection management, and action execution.
 */
class ZapierMCPClient {
  /**
   * Initialize the Zapier MCP client
   *
   * @param {Object} config - Configuration object
   * @param {string} config.endpointUrl - MCP server endpoint URL
   * @param {string} config.apiKey - API authentication key
   * @param {number} config.maxRetries - Maximum retry attempts (default: 3)
   * @param {number} config.retryDelay - Initial retry delay in ms (default: 1000)
   * @param {number} config.timeout - Request timeout in ms (default: 30000)
   * @param {Object} config.rateLimits - Rate limiting configuration
   * @param {number} config.rateLimits.maxRequests - Max requests per window
   * @param {number} config.rateLimits.windowMs - Time window in ms
   */
  constructor(config = {}) {
    this.endpointUrl = config.endpointUrl || process.env.ZAPIER_MCP_ENDPOINT;
    this.apiKey = config.apiKey || process.env.ZAPIER_MCP_API_KEY;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.timeout = config.timeout ?? 30000;

    // Rate limiting configuration
    this.rateLimits = {
      maxRequests: config.rateLimits?.maxRequests || 80, // Free tier: 80 calls/hour
      windowMs: config.rateLimits?.windowMs || 3600000, // 1 hour
      currentRequests: 0,
      resetTime: Date.now() + 3600000,
    };

    // Connection state
    this.connections = new Map(); // App connections
    this.activeActions = new Map(); // Available actions
    this.webhooks = new Map(); // Webhook handlers

    // Event listeners
    this.eventListeners = new Map();

    // Request queue for rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;

    this._validateConfig();
  }

  /**
   * Validate configuration parameters
   * @private
   */
  _validateConfig() {
    if (!this.endpointUrl) {
      throw new Error('Zapier MCP endpoint URL is required');
    }
    if (!this.apiKey) {
      throw new Error('Zapier MCP API key is required');
    }
    if (!this.endpointUrl.startsWith('https://')) {
      throw new Error('Endpoint URL must use HTTPS');
    }
  }

  /**
   * Initialize the MCP client and discover available actions
   *
   * @returns {Promise<Object>} Initialization status and available actions
   */
  async initialize() {
    try {
      this._log('info', 'Initializing Zapier MCP client...');

      // Fetch available actions from the MCP endpoint
      const actions = await this._discoverActions();

      this.activeActions = new Map(
        actions.map(action => [action.id, action])
      );

      this._log('info', `Discovered ${actions.length} available actions`);

      return {
        success: true,
        endpointUrl: this.endpointUrl,
        actionsCount: actions.length,
        actions: actions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this._log('error', 'Failed to initialize client', { error: error.message });
      throw new Error(`MCP initialization failed: ${error.message}`);
    }
  }

  /**
   * Discover available actions from the MCP endpoint
   * @private
   */
  async _discoverActions() {
    const response = await this._makeRequest('GET', '/actions');
    return response.actions || [];
  }

  /**
   * Connect to a Zapier app
   *
   * @param {string} appId - The app ID to connect (e.g., 'slack', 'gmail')
   * @param {Object} credentials - Authentication credentials
   * @returns {Promise<Object>} Connection status
   */
  async connectApp(appId, credentials = {}) {
    try {
      this._log('info', `Connecting to app: ${appId}`);

      const response = await this._makeRequest('POST', `/apps/${appId}/connect`, {
        credentials,
      });

      this.connections.set(appId, {
        id: response.connectionId,
        status: 'connected',
        connectedAt: new Date().toISOString(),
        ...response,
      });

      this._emit('appConnected', { appId, connectionId: response.connectionId });

      return {
        success: true,
        appId,
        connectionId: response.connectionId,
        status: 'connected',
      };
    } catch (error) {
      this._log('error', `Failed to connect to app: ${appId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Disconnect from a Zapier app
   *
   * @param {string} appId - The app ID to disconnect
   * @returns {Promise<Object>} Disconnection status
   */
  async disconnectApp(appId) {
    try {
      const connection = this.connections.get(appId);
      if (!connection) {
        throw new Error(`No connection found for app: ${appId}`);
      }

      await this._makeRequest('POST', `/apps/${appId}/disconnect`, {
        connectionId: connection.id,
      });

      this.connections.delete(appId);

      this._emit('appDisconnected', { appId });

      return {
        success: true,
        appId,
        status: 'disconnected',
      };
    } catch (error) {
      this._log('error', `Failed to disconnect app: ${appId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Execute an action
   *
   * @param {string} actionId - The action ID to execute
   * @param {Object} params - Action parameters
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Action execution result
   */
  async executeAction(actionId, params = {}, options = {}) {
    try {
      this._log('info', `Executing action: ${actionId}`, { params });

      // Check if action is available
      const action = this.activeActions.get(actionId);
      if (!action) {
        throw new Error(`Action not found: ${actionId}`);
      }

      // Validate parameters
      this._validateParams(action, params);

      // Check rate limits
      await this._checkRateLimit();

      // Execute with retry logic
      const result = await this._executeWithRetry(
        async () => {
          return await this._makeRequest('POST', `/actions/${actionId}/execute`, {
            params,
            options: {
              timeout: options.timeout || this.timeout,
              async: options.async || false,
            },
          });
        },
        actionId
      );

      this._emit('actionExecuted', {
        actionId,
        success: true,
        result,
      });

      return result;
    } catch (error) {
      this._log('error', `Action execution failed: ${actionId}`, {
        error: error.message,
      });

      this._emit('actionFailed', {
        actionId,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Register a trigger handler
   *
   * @param {string} triggerId - The trigger ID
   * @param {Function} handler - Trigger handler function
   * @returns {Object} Registration status
   */
  registerTrigger(triggerId, handler) {
    this._log('info', `Registering trigger: ${triggerId}`);

    if (typeof handler !== 'function') {
      throw new Error('Trigger handler must be a function');
    }

    this.webhooks.set(triggerId, {
      handler,
      registeredAt: new Date().toISOString(),
    });

    return {
      success: true,
      triggerId,
      status: 'registered',
    };
  }

  /**
   * Handle incoming webhook trigger
   *
   * @param {string} triggerId - The trigger ID
   * @param {Object} payload - Webhook payload
   * @returns {Promise<Object>} Handler execution result
   */
  async handleTrigger(triggerId, payload) {
    try {
      const webhook = this.webhooks.get(triggerId);
      if (!webhook) {
        throw new Error(`No handler registered for trigger: ${triggerId}`);
      }

      this._log('info', `Handling trigger: ${triggerId}`, { payload });

      const result = await webhook.handler(payload);

      this._emit('triggerHandled', {
        triggerId,
        success: true,
        result,
      });

      return {
        success: true,
        triggerId,
        result,
      };
    } catch (error) {
      this._log('error', `Trigger handling failed: ${triggerId}`, {
        error: error.message,
      });

      this._emit('triggerFailed', {
        triggerId,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Execute action with retry logic
   * @private
   */
  async _executeWithRetry(fn, actionId, attempt = 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw new Error(
          `Max retries exceeded for action ${actionId}: ${error.message}`
        );
      }

      const shouldRetry = this._shouldRetry(error);
      if (!shouldRetry) {
        throw error;
      }

      const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
      this._log('info', `Retrying action ${actionId} (attempt ${attempt + 1})`, {
        delay,
      });

      await this._sleep(delay);
      return this._executeWithRetry(fn, actionId, attempt + 1);
    }
  }

  /**
   * Determine if error is retryable
   * @private
   */
  _shouldRetry(error) {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];

    return (
      retryableStatusCodes.includes(error.statusCode) ||
      retryableErrors.some(code => error.message.includes(code))
    );
  }

  /**
   * Check rate limits and wait if necessary
   * @private
   */
  async _checkRateLimit() {
    const now = Date.now();

    // Reset counter if window has passed
    if (now > this.rateLimits.resetTime) {
      this.rateLimits.currentRequests = 0;
      this.rateLimits.resetTime = now + this.rateLimits.windowMs;
    }

    // Check if limit reached
    if (this.rateLimits.currentRequests >= this.rateLimits.maxRequests) {
      const waitTime = this.rateLimits.resetTime - now;
      this._log('warn', 'Rate limit reached, waiting...', { waitTime });

      await this._sleep(waitTime);

      // Reset after waiting
      this.rateLimits.currentRequests = 0;
      this.rateLimits.resetTime = Date.now() + this.rateLimits.windowMs;
    }

    this.rateLimits.currentRequests++;
  }

  /**
   * Make HTTP request to MCP endpoint
   * @private
   */
  async _makeRequest(method, path, data = null) {
    const url = `${this.endpointUrl}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'Jobsprint-ZapierMCP/1.0.0',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Validate action parameters against schema
   * @private
   */
  _validateParams(action, params) {
    if (!action.inputSchema) {
      return; // No schema defined
    }

    const required = action.inputSchema.required || [];
    const missing = required.filter(field => !(field in params));

    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }

    // Type validation could be added here
  }

  /**
   * Register event listener
   *
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   *
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   * @private
   */
  _emit(event, data) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    for (const callback of this.eventListeners.get(event)) {
      try {
        callback(data);
      } catch (error) {
        this._log('error', `Event listener error: ${event}`, { error: error.message });
      }
    }
  }

  /**
   * Get connection status
   *
   * @returns {Object} Connection status information
   */
  getStatus() {
    return {
      endpointUrl: this.endpointUrl,
      connectedApps: Array.from(this.connections.keys()),
      availableActions: this.activeActions.size,
      registeredTriggers: this.webhooks.size,
      rateLimit: {
        used: this.rateLimits.currentRequests,
        max: this.rateLimits.maxRequests,
        resetsAt: new Date(this.rateLimits.resetTime).toISOString(),
      },
    };
  }

  /**
   * Sleep utility for delays
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging utility
   * @private
   */
  _log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...data };

    // In production, send to proper logging system
    console.log(`[ZapierMCP:${level.toUpperCase()}]`, message, data);

    // Emit log event for monitoring
    this._emit('log', logEntry);
  }

  /**
   * Cleanup and close connections
   */
  async destroy() {
    this._log('info', 'Destroying Zapier MCP client...');

    // Disconnect all apps
    for (const appId of this.connections.keys()) {
      try {
        await this.disconnectApp(appId);
      } catch (error) {
        this._log('error', `Failed to disconnect app: ${appId}`, {
          error: error.message,
        });
      }
    }

    // Clear all data
    this.connections.clear();
    this.activeActions.clear();
    this.webhooks.clear();
    this.eventListeners.clear();

    this._log('info', 'Client destroyed');
  }
}

/**
 * Factory function to create a configured Zapier MCP client
 *
 * @param {Object} config - Configuration object
 * @returns {ZapierMCPClient} Configured client instance
 */
function createZapierMCPClient(config) {
  return new ZapierMCPClient(config);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZapierMCPClient, createZapierMCPClient };
}
