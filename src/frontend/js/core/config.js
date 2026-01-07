/**
 * Configuration Management for Jobsprint
 *
 * Centralized configuration management with:
 * - Environment-based configuration
 * - Runtime configuration updates
 * - Configuration validation
 * - Persistence via Puter.js
 *
 * @module Config
 * @author Jobsprint Team
 * @license MIT
 */

import { PuterIntegration } from './puter.js';

/**
 * Configuration management class
 */
class ConfigManager {
    /**
     * Creates a ConfigManager instance
     * @param {Object} options - Configuration options
     * @param {PuterIntegration} options.puter - PuterIntegration instance
     * @param {string} options.env - Environment (default: 'development')
     */
    constructor(options = {}) {
        this.puter = options.puter;
        this.env = options.env || 'development';
        this.config = {};
        this.configPath = 'jobsprint/config.json';
        this.watchers = new Map();

        // Default configuration
        this.defaults = {
            app: {
                name: 'Jobsprint',
                version: '1.0.0',
                debug: true
            },
            puter: {
                appName: 'Jobsprint',
                maxRetries: 3,
                retryDelay: 1000,
                debugMode: false
            },
            ai: {
                defaultModel: 'gpt-3.5-turbo',
                maxTokens: 2000,
                temperature: 0.7,
                timeout: 30000
            },
            storage: {
                maxFileSize: 10485760, // 10MB
                allowedTypes: ['.json', '.txt', '.md', '.js', '.html', '.css'],
                basePath: 'jobsprint'
            },
            features: {
                enableAI: true,
                enableStorage: true,
                enableWorkflows: true,
                enableMonitoring: true
            },
            security: {
                maxConcurrentRequests: 10,
                rateLimitWindow: 60000,
                maxRequestsPerWindow: 100
            }
        };

        this._mergeDefaults();
    }

    /**
     * Initialize configuration manager
     * @returns {Promise<boolean>}
     */
    async initialize() {
        try {
            // Try to load saved configuration
            const saved = await this.load();
            if (saved) {
                this._mergeDefaults();
            }
            return true;
        } catch (error) {
            console.log('No saved config found, using defaults');
            this._mergeDefaults();
            return true;
        }
    }

    /**
     * Get configuration value by path
     * @param {string} path - Dot-notation path (e.g., 'ai.maxTokens')
     * @param {any} defaultValue - Default value if not found
     * @returns {any} Configuration value
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Set configuration value by path
     * @param {string} path - Dot-notation path
     * @param {any} value - Value to set
     * @returns {boolean}
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        const lastKey = keys[keys.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;

        this._notifyWatchers(path, value, oldValue);
        return true;
    }

    /**
     * Get all configuration
     * @returns {Object} Complete configuration object
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Set multiple configuration values
     * @param {Object} updates - Configuration updates
     * @returns {boolean}
     */
    setMany(updates) {
        Object.keys(updates).forEach(path => {
            this.set(path, updates[path]);
        });
        return true;
    }

    /**
     * Reset configuration to defaults
     * @returns {boolean}
     */
    reset() {
        this.config = JSON.parse(JSON.stringify(this.defaults));
        this._notifyWatchers('*', this.config, null);
        return true;
    }

