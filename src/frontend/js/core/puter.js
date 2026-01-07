/**
 * Puter.js Integration Layer for Jobsprint
 *
 * Provides a comprehensive abstraction layer for Puter.js SDK including:
 * - SDK initialization and configuration
 * - User authentication handling
 * - Cloud storage operations
 * - File upload/download management
 * - User session management
 * - Error handling and retry logic
 *
 * @module PuterIntegration
 * @author Jobsprint Team
 * @license MIT
 */

// Puter.js SDK will be loaded from: https://js.puter.com/v2/

/**
 * Custom error class for Puter.js operations
 */
class PuterError extends Error {
    constructor(message, code, details = null) {
        super(message);
        this.name = 'PuterError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Main Puter.js integration class
 */
class PuterIntegration {
    /**
     * Creates a new PuterIntegration instance
     * @param {Object} config - Configuration options
     * @param {string} config.appName - Application name
     * @param {number} config.maxRetries - Maximum retry attempts (default: 3)
     * @param {number} config.retryDelay - Base retry delay in ms (default: 1000)
     * @param {boolean} config.debugMode - Enable debug logging (default: false)
     */
    constructor(config = {}) {
        this.config = {
            appName: config.appName || 'Jobsprint',
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            debugMode: config.debugMode || false,
        };

        this.isInitialized = false;
        this.currentUser = null;
        this.authCallbacks = new Map();
        this.eventListeners = new Map();

        this._log('PuterIntegration instance created');
    }

    /**
     * Initialize Puter.js SDK
     * Must be called before any other operations
     * @returns {Promise<boolean>} True if initialization successful
     */
    async initialize() {
        try {
            if (typeof puter === 'undefined') {
                throw new PuterError(
                    'Puter.js SDK not loaded. Include: <script src="https://js.puter.com/v2/"></script>',
                    'SDK_NOT_LOADED'
                );
            }

            // Check if user is already signed in
            this.isInitialized = true;
            const signedIn = await this.isAuthenticated();

            if (signedIn) {
                this.currentUser = await puter.auth.getUser();
                this._log('Initialized with authenticated user:', this.currentUser);
            } else {
                this._log('Initialized without authentication');
            }

            // Setup global event handlers
            this._setupEventHandlers();

            return true;
        } catch (error) {
            this._log('Initialization failed:', error);
            throw new PuterError(
                `Failed to initialize Puter.js: ${error.message}`,
                'INIT_FAILED',
                error
            );
        }
    }

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            return await puter.auth.isSignedIn();
        } catch (error) {
            this._log('Auth check failed:', error);
            return false;
        }
    }

    /**
     * Sign in user with Puter.js
     * @param {Function} onSuccess - Callback on successful sign in
     * @param {Function} onError - Callback on sign in error
     * @returns {Promise<Object>}
     */
    async signIn(onSuccess = null, onError = null) {
        try {
            this._log('Starting sign in process...');

            const result = await puter.auth.signIn();

            if (result) {
                this.currentUser = await puter.auth.getUser();
                this._log('Sign in successful:', this.currentUser);

                if (typeof onSuccess === 'function') {
                    onSuccess(this.currentUser);
                }

                this._triggerEvent('auth:signIn', this.currentUser);
                return this.currentUser;
            }
        } catch (error) {
            this._log('Sign in failed:', error);
            if (typeof onError === 'function') {
                onError(error);
            }
            throw new PuterError(
                `Sign in failed: ${error.message}`,
                'AUTH_FAILED',
                error
            );
        }
    }

    /**
     * Sign out current user
     * @returns {Promise<boolean>}
     */
    async signOut() {
        try {
            await puter.auth.signOut();
            const oldUser = this.currentUser;
            this.currentUser = null;
            this._log('Sign out successful');

            this._triggerEvent('auth:signOut', oldUser);
            return true;
        } catch (error) {
            this._log('Sign out failed:', error);
            throw new PuterError(
                `Sign out failed: ${error.message}`,
                'SIGNOUT_FAILED',
                error
            );
        }
    }

    /**
     * Get current user information
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
        try {
            if (!this.currentUser) {
                this.currentUser = await puter.auth.getUser();
            }
            return this.currentUser;
        } catch (error) {
            this._log('Get user failed:', error);
            return null;
        }
    }

    /**
     * Write data to a file in cloud storage
     * @param {string} path - File path
     * @param {string|Blob|ArrayBuffer} data - Data to write
     * @param {Object} options - Write options
     * @returns {Promise<Object>} File metadata
     */
    async writeFile(path, data, options = {}) {
        return this._retryOperation(
            async () => {
                this._log(`Writing file: ${path}`);
                const result = await puter.fs.write(path, data, options);
                this._log(`File written successfully: ${path}`);
                this._triggerEvent('fs:write', { path, result });
                return result;
            },
            'writeFile',
            { path }
        );
    }

    /**
     * Read data from a file in cloud storage
     * @param {string} path - File path
     * @param {Object} options - Read options
     * @returns {Promise<Blob>} File data as blob
     */
    async readFile(path, options = {}) {
        return this._retryOperation(
            async () => {
                this._log(`Reading file: ${path}`);
                const result = await puter.fs.read(path, options);
                this._log(`File read successfully: ${path}`);
                this._triggerEvent('fs:read', { path, size: result.size });
                return result;
            },
            'readFile',
            { path }
        );
    }

