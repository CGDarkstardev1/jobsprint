/**
 * Zapier Integration Utilities
 *
 * Helper functions and utilities for Zapier MCP integration.
 *
 * @module ZapierUtils
 */

/**
 * Validate Zapier action parameters
 *
 * @param {Object} params - Parameters to validate
 * @param {Object} schema - Parameter schema
 * @returns {Object} Validation result
 */
function validateParams(params, schema) {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in params)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check field types
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (field in params) {
        const value = params[field];
        const expectedType = fieldSchema.type;

        // Type validation
        if (expectedType === 'string' && typeof value !== 'string') {
          errors.push(`Field ${field} must be a string`);
        }
        if (expectedType === 'number' && typeof value !== 'number') {
          errors.push(`Field ${field} must be a number`);
        }
        if (expectedType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Field ${field} must be a boolean`);
        }
        if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Field ${field} must be an array`);
        }
        if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
          errors.push(`Field ${field} must be an object`);
        }

        // Enum validation
        if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
          errors.push(`Field ${field} must be one of: ${fieldSchema.enum.join(', ')}`);
        }

        // Range validation for numbers
        if (expectedType === 'number') {
          if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
            errors.push(`Field ${field} must be >= ${fieldSchema.minimum}`);
          }
          if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
            errors.push(`Field ${field} must be <= ${fieldSchema.maximum}`);
          }
        }

        // String length validation
        if (expectedType === 'string') {
          if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors.push(`Field ${field} must be >= ${fieldSchema.minLength} characters`);
          }
          if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            errors.push(`Field ${field} must be <= ${fieldSchema.maxLength} characters`);
          }
        }

        // Pattern validation
        if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
          errors.push(`Field ${field} does not match pattern: ${fieldSchema.pattern}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Transform parameters using template variables
 *
 * @param {Object} params - Parameters with templates
 * @param {Object} context - Context data for templates
 * @returns {Object} Transformed parameters
 */
function transformParams(params, context = {}) {
  const transformed = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Replace template variables
      transformed[key] = value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const keys = path.split('.');
        let result = context;

        for (const k of keys) {
          if (result && typeof result === 'object') {
            result = result[k];
          } else {
            return match; // Keep original if not found
          }
        }

        return result !== undefined ? result : match;
      });
    } else if (Array.isArray(value)) {
      transformed[key] = value.map(item =>
        typeof item === 'string' ? transformParams({ value: item }, context).value : item
      );
    } else if (typeof value === 'object' && value !== null) {
      transformed[key] = transformParams(value, context);
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
}

/**
 * Sanitize sensitive data for logging
 *
 * @param {Object} data - Data to sanitize
 * @param {Array} sensitiveFields - Fields to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeData(data, sensitiveFields = ['password', 'token', 'secret', 'apiKey']) {
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  // Nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value, sensitiveFields);
    }
  }

  return sanitized;
}

/**
 * Calculate exponential backoff delay
 *
 * @param {number} attempt - Current attempt number
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} multiplier - Delay multiplier
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(attempt, baseDelay = 1000, multiplier = 2, maxDelay = 30000) {
  const delay = baseDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Check if HTTP status code is retryable
 *
 * @param {number} statusCode - HTTP status code
 * @returns {boolean} Is retryable
 */
function isRetryableStatus(statusCode) {
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  return retryableStatusCodes.includes(statusCode);
}

/**
 * Format error message
 *
 * @param {Error} error - Error object
 * @returns {string} Formatted error message
 */
function formatError(error) {
  if (!error) return 'Unknown error';

  let message = error.message || 'Unknown error';

  if (error.statusCode) {
    message = `HTTP ${error.statusCode}: ${message}`;
  }

  if (error.code) {
    message = `${error.code}: ${message}`;
  }

  return message;
}

/**
 * Deep merge objects
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(target[key] || {}, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Create a debounced function
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Create a throttled function
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Parse action ID from various formats
 *
 * @param {string} actionId - Action ID in any format
 * @returns {Object} Parsed action ID components
 */
function parseActionId(actionId) {
  // Format: "app.action" or "app:action" or "app_action"
  const parts = actionId.split(/[.:_]/);

  if (parts.length >= 2) {
    return {
      app: parts[0],
      action: parts.slice(1).join('.'),
      full: actionId,
    };
  }

  return {
    app: null,
    action: actionId,
    full: actionId,
  };
}

/**
 * Generate unique ID
 *
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
function generateId(prefix = 'id') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Format duration in human-readable format
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Create a promise with timeout
 *
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} message - Timeout message
 * @returns {Promise} Promise with timeout
 */
function promiseWithTimeout(promise, timeoutMs, message = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeoutMs)
    ),
  ]);
}

/**
 * Retry function with exponential backoff
 *
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of function
 */
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    shouldRetry = () => true,
  } = options;

  let attempt = 0;
  let lastError;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      const delay = calculateBackoff(attempt, initialDelay, multiplier, maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw lastError;
}

/**
 * Create a rate limiter
 *
 * @param {number} maxRequests - Maximum requests
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Rate limiter function
 */
function createRateLimiter(maxRequests, windowMs) {
  const requests = [];

  return function rateLimit() {
    const now = Date.now();

    // Remove old requests outside the window
    while (requests.length > 0 && requests[0] <= now - windowMs) {
      requests.shift();
    }

    // Check if limit reached
    if (requests.length >= maxRequests) {
      const oldestRequest = requests[0];
      const waitTime = oldestRequest + windowMs - now;
      throw new Error(`Rate limit exceeded. Try again in ${waitTime}ms`);
    }

    // Add current request
    requests.push(now);
  };
}

/**
 * Batch array into chunks
 *
 * @param {Array} array - Array to batch
 * @param {number} size - Batch size
 * @returns {Array} Array of batches
 */
function batch(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

/**
 * Create a logger with context
 *
 * @param {string} context - Logger context
 * @returns {Object} Logger object
 */
function createLogger(context) {
  return {
    info: (message, data = {}) =>
      console.log(`[${context}] INFO:`, message, data),
    warn: (message, data = {}) =>
      console.warn(`[${context}] WARN:`, message, data),
    error: (message, data = {}) =>
      console.error(`[${context}] ERROR:`, message, data),
    debug: (message, data = {}) =>
      console.debug(`[${context}] DEBUG:`, message, data),
  };
}

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
  };
}
