import { logger } from '../utils/logger.js';
import { stealthService } from './stealth.js';

/**
 * Job Scraper Service
 * Implements real scraping for all 6 job platforms using Playwright with stealth mode.
 * 
 * Platforms supported:
 * - LinkedIn
 * - Indeed
 * - Glassdoor
 * - AngelList/Wellfound
 * - Otta
 * - RemoteOK
 */
export class JobScraperService {
    constructor() {
        this.stealth = stealthService;
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    /**
     * Initialize browser for scraping
     */
    async initBrowser(headless = true) {
        if (!this.browser || !this.browser.isConnected()) {
            const { chromium } = await import('playwright');
            this.browser = await chromium.launch({ 
                headless: headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            this.context = await this.browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            
            this.page = await this.context.newPage();
            
            // Apply stealth measures
            await this.stealth.applyStealth(this.page);
        }
        
        return { browser: this.browser, context: this.context, page: this.page };
    }

    /**
     * Scrape jobs from all platforms in parallel
     */
    async scrapeAllPlatforms(keywords, location = 'Remote', remoteOnly = true) {
        const platforms = ['linkedin', 'indeed', 'glassdoor', 'angelList', 'otta', 'remoteok'];
        
        const results = await Promise.allSettled(
            platforms.map(platform => 
                this.scrapePlatform(platform, keywords, location, remoteOnly)
            )
        );

        // Aggregate results
        const allJobs = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                allJobs.push(...result.value.jobs);
                logger.info(`${platforms[index]}: Found ${result.value.jobs.length} jobs`);
            } else {
                logger.warn(`${platforms[index]}: Failed - ${result.reason?.message || 'Unknown error'}`);
            }
        });

        // Deduplicate
        const uniqueJobs = this.deduplicateJobs(allJobs);
        
        return {
            success: true,
            totalJobs: uniqueJobs.length,
            jobs: uniqueJobs
        };
    }