    /**
     * Read text content from a file
     * @param {string} path - File path
     * @returns {Promise<string>} File content as text
     */
    async readTextFile(path) {
        const blob = await this.readFile(path);
        return await blob.text();
    }

    /**
     * Read JSON content from a file
     * @param {string} path - File path
     * @returns {Promise<Object>} Parsed JSON object
     */
    async readJSONFile(path) {
        const content = await this.readTextFile(path);
        return JSON.parse(content);
    }

    /**
     * Create a directory
     * @param {string} path - Directory path
     * @param {Object} options - Directory options
     * @returns {Promise<Object>} Directory metadata
     */
    async createDirectory(path, options = {}) {
        return this._retryOperation(
            async () => {
                this._log(`Creating directory: ${path}`);
                const result = await puter.fs.mkdir(path, options);
                this._log(`Directory created successfully: ${path}`);
                this._triggerEvent('fs:mkdir', { path, result });
                return result;
            },
            'createDirectory',
            { path }
        );
    }

    /**
     * List contents of a directory
     * @param {string} path - Directory path
     * @returns {Promise<Array>} Array of file/directory items
     */
    async listDirectory(path = './') {
        return this._retryOperation(
            async () => {
                this._log(`Listing directory: ${path}`);
                const items = await puter.fs.readdir(path);
                this._log(`Directory listed: ${path}, items: ${items.length}`);
                this._triggerEvent('fs:readdir', { path, count: items.length });
                return items;
            },
            'listDirectory',
            { path }
        );
    }

    /**
     * Get file or directory metadata
     * @param {string} path - File/directory path
     * @returns {Promise<Object>} Metadata object
     */
    async getMetadata(path) {
        return this._retryOperation(
            async () => {
                this._log(`Getting metadata: ${path}`);
                const result = await puter.fs.stat(path);
                this._log(`Metadata retrieved: ${path}`);
                return result;
            },
            'getMetadata',
            { path }
        );
    }

    /**
     * Delete a file or directory
     * @param {string} path - Path to delete
     * @returns {Promise<boolean>}
     */
    async delete(path) {
        return this._retryOperation(
            async () => {
                this._log(`Deleting: ${path}`);
                await puter.fs.delete(path);
                this._log(`Deleted successfully: ${path}`);
                this._triggerEvent('fs:delete', { path });
                return true;
            },
            'delete',
            { path }
        );
    }

    /**
     * Rename a file or directory
     * @param {string} oldPath - Current path
     * @param {string} newPath - New path/name
     * @returns {Promise<Object>}
     */
    async rename(oldPath, newPath) {
        return this._retryOperation(
            async () => {
                this._log(`Renaming: ${oldPath} -> ${newPath}`);
                const result = await puter.fs.rename(oldPath, newPath);
                this._log(`Renamed successfully`);
                this._triggerEvent('fs:rename', { oldPath, newPath });
                return result;
            },
            'rename',
            { oldPath, newPath }
        );
    }

    /**
     * Copy a file or directory
     * @param {string} sourcePath - Source path
     * @param {string} targetPath - Target path
     * @returns {Promise<Object>}
     */
    async copy(sourcePath, targetPath) {
        return this._retryOperation(
            async () => {
                this._log(`Copying: ${sourcePath} -> ${targetPath}`);
                const result = await puter.fs.copy(sourcePath, targetPath);
                this._log(`Copied successfully`);
                this._triggerEvent('fs:copy', { sourcePath, targetPath });
                return result;
            },
            'copy',
            { sourcePath, targetPath }
        );
    }

    /**
     * Move a file or directory
     * @param {string} sourcePath - Source path
     * @param {string} targetPath - Target path
     * @returns {Promise<Object>}
     */
    async move(sourcePath, targetPath) {
        return this._retryOperation(
            async () => {
                this._log(`Moving: ${sourcePath} -> ${targetPath}`);
                const result = await puter.fs.move(sourcePath, targetPath);
                this._log(`Moved successfully`);
                this._triggerEvent('fs:move', { sourcePath, targetPath });
                return result;
            },
            'move',
            { sourcePath, targetPath }
        );
    }

    /**
     * Upload files from local system
     * @param {FileList|Array} files - Files to upload
     * @param {string} path - Target directory path
     * @returns {Promise<Array>} Array of uploaded file metadata
     */
    async uploadFiles(files, path = './') {
        try {
            this._log(`Uploading ${files.length} file(s) to: ${path}`);

            const uploadPromises = Array.from(files).map(async (file) => {
                const result = await puter.fs.upload(file, path);
                this._log(`Uploaded: ${file.name} -> ${result.path}`);
                return result;
            });

            const results = await Promise.all(uploadPromises);
            this._triggerEvent('fs:upload', { path, count: results.length });

            return results;
        } catch (error) {
            this._log('Upload failed:', error);
            throw new PuterError(
                `File upload failed: ${error.message}`,
                'UPLOAD_FAILED',
                error
            );
        }
    }

