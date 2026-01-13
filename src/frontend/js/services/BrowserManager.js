import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
// Using built-in Playwright stealth features instead of external plugin

/**
 * Singleton Browser Manager
 * Manages a persistent Playwright browser context to prevent premature closures
 * and maintain session state across agent steps.
 */
class BrowserManager {
    constructor() {
        this.browser = null;
        this.context = null;
        this.activePage = null;
        this.isLaunching = false;
        
        // Handle process signals to ensure cleanup
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }

    /**
     * Get or create the browser context.
     * @returns {Promise<{browser: import('playwright').Browser, context: import('playwright').BrowserContext, page: import('playwright').Page}>}
     */
    async getContext() {
        if (this.context && this.activePage && !this.activePage.isClosed()) {
            return { browser: this.browser, context: this.context, page: this.activePage };
        }

        if (this.isLaunching) {
            // Simple spin-wait if already launching to avoid race conditions
            while (this.isLaunching) {
                await new Promise(r => setTimeout(r, 100));
            }
            return this.getContext();
        }

        this.isLaunching = true;
        try {
            if (!this.browser || !this.browser.isConnected()) {
                logger.info('BrowserManager: Launching new browser instance with stealth...');
                this.browser = await chromium.launch({
                    headless: process.env.HEADLESS === 'true', // Allow env override
                    slowMo: 100,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-blink-features=AutomationControlled', // Remove automation flag
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--disable-extensions',
                        '--disable-plugins',
                        '--disable-default-apps',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--disable-background-networking',
                        '--disable-dev-shm-usage',
                        '--disable-ipc-flooding-protection',
                        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    ]
                });
            }

            if (!this.context) {
                logger.info('BrowserManager: Creating new context with stealth...');
                const contextOptions = {
                    viewport: { width: 1280, height: 720 },
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    locale: 'en-US',
                    timezoneId: 'America/New_York',
                    permissions: ['geolocation', 'notifications']
                };

                // Load session if exists
                const sessionPath = path.resolve(process.cwd(), 'session.json');
                if (fs.existsSync(sessionPath)) {
                    try {
                        this.context = await this.browser.newContext({ ...contextOptions, storageState: sessionPath });
                        logger.info('BrowserManager: Restored session from session.json');
                    } catch (e) {
                        logger.warn('BrowserManager: Failed to restore session, creating fresh:', e.message);
                        this.context = await this.browser.newContext(contextOptions);
                    }
                } else {
                    this.context = await this.browser.newContext(contextOptions);
                }

                // Apply additional stealth measures
                await this.context.addInitScript(() => {
                    // Remove automation indicators
                    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

                    // Randomize viewport properties
                    Object.defineProperty(screen, 'availWidth', { get: () => window.innerWidth });
                    Object.defineProperty(screen, 'availHeight', { get: () => window.innerHeight });

                    // Spoof plugins and permissions
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5].map(() => ({
                            0: { type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", __pluginName: "Chrome PDF Plugin" },
                            description: "Portable Document Format",
                            filename: "internal-pdf-viewer",
                            length: 1,
                            name: "Chrome PDF Plugin"
                        }))
                    });

                    // Spoof languages
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en']
                    });
                });

                logger.info('BrowserManager: Enhanced stealth measures applied');
            }

            if (!this.activePage || this.activePage.isClosed()) {
                this.activePage = await this.context.newPage();
            }

            return { browser: this.browser, context: this.context, page: this.activePage };
        } catch (error) {
            logger.error('BrowserManager: Fatal launch error:', error);
            throw error;
        } finally {
            this.isLaunching = false;
        }
    }

    /**
     * Save current session state to disk
     */
    async saveSession() {
        if (this.context) {
            try {
                await this.context.storageState({ path: 'session.json' });
                logger.info('BrowserManager: Session saved successfully');
            } catch (e) {
                logger.error('BrowserManager: Failed to save session:', e.message);
            }
        }
    }

    /**
     * Close everything (e.g. on app shutdown)
     */
    async cleanup() {
        if (this.browser) {
            logger.info('BrowserManager: Closing browser...');
            await this.saveSession();
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.activePage = null;
        }
    }
}

export const browserManager = new BrowserManager();
