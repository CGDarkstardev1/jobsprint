/**
 * Zapier Connection Manager
 *
 * Manages connections to Zapier apps with authentication, pooling,
 * and automatic reconnection logic.
 *
 * @module ZapierConnectionManager
 */

class ZapierConnectionManager {
  /**
   * Initialize connection manager
   *
   * @param {ZapierMCPClient} client - Zapier MCP client instance
   * @param {Object} config - Configuration options
   */
  constructor(client, config = {}) {
    this.client = client;
    this.connections = new Map();
    this.connectionPool = new Map();
    this.config = {
      maxConnections: config.maxConnections || 10,
      connectionTimeout: config.connectionTimeout || 30000,
      autoReconnect: config.autoReconnect !== false,
      reconnectInterval: config.reconnectInterval || 5000,
      healthCheckInterval: config.healthCheckInterval || 60000,
    };

    this.healthCheckTimer = null;
    this._startHealthChecks();
  }

  /**
   * Establish connection to an app
   *
   * @param {string} appId - Application ID
   * @param {Object} credentials - Authentication credentials
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Connection object
   */
  async connect(appId, credentials, options = {}) {
    try {
      // Check if connection already exists
      if (this.connections.has(appId)) {
        const existing = this.connections.get(appId);
        if (existing.status === 'connected') {
          return existing;
        }
      }

      // Check connection pool
      const pooled = this._getFromPool(appId);
      if (pooled) {
        this.connections.set(appId, pooled);
        return pooled;
      }

      // Establish new connection
      const connection = await this.client.connectApp(appId, credentials);

      // Wrap with connection metadata
      const wrappedConnection = {
        ...connection,
        appId,
        credentials: this._sanitizeCredentials(credentials),
        connectedAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        healthStatus: 'healthy',
        useCount: 0,
      };

      this.connections.set(appId, wrappedConnection);
      this._addToPool(appId, wrappedConnection);

      return wrappedConnection;
    } catch (error) {
      if (this.config.autoReconnect) {
        this._scheduleReconnect(appId, credentials, options);
      }
      throw error;
    }
  }

  /**
   * Disconnect from an app
   *
   * @param {string} appId - Application ID
   * @returns {Promise<void>}
   */
  async disconnect(appId) {
    try {
      await this.client.disconnectApp(appId);
      this.connections.delete(appId);
      this._removeFromPool(appId);
    } catch (error) {
      console.error(`Failed to disconnect from ${appId}:`, error);
      throw error;
    }
  }

  /**
   * Get connection status
   *
   * @param {string} appId - Application ID
   * @returns {Object|null} Connection status
   */
  getConnection(appId) {
    return this.connections.get(appId) || null;
  }

  /**
   * Get all active connections
   *
   * @returns {Array} Array of connection objects
   */
  getAllConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Test connection health
   *
   * @param {string} appId - Application ID
   * @returns {Promise<boolean>} Health status
   */
  async testConnection(appId) {
    try {
      const connection = this.connections.get(appId);
      if (!connection) {
        return false;
      }

      // Perform a lightweight health check
      const startTime = Date.now();
      await this.client._makeRequest('GET', `/apps/${appId}/health`);
      const responseTime = Date.now() - startTime;

      // Update connection health
      connection.healthStatus = 'healthy';
      connection.lastHealthCheck = new Date().toISOString();
      connection.responseTime = responseTime;
      connection.useCount++;

      return true;
    } catch (error) {
      const connection = this.connections.get(appId);
      if (connection) {
        connection.healthStatus = 'unhealthy';
        connection.lastError = error.message;
        connection.lastHealthCheck = new Date().toISOString();

        // Trigger auto-reconnect if enabled
        if (this.config.autoReconnect) {
          this._scheduleReconnect(appId, connection.credentials);
        }
      }
      return false;
    }
  }

  /**
   * Add connection to pool
   * @private
   */
  _addToPool(appId, connection) {
    if (!this.connectionPool.has(appId)) {
      this.connectionPool.set(appId, []);
    }

    const pool = this.connectionPool.get(appId);
    if (pool.length < this.config.maxConnections) {
      pool.push(connection);
    }
  }

  /**
   * Get connection from pool
   * @private
   */
  _getFromPool(appId) {
    const pool = this.connectionPool.get(appId);
    if (!pool || pool.length === 0) {
      return null;
    }

    return pool.pop();
  }

  /**
   * Remove from pool
   * @private
   */
  _removeFromPool(appId) {
    this.connectionPool.delete(appId);
  }

  /**
   * Sanitize credentials for logging
   * @private
   */
  _sanitizeCredentials(credentials) {
    const sanitized = { ...credentials };

    // Hide sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Schedule reconnection attempt
   * @private
   */
  _scheduleReconnect(appId, credentials, options = {}) {
    setTimeout(async () => {
      try {
        console.log(`Attempting to reconnect to ${appId}...`);
        await this.connect(appId, credentials, options);
        console.log(`Successfully reconnected to ${appId}`);
      } catch (error) {
        console.error(`Reconnection failed for ${appId}:`, error);
        // Retry again if auto-reconnect is enabled
        if (this.config.autoReconnect) {
          this._scheduleReconnect(appId, credentials, options);
        }
      }
    }, this.config.reconnectInterval);
  }

  /**
   * Start periodic health checks
   * @private
   */
  _startHealthChecks() {
    this.healthCheckTimer = setInterval(async () => {
      const appIds = Array.from(this.connections.keys());

      for (const appId of appIds) {
        await this.testConnection(appId);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Cleanup all connections
   */
  async destroy() {
    this.stopHealthChecks();

    const appIds = Array.from(this.connections.keys());
    for (const appId of appIds) {
      try {
        await this.disconnect(appId);
      } catch (error) {
        console.error(`Failed to disconnect from ${appId} during cleanup:`, error);
      }
    }

    this.connections.clear();
    this.connectionPool.clear();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZapierConnectionManager };
}
