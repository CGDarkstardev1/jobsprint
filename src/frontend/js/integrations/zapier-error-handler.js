/**
 * Zapier Error Handler
 *
 * Comprehensive error handling and retry logic with:
 * - Exponential backoff
 * - Circuit breaker pattern
 * - Error classification
 * - Dead letter queue
 *
 * @module ZapierErrorHandler
 */

class ZapierErrorHandler {
  /**
   * Initialize error handler
   *
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      initialRetryDelay: config.initialRetryDelay || 1000,
      maxRetryDelay: config.maxRetryDelay || 30000,
      retryMultiplier: config.retryMultiplier || 2,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 60000,
      enableDeadLetterQueue: config.enableDeadLetterQueue !== false,
    };

    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
    this.deadLetterQueue = [];
    this.errorHandlers = new Map();
  }

  /**
   * Handle error with retry logic
   *
   * @param {Error} error - The error to handle
   * @param {Function} retryFn - Function to retry
   * @param {Object} context - Error context
   * @returns {Promise<any>} Result of operation
   */
  async handleError(error, retryFn, context = {}) {
    const errorType = this._classifyError(error);
    const operationId = context.operationId || 'unknown';

    // Check circuit breaker
    if (this._isCircuitBreakerOpen(operationId)) {
      throw new Error(`Circuit breaker is open for ${operationId}`);
    }

    // Check if error is retryable
    if (!this._isRetryable(error, errorType)) {
      this._recordError(operationId, error);
      throw error;
    }

    // Attempt retry with exponential backoff
    let attempt = context.attempt || 0;
    let delay = this.config.initialRetryDelay * Math.pow(this.config.retryMultiplier, attempt);

    // Cap delay
    delay = Math.min(delay, this.config.maxRetryDelay);

    // Increment error count
    this._recordError(operationId, error);

    // Check if max retries exceeded
    if (attempt >= this.config.maxRetries) {
      // Check circuit breaker
      this._checkCircuitBreaker(operationId);

      // Add to dead letter queue if enabled
      if (this.config.enableDeadLetterQueue) {
        this._addToDeadLetterQueue({
          error,
          context,
          operationId,
          timestamp: new Date().toISOString(),
        });
      }

      throw new Error(`Max retries exceeded for ${operationId}: ${error.message}`);
    }

    // Wait before retry
    await this._sleep(delay);

    // Execute retry
    try {
      return await retryFn();
    } catch (retryError) {
      return this.handleError(retryError, retryFn, {
        ...context,
        attempt: attempt + 1,
      });
    }
  }

  /**
   * Classify error type
   * @private
   */
  _classifyError(error) {
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return 'timeout';
    }
    if (error.message.includes('rate limit') || error.statusCode === 429) {
      return 'rate_limit';
    }
    if (error.statusCode >= 500) {
      return 'server_error';
    }
    if (error.statusCode >= 400) {
      return 'client_error';
    }
    if (error.message.includes('network') || error.message.includes('ECONN')) {
      return 'network_error';
    }
    return 'unknown';
  }

  /**
   * Check if error is retryable
   * @private
   */
  _isRetryable(error, errorType) {
    const retryableTypes = ['timeout', 'rate_limit', 'server_error', 'network_error'];
    return retryableTypes.includes(errorType);
  }

  /**
   * Record error
   * @private
   */
  _recordError(operationId, error) {
    if (!this.errorCounts.has(operationId)) {
      this.errorCounts.set(operationId, {
        count: 0,
        lastError: null,
        lastErrorTime: null,
      });
    }

    const stats = this.errorCounts.get(operationId);
    stats.count++;
    stats.lastError = error.message;
    stats.lastErrorTime = new Date().toISOString();
  }

  /**
   * Check circuit breaker
   * @private
   */
  _checkCircuitBreaker(operationId) {
    const stats = this.errorCounts.get(operationId);
    if (!stats) {
      return;
    }

    if (stats.count >= this.config.circuitBreakerThreshold) {
      this.circuitBreakers.set(operationId, {
        openedAt: Date.now(),
        errorCount: stats.count,
        lastError: stats.lastError,
      });
    }
  }

  /**
   * Check if circuit breaker is open
   * @private
   */
  _isCircuitBreakerOpen(operationId) {
    const breaker = this.circuitBreakers.get(operationId);
    if (!breaker) {
      return false;
    }

    // Check if timeout has passed
    const timeSinceOpened = Date.now() - breaker.openedAt;
    if (timeSinceOpened > this.config.circuitBreakerTimeout) {
      // Reset circuit breaker
      this.circuitBreakers.delete(operationId);
      this.errorCounts.delete(operationId);
      return false;
    }

    return true;
  }

  /**
   * Add to dead letter queue
   * @private
   */
  _addToDeadLetterQueue(item) {
    this.deadLetterQueue.push(item);

    // Limit queue size
    if (this.deadLetterQueue.length > 1000) {
      this.deadLetterQueue.shift();
    }
  }

  /**
   * Get dead letter queue items
   *
   * @param {number} limit - Maximum items to return
   * @returns {Array} Dead letter queue items
   */
  getDeadLetterQueue(limit = 100) {
    return this.deadLetterQueue.slice(0, limit);
  }

  /**
   * Retry dead letter queue item
   *
   * @param {string} itemId - Item ID
   * @param {Function} retryFn - Retry function
   * @returns {Promise<any>} Result
   */
  async retryDeadLetterItem(itemId, retryFn) {
    const item = this.deadLetterQueue.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in dead letter queue`);
    }

    // Remove from queue
    const index = this.deadLetterQueue.indexOf(item);
    if (index > -1) {
      this.deadLetterQueue.splice(index, 1);
    }

    // Retry
    return retryFn();
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    this.deadLetterQueue = [];
  }

  /**
   * Register custom error handler
   *
   * @param {string} errorType - Error type
   * @param {Function} handler - Handler function
   */
  registerErrorHandler(errorType, handler) {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * Handle error with custom handler
   *
   * @param {Error} error - Error to handle
   * @param {string} errorType - Error type
   */
  handleWithCustomHandler(error, errorType) {
    const handler = this.errorHandlers.get(errorType);
    if (handler) {
      return handler(error);
    }
    return null;
  }

  /**
   * Get error statistics
   *
   * @param {string} operationId - Operation ID
   * @returns {Object} Error statistics
   */
  getErrorStats(operationId) {
    const stats = this.errorCounts.get(operationId);
    const breaker = this.circuitBreakers.get(operationId);

    return {
      operationId,
      errorCount: stats?.count || 0,
      lastError: stats?.lastError || null,
      lastErrorTime: stats?.lastErrorTime || null,
      circuitBreakerOpen: !!breaker,
      circuitBreakerOpenedAt: breaker?.openedAt || null,
    };
  }

  /**
   * Reset error tracking for operation
   *
   * @param {string} operationId - Operation ID
   */
  resetOperation(operationId) {
    this.errorCounts.delete(operationId);
    this.circuitBreakers.delete(operationId);
  }

  /**
   * Sleep utility
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  destroy() {
    this.errorCounts.clear();
    this.circuitBreakers.clear();
    this.deadLetterQueue = [];
    this.errorHandlers.clear();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZapierErrorHandler };
}
