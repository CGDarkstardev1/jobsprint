import { logger } from '../utils/logger.js';

/**
 * Stealth Mode Service - Human-like Browser Automation
 *
 * Implements sophisticated anti-detection mechanisms to make automation
 * indistinguishable from human behavior:
 *
 * 1. Randomized Delays: Variable timing between actions (500ms - 3000ms)
 * 2. Mouse Curve Simulation: Bezier curve trajectories instead of linear movement
 * 3. Human-like Typing: Variable keystroke speeds with natural pauses
 * 4. Behavioral Patterns: Mimics human browsing habits
 *
 * @class StealthService
 * @description Advanced stealth features for undetectable automation
 */
export class StealthService {
    constructor(config = {}) {
        // Configuration with sensible defaults
        this.config = {
            // Random delay range between actions (ms)
            minDelay: config.minDelay || 500,
            maxDelay: config.maxDelay || 3000,

            // Typing behavior
            minTypingDelay: config.minTypingDelay || 50,
            maxTypingDelay: config.maxTypingDelay || 200,
            typingPauseChance: config.typingPauseChance || 0.15, // 15% chance of pause

            // Mouse movement
            enableMouseCurves: config.enableMouseCurves !== false,
            mouseSpeed: config.mouseSpeed || 1.0,

            // Reading simulation (time to "read" content)
            enableReadingSimulation: config.enableReadingSimulation !== false,
            readingSpeed: config.readingSpeed || 200, // words per minute
        };

        // Behavioral patterns
        this.lastActionTime = Date.now();
        this.actionCount = 0;
    }

    /**
     * Apply stealth delay with randomized timing
     * Uses natural distribution patterns instead of fixed delays
     *
     * @param {Object} options - Delay options
     * @param {number} options.min - Minimum delay in ms (overrides config)
     * @param {number} options.max - Maximum delay in ms (overrides config)
     * @param {string} options.action - Action type for context-aware delays
     * @returns {Promise<number>} - Actual delay applied
     */
    async applyDelay(options = {}) {
        const min = options.min || this.config.minDelay;
        const max = options.max || this.config.maxDelay;

        // Context-aware delays based on action type
        let adjustedMin = min;
        let adjustedMax = max;

        if (options.action) {
            switch (options.action) {
                case 'typing':
                    // Shorter delays for typing (more natural flow)
                    adjustedMin = this.config.minTypingDelay;
                    adjustedMax = this.config.maxTypingDelay;
                    break;

                case 'reading':
                    // Longer delays for reading/processing content
                    if (this.config.enableReadingSimulation) {
                        adjustedMin = 1000;
                        adjustedMax = 3000;
                    }
                    break;

                case 'navigation':
                    // Moderate delays for page navigation
                    adjustedMin = 1500;
                    adjustedMax = 4000;
                    break;

                case 'click':
                    // Quick decision time before clicking
                    adjustedMin = 300;
                    adjustedMax = 1200;
                    break;

                case 'form_fill':
                    // Longer pauses when filling forms (more deliberate)
                    adjustedMin = 800;
                    adjustedMax = 2000;
                    break;
            }
        }

        // Generate delay with natural distribution (bell curve approximation)
        const delay = this._naturalRandom(adjustedMin, adjustedMax);

        logger.debug(`Stealth delay: ${delay}ms (action: ${options.action || 'general'})`);

        await this._sleep(delay);
        this.lastActionTime = Date.now();
        this.actionCount++;

        return delay;
    }

