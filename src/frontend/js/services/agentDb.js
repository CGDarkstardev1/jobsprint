import { logger } from '../utils/logger.js';
import puter from '../utils/ai-client.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * POWER USER: AgentDB Service - Smart Q&A Memory Pattern
 *
 * Advanced caching system that dramatically reduces AI API costs and improves speed:
 *
 * 1. Pattern Recognition: question → answer mapping
 * 2. Semantic Search: Find similar questions (fuzzy matching)
 * 3. Context-Aware: Store metadata with each Q&A pair
 * 4. Persistent Storage: Survives application restarts
 * 5. Analytics: Track cache hit rates and performance
 *
 * WORKFLOW:
 * - Before asking AI: query AgentDB
 * - If found in cache: use stored answer (instant, free)
 * - If not found: ask AI + store in AgentDB
 *
 * Uses JSON file storage in src/data/qa_cache/
 */
export class AgentDB {
    constructor() {
        this.cacheDir = path.join(process.cwd(), 'src/data/qa_cache');
        this.cacheFile = path.join(this.cacheDir, 'knowledge.json');
        this.cache = new Map();
        this.initialized = false;

        // POWER USER: Analytics tracking
        this.stats = {
            hits: 0,
            misses: 0,
            totalQueries: 0,
            totalStored: 0,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Initialize the database by loading from disk
     */
    async init() {
        try {
            // Ensure directory exists
            await fs.mkdir(this.cacheDir, { recursive: true });

            // Load existing cache
            const data = await fs.readFile(this.cacheFile, 'utf8');
            const entries = JSON.parse(data);

            // Populate Map
            for (const [question, answer] of Object.entries(entries)) {
                this.cache.set(question, answer);
            }

            this.initialized = true;
            logger.info(`AgentDB initialized with ${this.cache.size} cached entries`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist yet - start fresh
                this.initialized = true;
                logger.info('AgentDB initialized (new cache)');
            } else {
                logger.error('AgentDB initialization failed:', error);
                throw error;
            }
        }
    }

    /**
     * POWER USER: Query the database for an answer to a question
     *
     * First checks exact match, then semantic similarity search
     *
     * @param {string} question - The question to query
     * @param {Object} options - Query options
     * @param {boolean} options.searchSimilar - Enable fuzzy search (default: true)
     * @param {number} options.similarityThreshold - Minimum similarity score (0-1)
     * @returns {Promise<{answer: string|null, cached: boolean, metadata: Object}>} - Answer with metadata
     */
    async query(question, options = {}) {
        if (!this.initialized) {
            await this.init();
        }

        const {
            searchSimilar = true,
            similarityThreshold = 0.7
        } = options;

        this.stats.totalQueries++;

        // Try exact match first
        const normalizedQuestion = this._normalizeQuestion(question);
        const exactMatch = this.cache.get(normalizedQuestion);

        if (exactMatch) {
            this.stats.hits++;
            logger.debug(`POWER USER: Cache HIT (exact) for: ${question.substring(0, 50)}...`);

            return {
                answer: exactMatch.answer || exactMatch, // Support both formats
                cached: true,
                matchType: 'exact',
                metadata: exactMatch.metadata || {}
            };
        }

        // Try semantic similarity search
        if (searchSimilar) {
            const similar = await this.searchSimilar(question, 1);

            if (similar.length > 0 && similar[0].score >= similarityThreshold) {
                this.stats.hits++;
                logger.debug(`POWER USER: Cache HIT (similar, score: ${similar[0].score.toFixed(2)}) for: ${question.substring(0, 50)}...`);

                return {
                    answer: similar[0].answer,
                    cached: true,
                    matchType: 'similar',
                    similarity: similar[0].score,
                    metadata: similar[0].metadata || {}
                };
            }
        }

        // Cache miss
        this.stats.misses++;
        logger.debug(`POWER USER: Cache MISS for: ${question.substring(0, 50)}...`);

        return {
            answer: null,
            cached: false,
            matchType: 'none'
        };
    }

    /**
     * POWER USER: Store a question-answer pair in the cache
     *
     * Stores Q&A with metadata for context and analytics
     *
     * @param {string} question - The question
     * @param {string} answer - The answer to cache
     * @param {Object} metadata - Optional metadata
     * @param {string} metadata.category - Q&A category
     * @param {string} metadata.source - AI model used
     * @param {Object} metadata.context - Additional context
     */
    async store(question, answer, metadata = {}) {
        if (!this.initialized) {
            await this.init();
        }

        const normalizedQuestion = this._normalizeQuestion(question);

        // Create enhanced cache entry with metadata
        const cacheEntry = {
            answer,
            metadata: {
                cachedAt: new Date().toISOString(),
                ...metadata
            }
        };

        // Store in memory
        this.cache.set(normalizedQuestion, cacheEntry);

        // Persist to disk
        await this._persist();

        this.stats.totalStored++;

        logger.debug(`POWER USER: Cached answer for: ${question.substring(0, 50)}...`);
    }

    /**
     * Clear all cached entries
     */
    async clear() {
        this.cache.clear();
        await this._persist();
        logger.info('AgentDB cache cleared');
    }

    /**
     * POWER USER: Get comprehensive cache statistics
     *
     * @returns {Object} - Statistics including hit rate and performance
     */
    getStats() {
        const hitRate = this.stats.totalQueries > 0
            ? (this.stats.hits / this.stats.totalQueries * 100).toFixed(1)
            : '0.0';

        return {
            totalEntries: this.cache.size,
            initialized: this.initialized,
            cacheFile: this.cacheFile,
            performance: {
                totalQueries: this.stats.totalQueries,
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: `${hitRate}%`,
                costSaved: `${this.stats.hits} AI API calls saved`
            },
            metadata: {
                createdAt: this.stats.createdAt,
                lastUpdated: new Date().toISOString()
            }
        };
    }

    /**
     * Normalize question for consistent lookup
     * @private
     */
    _normalizeQuestion(question) {
        return question
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, ''); // Remove punctuation for fuzzy matching
    }

    /**
     * Persist cache to disk
     * @private
     */
    async _persist() {
        try {
            const entries = Object.fromEntries(this.cache);
            await fs.writeFile(
                this.cacheFile,
                JSON.stringify(entries, null, 2),
                'utf8'
            );
        } catch (error) {
            logger.error('Failed to persist AgentDB cache:', error);
            throw error;
        }
    }

    /**
     * Batch query multiple questions
     * @param {Array<string>} questions - Array of questions
     * @returns {Promise<Array<{question: string, answer: string|null}>>}
     */
    async batchQuery(questions) {
        const results = [];
        for (const question of questions) {
            const answer = await this.query(question);
            results.push({ question, answer });
        }
        return results;
    }

    /**
     * Batch store multiple Q&A pairs
     * @param {Array<{question: string, answer: string}>} entries
     */
    async batchStore(entries) {
        for (const { question, answer } of entries) {
            await this.store(question, answer);
        }
    }

    /**
     * POWER USER: Query with AI fallback (Smart Q&A Pattern)
     *
     * This is the MAIN method to use. It implements the complete pattern:
     * 1. Check cache first (instant)
     * 2. If cache miss, ask AI
     * 3. Store AI response in cache
     * 4. Return answer
     *
     * @param {string} question - The question to answer
     * @param {Object} aiPromptOptions - Options for AI prompt if cache miss
     * @param {string} aiPromptOptions.systemPrompt - System prompt for AI
     * @param {string} aiPromptOptions.model - AI model to use (default: claude-sonnet-4-5)
     * @param {number} aiPromptOptions.maxTokens - Max tokens for AI response
     * @returns {Promise<{answer: string, cached: boolean, metadata: Object}>} - Answer with source info
     */
    async queryWithAIFallback(question, aiPromptOptions = {}) {
        // Try cache first
        const cachedResult = await this.query(question);

        if (cachedResult.cached) {
            logger.info(`POWER USER: Using cached answer for: ${question.substring(0, 50)}...`);
            return cachedResult;
        }

        // Cache miss - ask AI
        logger.info(`POWER USER: Cache miss, asking AI for: ${question.substring(0, 50)}...`);

        try {
            const {
                systemPrompt = 'You are a helpful assistant.',
                model = 'claude-sonnet-4-5',
                maxTokens = 2000
            } = aiPromptOptions;

            const fullPrompt = `${systemPrompt}\n\nQuestion: ${question}`;

            const response = await puter.ai.chat(
                fullPrompt,
                {
                    model,
                    max_tokens: maxTokens
                }
            );

            if (!response?.message?.content) {
                throw new Error('Invalid AI response');
            }

            const answer = response.message.content;

            // Store in cache for future
            await this.store(question, answer, {
                source: model,
                category: 'ai-generated',
                promptLength: fullPrompt.length
            });

            logger.info('POWER USER: AI answer cached successfully');

            return {
                answer,
                cached: false,
                matchType: 'ai-generated',
                metadata: {
                    source: model,
                    generatedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            logger.error('POWER USER: AI fallback failed:', error);
            throw new Error(`AI query failed: ${error.message}`);
        }
    }

    /**
     * POWER USER: Search for similar questions (fuzzy match)
     *
     * Uses Jaccard similarity to find semantically similar questions
     *
     * @param {string} question - The question to search for
     * @param {number} limit - Maximum results to return
     * @returns {Promise<Array<{question: string, answer: string, score: number, metadata: Object}>>}
     */
    async searchSimilar(question, limit = 5) {
        if (!this.initialized) {
            await this.init();
        }

        const normalizedInput = this._normalizeQuestion(question);
        const results = [];

        for (const [cachedQuestion, cacheEntry] of this.cache.entries()) {
            const score = this._calculateSimilarity(normalizedInput, cachedQuestion);

            if (score > 0.3) { // Threshold for similarity
                // Handle both old format (string) and new format (object with answer/metadata)
                const answer = cacheEntry.answer || cacheEntry;
                const metadata = cacheEntry.metadata || {};

                results.push({
                    question: cachedQuestion,
                    answer,
                    score,
                    metadata
                });
            }
        }

        // Sort by similarity score descending
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, limit);
    }

    /**
     * Calculate similarity between two strings (simple Jaccard-like)
     * @private
     */
    _calculateSimilarity(str1, str2) {
        const words1 = new Set(str1.split(' '));
        const words2 = new Set(str2.split(' '));

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }
}

// Export singleton instance
export const agentDB = new AgentDB();