    /**
     * Scrape jobs from a specific platform
     */
    async scrapePlatform(platform, keywords, location, remoteOnly) {
        await this.initBrowser(true);
        
        const platformConfigs = {
            linkedin: {
                name: 'LinkedIn',
                baseUrl: 'https://www.linkedin.com/jobs',
                searchPath: '/search',
                buildUrl: (k, l) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(k)}&location=${encodeURIComponent(l)}&f_WT=2`
            },
            indeed: {
                name: 'Indeed',
                baseUrl: 'https://www.indeed.com',
                searchPath: '/jobs',
                buildUrl: (k, l) => `https://www.indeed.com/jobs?q=${encodeURIComponent(k)}&l=${encodeURIComponent(l)}&from=searchhp`
            },
            glassdoor: {
                name: 'Glassdoor',
                baseUrl: 'https://www.glassdoor.com',
                searchPath: '/Job/index.htm',
                buildUrl: (k, l) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(k)}&loc=${encodeURIComponent(l)}`
            },
            angelList: {
                name: 'AngelList',
                baseUrl: 'https://wellfound.com',
                searchPath: '/jobs',
                buildUrl: (k, l) => `https://wellfound.com/jobs?search=${encodeURIComponent(k)}&remote=true`
            },
            otta: {
                name: 'Otta',
                baseUrl: 'https://otta.com',
                searchPath: '/jobs',
                buildUrl: (k, l) => `https://otta.com/jobs?q=${encodeURIComponent(k)}&remote=true`
            },
            remoteok: {
                name: 'RemoteOK',
                baseUrl: 'https://remoteok.com',
                searchPath: '/remote-ai-jobs',
                buildUrl: (k, l) => `https://remoteok.com/remote-jobs?search=${encodeURIComponent(k)}`
            }
        };

        const config = platformConfigs[platform];
        if (!config) {
            return { success: false, jobs: [], error: `Unknown platform: ${platform}` };
        }

        try {
            const url = config.buildUrl(keywords, location);
            logger.info(`Scraping ${config.name}: ${url}`);

            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.stealth.applyDelay({ action: 'page_load' });

            // Platform-specific extraction
            let jobs = [];
            switch (platform) {
                case 'linkedin':
                    jobs = await this.extractLinkedInJobs();
                    break;
                case 'indeed':
                    jobs = await this.extractIndeedJobs();
                    break;
                case 'glassdoor':
                    jobs = await this.extractGlassdoorJobs();
                    break;
                case 'angelList':
                    jobs = await this.extractAngelListJobs();
                    break;
                case 'otta':
                    jobs = await this.extractOttaJobs();
                    break;
                case 'remoteok':
                    jobs = await this.extractRemoteOKJobs();
                    break;
            }

            // Filter remote if needed
            if (remoteOnly) {
                jobs = jobs.filter(job => 
                    (job.location || '').toLowerCase().includes('remote') ||
                    (job.tags || []).some(tag => tag.toLowerCase().includes('remote'))
                );
            }

            return { success: true, jobs: jobs.map(j => ({ ...j, platform })) };

        } catch (error) {
            logger.error(`Error scraping ${platform}:`, error);
            return { success: false, jobs: [], error: error.message };
        }
    }

    /**
     * Extract LinkedIn jobs
     */
    async extractLinkedInJobs() {
        const jobs = [];
        
        try {
            // Wait for job cards to load
            await this.page.waitForSelector('.job-search-card', { timeout: 10000 }).catch(() => {});
            
            // Extract job cards
            const jobCards = await this.page.$$('.job-search-card');
            
            for (const card of jobCards.slice(0, 20)) { // Limit to 20 per platform
                try {
                    const title = await card.$eval('h3, .job-title', el => el.textContent.trim()).catch(() => 'Unknown');
                    const company = await card.$eval('.company-name, .company', el => el.textContent.trim()).catch(() => 'Unknown');
                    const location = await card.$eval('.job-location, .location', el => el.textContent.trim()).catch(() => 'Remote');
                    const url = await card.$eval('a', el => el.href).catch(() => '');
                    const date = await card.$eval('.date, .posted-date', el => el.textContent.trim()).catch(() => new Date().toISOString());
                    
                    if (title && url) {
                        jobs.push({
                            title,
                            company,
                            location: location || 'Remote',
                            url,
                            postedDate: date,
                            description: '',
                            requirements: [],
                            tags: ['LinkedIn']
                        });
                    }
                } catch (e) {
                    logger.debug('Error extracting LinkedIn job card:', e.message);
                }
            }
        } catch (error) {
            logger.warn('LinkedIn extraction issue:', error.message);
        }

        return jobs;
    }

    /**
     * Extract Indeed jobs
     */
    async extractIndeedJobs() {
        const jobs = [];
        
        try {
            await this.page.waitForSelector('.job_seen_beacon', { timeout: 10000 }).catch(() => {});
            
            const jobCards = await this.page.$$('.job_seen_beacon');
            
            for (const card of jobCards.slice(0, 20)) {
                try {
                    const title = await card.$eval('h2.jobTitle, .jobTitle', el => el.textContent.trim()).catch(() => 'Unknown');
                    const company = await card.$eval('.companyName, .company', el => el.textContent.trim()).catch(() => 'Unknown');
                    const location = await card.$eval('.companyLocation, .location', el => el.textContent.trim()).catch(() => 'Remote');
                    const url = await card.$eval('a', el => el.href).catch(() => '');
                    const salary = await card.$eval('.salaryText, .salary', el => el.textContent.trim()).catch(() => null);
                    const date = await card.$eval('.date, .postedDate', el => el.textContent.trim()).catch(() => new Date().toISOString());
                    
                    if (title && url) {
                        jobs.push({
                            title,
                            company,
                            location: location || 'Remote',
                            url,
                            postedDate: date,
                            salary: salary,
                            description: '',
                            requirements: [],
                            tags: ['Indeed']
                        });
                    }
                } catch (e) {
                    logger.debug('Error extracting Indeed job card:', e.message);
                }
            }
        } catch (error) {
            logger.warn('Indeed extraction issue:', error.message);
        }

        return jobs;
    }

    /**
     * Extract Glassdoor jobs
     */
    async extractGlassdoorJobs() {
        const jobs = [];
        
        try {
            await this.page.waitForSelector('[data-test="job-listing"]', { timeout: 10000 }).catch(() => {});
            
            const jobCards = await this.page.$$('[data-test="job-listing"], .jobCard');
            
            for (const card of jobCards.slice(0, 20)) {
                try {
                    const title = await card.$eval('[data-test="job-title"], .job-title', el => el.textContent.trim()).catch(() => 'Unknown');
                    const company = await card.$eval('[data-test="employer-name"], .employer', el => el.textContent.trim()).catch(() => 'Unknown');
                    const location = await card.$eval('[data-test="job-location"], .location', el => el.textContent.trim()).catch(() => 'Remote');
                    const url = await card.$eval('a', el => el.href).catch(() => '');
                    const rating = await card.$eval('[data-test="employer-review-star"], .rating', el => el.textContent.trim()).catch(() => null);
                    
                    if (title && url) {
                        jobs.push({
                            title,
                            company,
                            location: location || 'Remote',
                            url,
                            postedDate: new Date().toISOString(),
                            companyRating: rating,
                            description: '',
                            requirements: [],
                            tags: ['Glassdoor']
                        });
                    }
                } catch (e) {
                    logger.debug('Error extracting Glassdoor job card:', e.message);
                }
            }
        } catch (error) {
            logger.warn('Glassdoor extraction issue:', error.message);
        }

        return jobs;
    }

    /**
     * Extract AngelList/Wellfound jobs
     */
    async extractAngelListJobs() {
        const jobs = [];
        
        try {
            await this.page.waitForSelector('.job-card', { timeout: 10000 }).catch(() => {});
            
            const jobCards = await this.page.$$('.job-card');
            
            for (const card of jobCards.slice(0, 20)) {
                try {
                    const title = await card.$eval('h3, .title', el => el.textContent.trim()).catch(() => 'Unknown');
                    const company = await card.$eval('.company-name, .company', el => el.textContent.trim()).catch(() => 'Unknown');
                    const location = await card.$eval('.location, .remote', el => el.textContent.trim()).catch(() => 'Remote');
                    const url = await card.$eval('a', el => el.href).catch(() => '');
                    const equity = await card.$eval('.equity, .salary', el => el.textContent.trim()).catch(() => null);
                    const salary = await card.$eval('.salary-range, .salary', el => el.textContent.trim()).catch(() => null);
                    
                    if (title && url) {
                        jobs.push({
                            title,
                            company,
                            location: location || 'Remote',
                            url,
                            postedDate: new Date().toISOString(),
                            salary: salary || equity,
                            description: '',
                            requirements: [],
                            tags: ['Wellfound', 'AngelList']
                        });
                    }
                } catch (e) {
                    logger.debug('Error extracting AngelList job card:', e.message);
                }
            }
        } catch (error) {
            logger.warn('AngelList extraction issue:', error.message);
        }

        return jobs;
    }

    /**
     * Extract Otta jobs
     */
    async extractOttaJobs() {
        const jobs = [];
        
        try {
            await this.page.waitForSelector('[data-test="job-card"]', { timeout: 10000 }).catch(() => {});
            
            const jobCards = await this.page.$$('[data-test="job-card"], .job-card');
            
            for (const card of jobCards.slice(0, 20)) {
                try {
                    const title = await card.$eval('[data-test="job-title"], .title', el => el.textContent.trim()).catch(() => 'Unknown');
                    const company = await card.$eval('[data-test="company-name"], .company', el => el.textContent.trim()).catch(() => 'Unknown');
                    const location = await card.$eval('[data-test="location"], .location', el => el.textContent.trim()).catch(() => 'Remote');
                    const url = await card.$eval('a', el => el.href).catch(() => '');
                    const tags = await card.$$eval('[data-test="tag"], .tag', els => els.map(el => el.textContent.trim())).catch(() => []);
                    
                    if (title && url) {
                        jobs.push({
                            title,
                            company,
                            location: location || 'Remote',
                            url,
                            postedDate: new Date().toISOString(),
                            tags: tags,
                            description: '',
                            requirements: [],
                            platform: 'Otta'
                        });
                    }
                } catch (e) {
                    logger.debug('Error extracting Otta job card:', e.message);
                }
            }
        } catch (error) {
            logger.warn('Otta extraction issue:', error.message);
        }

        return jobs;
    }

    /**
     * Extract RemoteOK jobs
     */
    async extractRemoteOKJobs() {
        const jobs = [];
        
        try {
            await this.page.waitForSelector('tr.job', { timeout: 10000 }).catch(() => {});
            
            const jobRows = await this.page.$$('tr.job');
            
            for (const row of jobRows.slice(0, 20)) {
                try {
                    const title = await row.$eval('h2, .position', el => el.textContent.trim()).catch(() => 'Unknown');
                    const company = await row.$eval('.company, [data-test="company"]', el => el.textContent.trim()).catch(() => 'Unknown');
                    const location = await row.$eval('.location, .region', el => el.textContent.trim()).catch(() => 'Remote');
                    const url = await row.$eval('a', el => el.href).catch(() => '');
                    const salary = await row.$eval('.salary, .pay', el => el.textContent.trim()).catch(() => null);
                    const tags = await row.$$eval('.tags a, .tag', els => els.map(el => el.textContent.trim())).catch(() => []);
                    
                    if (title && url) {
                        jobs.push({
                            title,
                            company,
                            location: location || 'Remote',
                            url,
                            postedDate: new Date().toISOString(),
                            salary,
                            tags,
                            description: '',
                            requirements: [],
                            platform: 'RemoteOK'
                        });
                    }
                } catch (e) {
                    logger.debug('Error extracting RemoteOK job row:', e.message);
                }
            }
        } catch (error) {
            logger.warn('RemoteOK extraction issue:', error.message);
        }

        return jobs;
    }

    /**
     * Remove duplicate jobs
     */
    deduplicateJobs(jobs) {
        const seen = new Set();
        return jobs.filter(job => {
            const key = `${job.company}-${job.title}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Cleanup browser resources
     */
    async cleanup() {
        if (this.page) {
            try { await this.page.close(); } catch (e) {}
        }
        if (this.context) {
            try { await this.context.close(); } catch (e) {}
        }
        if (this.browser) {
            try { await this.browser.close(); } catch (e) {}
        }
    }
}

export const jobScraperService = new JobScraperService();