    /**
     * Get a read URL for a file
     * @param {string} path - File path
     * @returns {Promise<string>} Read URL
     */
    async getReadURL(path) {
        try {
            this._log(`Getting read URL: ${path}`);
            const url = await puter.fs.getReadURL(path);
            this._log(`Read URL generated for: ${path}`);
            return url;
        } catch (error) {
            this._log('Get read URL failed:', error);
            throw new PuterError(
                `Failed to get read URL: ${error.message}`,
                'URL_FAILED',
                error
            );
        }
    }

    /**
     * Save data to key-value store
     * @param {string} key - Key to save
     * @param {any} value - Value to save
     * @returns {Promise<boolean>}
     */
    async setKV(key, value) {
        return this._retryOperation(
            async () => {
                this._log(`Setting KV: ${key}`);
                await puter.kv.set(key, value);
                this._log(`KV set successfully: ${key}`);
                this._triggerEvent('kv:set', { key });
                return true;
            },
            'setKV',
            { key }
        );
    }

    /**
     * Get data from key-value store
     * @param {string} key - Key to retrieve
     * @returns {Promise<any>} Value associated with key
     */
    async getKV(key) {
        return this._retryOperation(
            async () => {
                this._log(`Getting KV: ${key}`);
                const value = await puter.kv.get(key);
                this._log(`KV retrieved: ${key}`);
                return value;
            },
            'getKV',
            { key }
        );
    }

    /**
     * Delete key from key-value store
     * @param {string} key - Key to delete
     * @returns {Promise<boolean>}
     */
    async deleteKV(key) {
        return this._retryOperation(
            async () => {
                this._log(`Deleting KV: ${key}`);
                await puter.kv.del(key);
                this._log(`KV deleted: ${key}`);
                this._triggerEvent('kv:delete', { key });
                return true;
            },
            'deleteKV',
            { key }
        );
    }

    /**
     * Increment a counter in key-value store
     * @param {string} key - Key to increment
     * @param {number} amount - Amount to increment by
     * @returns {Promise<number>} New value
     */
    async incrementKV(key, amount = 1) {
        return this._retryOperation(
            async () => {
                this._log(`Incrementing KV: ${key} by ${amount}`);
                const newValue = await puter.kv.incr(key, amount);
                this._log(`KV incremented: ${key} = ${newValue}`);
                return newValue;
            },
            'incrementKV',
            { key, amount }
        );
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
        this._log(`Event listener added: ${event}`);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                this._log(`Event listener removed: ${event}`);
            }
        }
    }

    /**
     * Trigger event
     * @private
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    _triggerEvent(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this._log(`Event callback error (${event}):`, error);
                }
            });
        }
    }

    /**
     * Setup global event handlers
     * @private
     */
    _setupEventHandlers() {
        // Listen for Puter.js authentication changes
        if (puter && puter.auth) {
            // These are example events - Puter.js may have different events
            this._log('Event handlers setup');
        }
    }

    /**
     * Retry operation with exponential backoff
     * @private
     * @param {Function} operation - Operation to retry
     * @param {string} operationName - Operation name for logging
     * @param {Object} context - Operation context
     * @returns {Promise<any>}
     */
    async _retryOperation(operation, operationName, context = {}) {
        let lastError;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                this._log(`${operationName} failed (attempt ${attempt}/${this.config.maxRetries}):`, error.message);

                if (attempt < this.config.maxRetries) {
                    const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                    this._log(`Retrying in ${delay}ms...`);
                    await this._sleep(delay);
                }
            }
        }

        throw new PuterError(
            `${operationName} failed after ${this.config.maxRetries} attempts`,
            'MAX_RETRIES_EXCEEDED',
            { originalError: lastError, context }
        );
    }

    /**
     * Sleep for specified milliseconds
     * @private
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Logging utility
     * @private
     * @param {...any} args - Arguments to log
     */
    _log(...args) {
        if (this.config.debugMode) {
            console.log(`[PuterIntegration ${new Date().toISOString()}]`, ...args);
        }
    }

    /**
     * Get usage statistics
     * @returns {Promise<Object>} Usage data
     */
    async getUsage() {
        try {
            const usage = await puter.auth.getMonthlyUsage();
            this._log('Usage retrieved:', usage);
            return usage;
        } catch (error) {
            this._log('Get usage failed:', error);
            return null;
        }
    }

    /**
     * Check if path exists
     * @param {string} path - Path to check
     * @returns {Promise<boolean>}
     */
    async exists(path) {
        try {
            await puter.fs.stat(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Ensure directory exists, create if not
     * @param {string} path - Directory path
     * @returns {Promise<boolean>}
     */
    async ensureDirectory(path) {
        try {
            const exists = await this.exists(path);
            if (!exists) {
                await this.createDirectory(path);
                this._log(`Directory ensured: ${path}`);
            }
            return true;
        } catch (error) {
            this._log('Ensure directory failed:', error);
            throw new PuterError(
                `Failed to ensure directory: ${error.message}`,
                'ENSURE_DIR_FAILED',
                error
            );
        }
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PuterIntegration, PuterError };
}
