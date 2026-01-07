/**
 * Puter.js Service
 * Handles all Puter.js cloud and AI operations
 */

export class PuterService {
    constructor() {
        this.isInitialized = false;
        thisputer = null;
    }

    /**
     * Initialize Puter.js SDK
     */
    async init() {
        try {
            // Check if Puter.js is available
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js SDK not loaded');
            }

            thisputer = puter;

            // Authenticate user (Puter.js handles this automatically)
            const user = await this.getUserInfo();
            console.log('Authenticated user:', user);

            this.isInitialized = true;
            return user;
        } catch (error) {
            console.error('Failed to initialize Puter.js:', error);
            throw error;
        }
    }

    /**
     * Get current user information
     */
    async getUserInfo() {
        if (!this.isInitialized) {
            throw new Error('PuterService not initialized');
        }

        try {
            const user = await thisputer.auth.getUser();
            return user;
        } catch (error) {
            console.error('Failed to get user info:', error);
            throw error;
        }
    }

    /**
     * Store data in Puter.js cloud storage
     */
    async storeData(key, value) {
        if (!this.isInitialized) {
            throw new Error('PuterService not initialized');
        }

        try {
            await thisputer.kv.set(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to store data:', error);
            throw error;
        }
    }

    /**
     * Retrieve data from Puter.js cloud storage
     */
    async getData(key) {
        if (!this.isInitialized) {
            throw new Error('PuterService not initialized');
        }

        try {
            const value = await thisputer.kv.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Failed to retrieve data:', error);
            throw error;
        }
    }

    /**
     * Call AI model via Puter.js
     */
    async callAI(prompt, options = {}) {
        if (!this.isInitialized) {
            throw new Error('PuterService not initialized');
        }

        const {
            model = 'gpt-3.5-turbo',
            maxTokens = 2048,
            temperature = 0.7,
        } = options;

        try {
            const response = await thisputer.ai.chat(prompt, {
                model,
                max_tokens: maxTokens,
                temperature,
            });

            return response;
        } catch (error) {
            console.error('AI call failed:', error);
            throw error;
        }
    }

    /**
     * Save file to Puter.js cloud storage
     */
    async saveFile(filename, content) {
        if (!this.isInitialized) {
            throw new Error('PuterService not initialized');
        }

        try {
            const file = await thisputer.fs.write(filename, content);
            return file;
        } catch (error) {
            console.error('Failed to save file:', error);
            throw error;
        }
    }

    /**
     * Read file from Puter.js cloud storage
     */
    async readFile(filename) {
        if (!this.isInitialized) {
            throw new Error('PuterService not initialized');
        }

        try {
            const content = await thisputer.fs.read(filename);
            return content;
        } catch (error) {
            console.error('Failed to read file:', error);
            throw error;
        }
    }

    /**
     * Check if service is initialized
     */
    isReady() {
        return this.isInitialized;
    }
}