    /**
     * Validate configuration
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validate(config = this.config) {
        const errors = [];
        const warnings = [];

        // Validate AI config
        if (config.ai) {
            if (config.ai.maxTokens < 1 || config.ai.maxTokens > 32000) {
                errors.push('ai.maxTokens must be between 1 and 32000');
            }
            if (config.ai.temperature < 0 || config.ai.temperature > 2) {
                errors.push('ai.temperature must be between 0 and 2');
            }
        }

        // Validate storage config
        if (config.storage) {
            if (config.storage.maxFileSize < 0) {
                errors.push('storage.maxFileSize must be positive');
            }
        }

        // Validate security config
        if (config.security) {
            if (config.security.maxConcurrentRequests < 1) {
                errors.push('security.maxConcurrentRequests must be at least 1');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Save configuration to Puter.js storage
     * @returns {Promise<boolean>}
     */
    async save() {
        try {
            if (!this.puter) {
                throw new Error('PuterIntegration instance required');
            }

            // Validate before saving
            const validation = this.validate();
            if (!validation.valid) {
                throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
            }

            // Ensure directory exists
            await this.puter.ensureDirectory('jobsprint');

            // Save configuration
            await this.puter.writeFile(
                this.configPath,
                JSON.stringify(this.config, null, 2)
            );

            console.log('Configuration saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            throw error;
        }
    }

    /**
     * Load configuration from Puter.js storage
     * @returns {Promise<Object>} Loaded configuration
     */
    async load() {
        try {
            if (!this.puter) {
                throw new Error('PuterIntegration instance required');
            }

            const content = await this.puter.readJSONFile(this.configPath);
            this.config = content;
            console.log('Configuration loaded successfully');
            return this.config;
        } catch (error) {
            console.error('Failed to load configuration:', error);
            throw error;
        }
    }

    /**
     * Export configuration as JSON string
     * @returns {string} JSON configuration
     */
    export() {
        return JSON.stringify(this.config, null, 2);
    }

    /**
     * Import configuration from JSON string
     * @param {string} jsonConfig - JSON configuration string
     * @returns {boolean}
     */
    import(jsonConfig) {
        try {
            const imported = JSON.parse(jsonConfig);
            const validation = this.validate(imported);

            if (!validation.valid) {
                throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
            }

            this.config = imported;
            this._notifyWatchers('*', this.config, null);
            return true;
        } catch (error) {
            console.error('Failed to import configuration:', error);
            throw error;
        }
    }

    /**
     * Watch for configuration changes
     * @param {string} path - Path to watch (use '*' for all)
     * @param {Function} callback - Callback function
     * @returns {Function} Unwatch function
     */
    watch(path, callback) {
        if (!this.watchers.has(path)) {
            this.watchers.set(path, []);
        }
        this.watchers.get(path).push(callback);

        // Return unwatch function
        return () => {
            const callbacks = this.watchers.get(path);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Get environment-specific configuration
     * @returns {Object} Environment configuration
     */
    getEnvironmentConfig() {
        const envConfigs = {
            development: {
                debug: true,
                logLevel: 'debug',
                apiTimeout: 30000
            },
            staging: {
                debug: true,
                logLevel: 'info',
                apiTimeout: 20000
            },
            production: {
                debug: false,
                logLevel: 'warn',
                apiTimeout: 10000
            }
        };

        return envConfigs[this.env] || envConfigs.development;
    }

    /**
     * Merge default configuration
     * @private
     */
    _mergeDefaults() {
        // Deep merge defaults with current config
        this.config = this._deepMerge(this.defaults, this.config);
    }

    /**
     * Deep merge objects
     * @private
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    _deepMerge(target, source) {
        const output = { ...target };

        if (source && typeof source === 'object') {
            Object.keys(source).forEach(key => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    output[key] = this._deepMerge(
                        target[key] || {},
                        source[key]
                    );
                } else {
                    output[key] = source[key];
                }
            });
        }

        return output;
    }

    /**
     * Notify watchers of configuration changes
     * @private
     * @param {string} path - Changed path
     * @param {any} newValue - New value
     * @param {any} oldValue - Old value
     */
    _notifyWatchers(path, newValue, oldValue) {
        // Notify watchers for specific path
        if (this.watchers.has(path)) {
            this.watchers.get(path).forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('Config watcher error:', error);
                }
            });
        }

        // Notify global watchers
        if (this.watchers.has('*')) {
            this.watchers.get('*').forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('Config watcher error:', error);
                }
            });
        }
    }

    /**
     * Get configuration schema for validation
     * @returns {Object} Configuration schema
     */
    getSchema() {
        return {
            app: {
                name: 'string',
                version: 'string',
                debug: 'boolean'
            },
            puter: {
                appName: 'string',
                maxRetries: 'number',
                retryDelay: 'number',
                debugMode: 'boolean'
            },
            ai: {
                defaultModel: 'string',
                maxTokens: 'number',
                temperature: 'number',
                timeout: 'number'
            },
            storage: {
                maxFileSize: 'number',
                allowedTypes: 'array',
                basePath: 'string'
            },
            features: {
                enableAI: 'boolean',
                enableStorage: 'boolean',
                enableWorkflows: 'boolean',
                enableMonitoring: 'boolean'
            },
            security: {
                maxConcurrentRequests: 'number',
                rateLimitWindow: 'number',
                maxRequestsPerWindow: 'number'
            }
        };
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager };
}