    /**
     * Simulate human-like typing with variable speeds and natural pauses
     *
     * @param {import('playwright').Page} page - Playwright page instance
     * @param {string} selector - CSS selector for input field
     * @param {string} text - Text to type
     * @param {Object} options - Typing options
     * @param {number} options.delay - Delay before starting (ms)
     * @param {boolean} options.clear - Clear field before typing
     * @returns {Promise<void>}
     */
    async humanTyping(page, selector, text, options = {}) {
        logger.debug(`Human typing: ${text.substring(0, 20)}... into ${selector}`);

        // Pre-typing delay (decision time)
        if (options.delay !== 0) {
            await this.applyDelay({ action: 'typing' });
        }

        // Clear field if requested
        if (options.clear) {
            try {
                await page.fill(selector, '', { timeout: 2000 });
                await this.applyDelay({ min: 100, max: 300 });
            } catch (e) {
                logger.warn(`Could not clear field ${selector}: ${e.message}`);
            }
        }

        // Type character by character with variable delays
        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Variable typing speed per character
            const charDelay = this._naturalRandom(
                this.config.minTypingDelay,
                this.config.maxTypingDelay
            );

            // Occasional longer pauses (thinking, re-reading)
            if (Math.random() < this.config.typingPauseChance) {
                const pauseDelay = this._naturalRandom(300, 800);
                logger.debug(`Typing pause: ${pauseDelay}ms`);
                await this._sleep(pauseDelay);
            }

            // Type the character
            try {
                await page.type(selector, char, { delay: charDelay });
            } catch (e) {
                logger.error(`Error typing character: ${e.message}`);
                throw e;
            }

            // Micro-pause after space/punctuation (natural rhythm)
            if (char === ' ' || char === '.' || char === ',') {
                await this._sleep(this._naturalRandom(50, 150));
            }
        }

