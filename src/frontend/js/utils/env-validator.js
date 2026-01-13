/**
 * Environment Variable Validation Utility
 * Validates required environment variables at startup
 */

import { logger } from './logger.js';

/**
 * Validates that required environment variables are set
 * @param {Object} requiredVars - Object mapping variable names to validation rules
 * @throws {Error} - Throws if validation fails
 */
export function validateEnv(requiredVars) {
    const missing = [];
    const invalid = [];

    for (const [varName, options] of Object.entries(requiredVars)) {
        const value = process.env[varName];

        // Check if variable is missing
        if (!value) {
            if (options.required) {
                missing.push(varName);
            }
            continue;
        }

        // Validate format if validator provided
        if (options.validator && !options.validator(value)) {
            invalid.push({
                var: varName,
                value: value,
                reason: options.validationReason || 'Invalid format'
            });
        }
    }

    // Report missing variables
    if (missing.length > 0) {
        const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Report invalid variables
    if (invalid.length > 0) {
        const errorMsg = invalid
            .map(({ var: v, value, reason }) => `${v}="${value}" (${reason})`)
            .join('\n  ');
        logger.error(`Invalid environment variables:\n  ${errorMsg}`);
        throw new Error('Invalid environment variables');
    }

    logger.info('Environment variables validated successfully');
}

/**
 * URL validator for environment variables
 * @param {string} value - URL to validate
 * @returns {boolean}
 */
export function isValidUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Common environment variable validators
 */
export const validators = {
    url: isValidUrl,
    port: (value) => {
        const port = parseInt(value, 10);
        return !isNaN(port) && port > 0 && port < 65536;
    },
    apiKey: (value) => value && value.length > 0,
};
