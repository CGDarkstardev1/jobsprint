/**
 * Zapier Trigger Registry
 *
 * Manages trigger registration, validation, and execution.
 * Provides a centralized registry for all Zapier webhook triggers.
 *
 * @module ZapierTriggerRegistry
 */

class ZapierTriggerRegistry {
  /**
   * Initialize trigger registry
   *
   * @param {ZapierMCPClient} client - Zapier MCP client instance
   */
  constructor(client) {
    this.client = client;
    this.triggers = new Map();
    this.triggerSchemas = new Map();
    this.executionHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Register a trigger with validation
   *
   * @param {string} triggerId - Unique trigger identifier
   * @param {Object} config - Trigger configuration
   * @param {Function} handler - Trigger handler function
   * @returns {Object} Registration result
   */
  registerTrigger(triggerId, config, handler) {
    try {
      // Validate trigger ID
      if (!triggerId || typeof triggerId !== 'string') {
        throw new Error('Trigger ID must be a non-empty string');
      }

      // Check if trigger already exists
      if (this.triggers.has(triggerId)) {
        throw new Error(`Trigger ${triggerId} is already registered`);
      }

      // Validate handler
      if (typeof handler !== 'function') {
        throw new Error('Trigger handler must be a function');
      }

      // Validate config
      const validatedConfig = this._validateTriggerConfig(config);

      // Create trigger object
      const trigger = {
        id: triggerId,
        config: validatedConfig,
        handler,
        registeredAt: new Date().toISOString(),
        executionCount: 0,
        lastExecuted: null,
        status: 'active',
      };

      // Store trigger
      this.triggers.set(triggerId, trigger);

      // Register with client
      this.client.registerTrigger(triggerId, handler);

      return {
        success: true,
        triggerId,
        trigger,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Unregister a trigger
   *
   * @param {string} triggerId - Trigger identifier
   * @returns {boolean} Success status
   */
  unregisterTrigger(triggerId) {
    if (!this.triggers.has(triggerId)) {
      return false;
    }

    this.triggers.delete(triggerId);
    return true;
  }

  /**
   * Execute a trigger
   *
   * @param {string} triggerId - Trigger identifier
   * @param {Object} payload - Trigger payload
   * @returns {Promise<Object>} Execution result
   */
  async executeTrigger(triggerId, payload) {
    const startTime = Date.now();

    try {
      // Get trigger
      const trigger = this.triggers.get(triggerId);
      if (!trigger) {
        throw new Error(`Trigger ${triggerId} not found`);
      }

      // Check if trigger is active
      if (trigger.status !== 'active') {
        throw new Error(`Trigger ${triggerId} is not active`);
      }

      // Validate payload against schema
      if (trigger.config.inputSchema) {
        this._validatePayload(payload, trigger.config.inputSchema);
      }

      // Execute handler
      const result = await this.client.handleTrigger(triggerId, payload);

      // Update trigger stats
      trigger.executionCount++;
      trigger.lastExecuted = new Date().toISOString();

      // Record execution
      this._recordExecution({
        triggerId,
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
      // Record failed execution
      this._recordExecution({
        triggerId,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Get trigger information
   *
   * @param {string} triggerId - Trigger identifier
   * @returns {Object|null} Trigger information
   */
  getTrigger(triggerId) {
    return this.triggers.get(triggerId) || null;
  }

  /**
   * Get all triggers
   *
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of triggers
   */
  getAllTriggers(filters = {}) {
    let triggers = Array.from(this.triggers.values());

    // Apply filters
    if (filters.status) {
      triggers = triggers.filter(t => t.status === filters.status);
    }

    if (filters.appId) {
      triggers = triggers.filter(t => t.config.appId === filters.appId);
    }

    return triggers;
  }

  /**
   * Update trigger configuration
   *
   * @param {string} triggerId - Trigger identifier
   * @param {Object} updates - Configuration updates
   * @returns {Object} Updated trigger
   */
  updateTrigger(triggerId, updates) {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    // Merge updates
    Object.assign(trigger.config, updates);

    return trigger;
  }

  /**
   * Activate trigger
   *
   * @param {string} triggerId - Trigger identifier
   * @returns {boolean} Success status
   */
  activateTrigger(triggerId) {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      return false;
    }

    trigger.status = 'active';
    return true;
  }

  /**
   * Deactivate trigger
   *
   * @param {string} triggerId - Trigger identifier
   * @returns {boolean} Success status
   */
  deactivateTrigger(triggerId) {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      return false;
    }

    trigger.status = 'inactive';
    return true;
  }

  /**
   * Get execution history
   *
   * @param {Object} filters - Optional filters
   * @returns {Array} Execution history
   */
  getExecutionHistory(filters = {}) {
    let history = [...this.executionHistory];

    // Apply filters
    if (filters.triggerId) {
      history = history.filter(h => h.triggerId === filters.triggerId);
    }

    if (filters.success !== undefined) {
      history = history.filter(h => h.success === filters.success);
    }

    if (filters.limit) {
      history = history.slice(0, filters.limit);
    }

    return history;
  }

  /**
   * Validate trigger configuration
   * @private
   */
  _validateTriggerConfig(config) {
    const validated = {
      appId: config.appId,
      eventType: config.eventType,
      inputSchema: config.inputSchema || null,
      outputSchema: config.outputSchema || null,
      description: config.description || '',
      throttleMs: config.throttleMs || 0,
      retryConfig: config.retryConfig || {
        maxRetries: 3,
        retryDelay: 1000,
      },
    };

    if (!validated.appId) {
      throw new Error('Trigger config must include appId');
    }

    if (!validated.eventType) {
      throw new Error('Trigger config must include eventType');
    }

    return validated;
  }

  /**
   * Validate payload against schema
   * @private
   */
  _validatePayload(payload, schema) {
    // Basic validation
    if (schema.required) {
      const missing = schema.required.filter(field => !(field in payload));
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }
    }

    // Type validation (simplified)
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in payload) {
          const value = payload[field];
          const expectedType = fieldSchema.type;

          if (expectedType === 'string' && typeof value !== 'string') {
            throw new Error(`Field ${field} must be a string`);
          }
          if (expectedType === 'number' && typeof value !== 'number') {
            throw new Error(`Field ${field} must be a number`);
          }
          if (expectedType === 'boolean' && typeof value !== 'boolean') {
            throw new Error(`Field ${field} must be a boolean`);
          }
        }
      }
    }
  }

  /**
   * Record trigger execution
   * @private
   */
  _recordExecution(record) {
    this.executionHistory.unshift(record);

    // Trim history if too large
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
  }

  /**
   * Get trigger statistics
   *
   * @param {string} triggerId - Trigger identifier
   * @returns {Object} Trigger statistics
   */
  getTriggerStats(triggerId) {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      return null;
    }

    const executions = this.executionHistory.filter(h => h.triggerId === triggerId);
    const successful = executions.filter(h => h.success).length;
    const failed = executions.filter(h => !h.success).length;
    const avgDuration =
      executions.length > 0
        ? executions.reduce((sum, h) => sum + h.duration, 0) / executions.length
        : 0;

    return {
      triggerId,
      status: trigger.status,
      executionCount: trigger.executionCount,
      lastExecuted: trigger.lastExecuted,
      registeredAt: trigger.registeredAt,
      successfulExecutions: successful,
      failedExecutions: failed,
      successRate: executions.length > 0 ? (successful / executions.length) * 100 : 0,
      averageDuration: avgDuration,
    };
  }

  /**
   * Cleanup registry
   */
  destroy() {
    this.triggers.clear();
    this.executionHistory = [];
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZapierTriggerRegistry };
}