        logger.debug(`Human typing completed: ${text.length} characters`);
    }

    /**
     * Simulate mouse movement with bezier curve trajectory
     * Creates natural, curved paths instead of linear movement
     *
     * @param {import('playwright').Page} page - Playwright page instance
     * @param {Object} target - Target element coordinates
     * @param {number} target.x - Target X coordinate
     * @param {number} target.y - Target Y coordinate
     * @param {Object} options - Movement options
     * @param {number} options.duration - Movement duration (ms)
     * @param {number} options.steps - Number of intermediate points
     * @returns {Promise<void>}
     */
    async mouseCurve(page, target, options = {}) {
        if (!this.config.enableMouseCurves) {
            // Fallback to direct click
            return await page.mouse.move(target.x, target.y);
        }

        const duration = options.duration || 500;
        const steps = options.steps || 20;

        // Get current mouse position (default to center of viewport)
        const viewportSize = page.viewportSize();
        const start = {
            x: viewportSize.width / 2,
            y: viewportSize.height / 2
        };

        // Generate bezier curve control points
        const controlPoints = this._generateBezierControlPoints(start, target);

        logger.debug(`Mouse curve: (${start.x}, ${start.y}) -> (${target.x}, ${target.y})`);

        // Move mouse along curve with intermediate points
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this._bezierPoint(start, controlPoints[0], controlPoints[1], target, t);

            await page.mouse.move(point.x, point.y);
            await this._sleep(duration / steps);
        }

        logger.debug('Mouse curve completed');
    }

    /**
     * Simulate reading content with appropriate delays
     *
     * @param {string} content - Content being "read"
     * @param {number} wordCount - Number of words to simulate reading
     * @returns {Promise<number>} - Reading time in ms
     */
    async simulateReading(content, wordCount = null) {
        if (!this.config.enableReadingSimulation) {
            return 0;
        }

        // Estimate word count if not provided
        const words = wordCount || (content ? content.split(/\s+/).length : 100);

        // Calculate reading time based on reading speed
        const readingTimeMs = (words / this.config.readingSpeed) * 60 * 1000;

        // Add natural variation (±20%)
        const actualTime = this._naturalRandom(
            readingTimeMs * 0.8,
            readingTimeMs * 1.2
        );

        logger.debug(`Simulating reading ${words} words: ${Math.round(actualTimeMs)}ms`);

        await this._sleep(actualTime);

        return actualTime;
    }

    /**
     * Simulate human-like click with preparation delay
     *
     * @param {import('playwright').Page} page - Playwright page instance
     * @param {string} selector - CSS selector for element
     * @param {Object} options - Click options
     * @returns {Promise<void>}
     */
    async humanClick(page, selector, options = {}) {
        logger.debug(`Human click: ${selector}`);

        // Decision time before clicking
        await this.applyDelay({ action: 'click' });

        // Get element position for mouse curve
        try {
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Element not found: ${selector}`);
            }

            const box = await element.boundingBox();
            if (!box) {
                throw new Error(`Could not get bounding box for: ${selector}`);
            }

            // Move mouse with curve to center of element
            const target = {
                x: box.x + box.width / 2,
                y: box.y + box.height / 2
            };

            await this.mouseCurve(page, target, { duration: 300 });

            // Small pause before actual click (hover time)
            await this._sleep(this._naturalRandom(100, 300));

            // Perform click
            await page.click(selector, options);

        } catch (e) {
            logger.error(`Error in human click: ${e.message}`);
            // Fallback to direct click
            await page.click(selector, options);
        }
    }

    /**
     * Simulate form-filling behavior with natural delays
     *
     * @param {import('playwright').Page} page - Playwright page instance
     * @param {Object} formData - Form data object
     * @param {Object} selectors - CSS selectors for form fields
     * @returns {Promise<void>}
     */
    async humanFormFill(page, formData, selectors) {
        logger.debug('Human form filling started');

        for (const [field, value] of Object.entries(formData)) {
            const selector = selectors[field];

            if (!selector) {
                logger.warn(`No selector for field: ${field}`);
                continue;
            }

            // Focus delay (time to locate and focus on field)
            await this.applyDelay({ min: 300, max: 800 });

            // Type value with human-like behavior
            await this.humanTyping(page, selector, value, {
                clear: true,
                delay: 0 // No extra delay, already applied above
            });

            // Brief pause after field completion
            await this.applyDelay({ min: 200, max: 500 });
        }

        logger.debug('Human form filling completed');
    }

    /**
     * Simulate page scroll with natural behavior
     *
     * @param {import('playwright').Page} page - Playwright page instance
     * @param {number} distance - Scroll distance in pixels
     * @param {string} direction - Scroll direction ('up' or 'down')
     * @returns {Promise<void>}
     */
    async humanScroll(page, distance = 500, direction = 'down') {
        logger.debug(`Human scroll: ${direction} ${distance}px`);

        // Decision time before scrolling
        await this.applyDelay({ min: 200, max: 600 });

        // Scroll in smaller increments for natural feel
        const increments = 5;
        const incrementDistance = distance / increments;

        for (let i = 0; i < increments; i++) {
            await page.evaluate(
                (dist, dir) => {
                    window.scrollBy(0, dir === 'down' ? dist : -dist);
                },
                incrementDistance,
                direction
            );

            // Small pause between scroll increments
            await this._sleep(this._naturalRandom(50, 150));
        }

        logger.debug('Human scroll completed');
    }

    /**
     * Generate random delay with natural distribution
     * Approximates a bell curve using multiple random samples
     *
     * @private
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Random value with natural distribution
     */
    _naturalRandom(min, max) {
        // Use 3 random samples and average them (central limit theorem)
        let sum = 0;
        for (let i = 0; i < 3; i++) {
            sum += Math.random() * (max - min) + min;
        }
        return sum / 3;
    }

    /**
     * Generate control points for bezier curve
     *
     * @private
     * @param {Object} start - Starting point {x, y}
     * @param {Object} end - Ending point {x, y}
     * @returns {Array<Object>} - Two control points
     */
    _generateBezierControlPoints(start, end) {
        // Calculate midpoint
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Add random offset to control points (creates curve)
        const offset = 100;

        const cp1 = {
            x: midX + this._naturalRandom(-offset, offset),
            y: midY + this._naturalRandom(-offset, offset)
        };

        const cp2 = {
            x: midX + this._naturalRandom(-offset, offset),
            y: midY + this._naturalRandom(-offset, offset)
        };

        return [cp1, cp2];
    }

    /**
     * Calculate point on cubic bezier curve
     *
     * @private
     * @param {Object} p0 - Start point
     * @param {Object} p1 - Control point 1
     * @param {Object} p2 - Control point 2
     * @param {Object} p3 - End point
     * @param {number} t - Interpolation parameter (0-1)
     * @returns {Object} - Point on curve {x, y}
     */
    _bezierPoint(p0, p1, p2, p3, t) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        return {
            x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
        };
    }

    /**
     * Sleep for specified milliseconds
     *
     * @private
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get stealth statistics
     *
     * @returns {Object} - Statistics object
     */
    getStats() {
        return {
            totalActions: this.actionCount,
            lastActionTime: new Date(this.lastActionTime).toISOString(),
            config: this.config
        };
    }

    /**
     * Reset stealth state
     */
    reset() {
        this.lastActionTime = Date.now();
        this.actionCount = 0;
        logger.debug('Stealth state reset');
    }
}

export const stealthService = new StealthService();
