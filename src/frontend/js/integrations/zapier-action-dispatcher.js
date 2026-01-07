/**
 * Zapier Action Dispatcher
 *
 * Manages action execution with advanced features:
 * - Rate limiting and throttling
 * - Parallel execution
 * - Batch processing
 * - Priority queues
 *
 * @module ZapierActionDispatcher
 */

class ZapierActionDispatcher {
  /**
   * Initialize action dispatcher
   *
   * @param {ZapierMCPClient} client - Zapier MCP client instance
   * @param {Object} config - Configuration options
   */
  constructor(client, config = {}) {
    this.client = client;

    this.config = {
      maxConcurrent: config.maxConcurrent || 5,
      maxQueueSize: config.maxQueueSize || 100,
      defaultTimeout: config.defaultTimeout || 30000,
      enableBatching: config.enableBatching !== false,
      maxBatchSize: config.maxBatchSize || 10,
      batchDelayMs: config.batchDelayMs || 100,
    };

    this.actionQueue = [];
    this.activeExecutions = new Map();
    this.batchGroups = new Map();

    this.isProcessing = false;
    this.processTimer = null;
  }

  /**
   * Dispatch an action for execution
   *
   * @param {string} actionId - Action identifier
   * @param {Object} params - Action parameters
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async dispatch(actionId, params, options = {}) {
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.actionQueue.length >= this.config.maxQueueSize) {
        reject(new Error('Action queue is full'));
        return;
      }

      // Add to queue
      const job = {
        actionId,
        params,
        options,
        resolve,
        reject,
        queuedAt: Date.now(),
        priority: options.priority || 0,
        batchId: options.batchId || null,
      };

      this.actionQueue.push(job);
      this.actionQueue.sort((a, b) => b.priority - a.priority);

      // Start processing if not already running
      if (!this.isProcessing) {
        this._processQueue();
      }
    });
  }

  /**
   * Dispatch multiple actions in batch
   *
   * @param {Array} actions - Array of action objects
   * @param {Object} options - Batch options
   * @returns {Promise<Array>} Array of results
   */
  async dispatchBatch(actions, options = {}) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create batch promises
    const promises = actions.map(({ actionId, params }) =>
      this.dispatch(actionId, params, {
        ...options,
        batchId,
      })
    );

    // Wait for all actions to complete
    try {
      const results = await Promise.all(promises);
      return {
        success: true,
        batchId,
        results,
        count: results.length,
      };
    } catch (error) {
      return {
        success: false,
        batchId,
        error: error.message,
        results: [],
      };
    }
  }

  /**
   * Dispatch actions with parallelism limit
   *
   * @param {Array} actions - Array of action objects
   * @param {number} concurrency - Maximum concurrent executions
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Array of results
   */
  async dispatchParallel(actions, concurrency = 5, options = {}) {
    const results = [];
    const executing = [];

    for (const action of actions) {
      const promise = this.dispatch(action.actionId, action.params, options).then(
        result => ({ success: true, result }),
        error => ({ success: false, error: error.message })
      );

      results.push(promise);
      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        // Remove completed from executing array
        const settled = executing.filter(p => {
          const state = p._state || 'pending';
          return state === 'pending';
        });
        executing.length = 0;
        executing.push(...settled);
      }
    }

    return Promise.all(results);
  }

  /**
   * Process action queue
   * @private
   */
  async _processQueue() {
    this.isProcessing = true;

    while (this.actionQueue.length > 0) {
      // Check concurrent limit
      if (this.activeExecutions.size >= this.config.maxConcurrent) {
        await this._waitForSlot();
        continue;
      }

      // Get next job
      const job = this.actionQueue.shift();

      // Skip if job was cancelled
      if (job.cancelled) {
        continue;
      }

      // Execute job
      this._executeJob(job);
    }

    this.isProcessing = false;
  }

  /**
   * Execute a single job
   * @private
   */
  async _executeJob(job) {
    const { actionId, params, options, resolve, reject } = job;

    const executionId = `${actionId}_${Date.now()}`;
    this.activeExecutions.set(executionId, job);

    try {
      // Execute action
      const result = await this.client.executeAction(actionId, params, {
        timeout: options.timeout || this.config.defaultTimeout,
      });

      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Wait for execution slot
   * @private
   */
  async _waitForSlot() {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.activeExecutions.size < this.config.maxConcurrent) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Cancel queued job
   *
   * @param {string} actionId - Action identifier
   * @returns {number} Number of cancelled jobs
   */
  cancelQueued(actionId) {
    let cancelled = 0;

    for (const job of this.actionQueue) {
      if (job.actionId === actionId && !job.cancelled) {
        job.cancelled = true;
        job.reject(new Error('Job cancelled'));
        cancelled++;
      }
    }

    return cancelled;
  }

  /**
   * Get queue status
   *
   * @returns {Object} Queue status
   */
  getQueueStatus() {
    const queued = this.actionQueue.filter(j => !j.cancelled).length;
    const active = this.activeExecutions.size;

    return {
      queued,
      active,
      maxConcurrent: this.config.maxConcurrent,
      utilization: (active / this.config.maxConcurrent) * 100,
    };
  }

  /**
   * Get execution statistics
   *
   * @returns {Object} Execution statistics
   */
  getStats() {
    return {
      queueSize: this.actionQueue.length,
      activeExecutions: this.activeExecutions.size,
      maxConcurrent: this.config.maxConcurrent,
      maxQueueSize: this.config.maxQueueSize,
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    for (const job of this.actionQueue) {
      if (!job.cancelled) {
        job.cancelled = true;
        job.reject(new Error('Queue cleared'));
      }
    }

    this.actionQueue = [];
  }

  /**
   * Wait for all queued jobs to complete
   *
   * @returns {Promise<void>}
   */
  async drain() {
    while (this.isProcessing || this.actionQueue.length > 0 || this.activeExecutions.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Cleanup dispatcher
   */
  async destroy() {
    // Clear queue
    this.clearQueue();

    // Wait for active executions
    await this.drain();

    // Clear timers
    if (this.processTimer) {
      clearTimeout(this.processTimer);
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZapierActionDispatcher };
}
